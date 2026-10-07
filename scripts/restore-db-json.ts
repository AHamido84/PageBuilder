/**
 * Restores a JSON backup made by scripts/backup-db-json.ts into a NON-production database whose
 * schema was already created with `prisma migrate deploy`.
 *
 *   npx tsx scripts/restore-db-json.ts <backup.json>            # dry run: shows what would load
 *   npx tsx scripts/restore-db-json.ts <backup.json> --apply    # empties those tables, then loads
 *
 * - Refuses the production host (ep-quiet-band) unless --allow-production is passed: that is only
 *   for disaster recovery (docs/DISASTER-RECOVERY.md), when the live data itself must be replaced.
 *   A brand-new database (any host) needs no flag.
 * - `_prisma_migrations` is never restored (the target keeps its own migration history).
 * - Columns the backup doesn't have (added by later migrations) keep their defaults; backup
 *   columns the target doesn't have are reported and skipped.
 * - Tables load in foreign-key order; self-referencing rows (parent before child) too.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const PROD_HOST = "ep-quiet-band";
const prisma = new PrismaClient();
type Row = Record<string, unknown>;

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function main() {
  const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const apply = process.argv.includes("--apply");
  if (!file) throw new Error("usage: restore-db-json.ts <backup.json> [--apply]");
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes(PROD_HOST) && !process.argv.includes("--allow-production")) {
    throw new Error("Refusing to run: DATABASE_URL points at the production database (pass --allow-production for disaster recovery).");
  }
  const host = new URL(url).hostname.split(".")[0];

  const backup = JSON.parse(readFileSync(file, "utf8")) as { host: string; takenAt: string; tables: Record<string, Row[]> };
  console.log(`Backup of ${backup.host} taken ${backup.takenAt} -> target ${host}${apply ? "" : " (dry run)"}`);

  const columns = await prisma.$queryRaw<{ table_name: string; column_name: string; data_type: string; udt_name: string }[]>`
    SELECT table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public'`;
  const fks = await prisma.$queryRaw<{ child: string; child_col: string; parent: string; parent_col: string }[]>`
    SELECT tc.table_name AS child, kcu.column_name AS child_col, ccu.table_name AS parent, ccu.column_name AS parent_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`;

  const targetTables = new Set(columns.map((c) => c.table_name));
  const tables = Object.keys(backup.tables).filter((t) => t !== "_prisma_migrations");
  const missing = tables.filter((t) => !targetTables.has(t));
  if (missing.length) throw new Error(`Target is missing tables: ${missing.join(", ")}`);

  // Foreign-key order (parents first); self-references handled per row below.
  const order: string[] = [];
  const pending = new Set(tables);
  while (pending.size) {
    const ready = [...pending].filter((t) => fks.every((fk) => fk.child !== t || fk.parent === t || !pending.has(fk.parent)));
    if (!ready.length) throw new Error(`Foreign-key cycle between: ${[...pending].join(", ")}`);
    for (const t of ready.sort()) {
      order.push(t);
      pending.delete(t);
    }
  }

  for (const t of order) console.log(`  ${t}: ${backup.tables[t].length}`);
  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to load.");
    return;
  }

  // Empty the target tables first (migrations seed a few defaults, e.g. media folders).
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map(q).join(", ")} CASCADE`);

  for (const t of order) {
    let rows = backup.tables[t];
    if (!rows.length) continue;
    const cols = columns.filter((c) => c.table_name === t);
    const byName = new Map(cols.map((c) => [c.column_name, c]));
    const backupCols = Object.keys(rows[0]);
    const skipped = backupCols.filter((c) => !byName.has(c));
    if (skipped.length) console.log(`  ${t}: skipping columns not in the target: ${skipped.join(", ")}`);
    const use = backupCols.filter((c) => byName.has(c));

    // Self-reference (e.g. parentId): parents before children.
    const self = fks.filter((fk) => fk.child === t && fk.parent === t);
    if (self.length) {
      const sorted: Row[] = [];
      const done = new Set<unknown>();
      let rest = rows;
      while (rest.length) {
        const next = rest.filter((r) => self.every((fk) => r[fk.child_col] == null || done.has(r[fk.child_col]) || r[fk.child_col] === r[fk.parent_col]));
        if (!next.length) throw new Error(`${t}: unresolvable self-reference`);
        for (const r of next) {
          sorted.push(r);
          done.add(r[self[0].parent_col]);
        }
        rest = rest.filter((r) => !next.includes(r));
      }
      rows = sorted;
    }

    const cast = (col: string) => {
      const c = byName.get(col)!;
      if (c.data_type === "ARRAY") return `::${c.udt_name.startsWith("_") ? (["_text", "_varchar", "_int4", "_int8", "_bool", "_float8"].includes(c.udt_name) ? c.udt_name.slice(1) : q(c.udt_name.slice(1))) : c.udt_name}[]`;
      if (c.data_type === "USER-DEFINED") return `::${q(c.udt_name)}`;
      return `::${c.udt_name}`;
    };
    const value = (col: string, v: unknown) => {
      const c = byName.get(col)!;
      if (v === null || v === undefined) return null;
      if (c.udt_name === "jsonb" || c.udt_name === "json") return JSON.stringify(v);
      if (c.data_type === "ARRAY") return v;
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };

    const chunk = Math.max(1, Math.floor(30000 / use.length));
    for (let i = 0; i < rows.length; i += chunk) {
      const part = rows.slice(i, i + chunk);
      const params: unknown[] = [];
      const tuples = part.map((r) => `(${use.map((col) => (params.push(value(col, r[col])), `$${params.length}${cast(col)}`)).join(", ")})`);
      await prisma.$executeRawUnsafe(`INSERT INTO ${q(t)} (${use.map(q).join(", ")}) VALUES ${tuples.join(", ")}`, ...params);
    }
    console.log(`  loaded ${t}: ${rows.length}`);
  }
  console.log("\nRestore complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
