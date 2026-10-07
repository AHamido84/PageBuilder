/**
 * Puts the media files of a full backup (scripts/backup-production.ts) back online and points the
 * database at them. Run AFTER restoring the database (scripts/restore-db-json.ts).
 *
 *   npx tsx scripts/restore-media.ts <backup-dir> --local          # dry run
 *   npx tsx scripts/restore-media.ts <backup-dir> --local --apply  # copy + rewrite URLs
 *   npx tsx scripts/restore-media.ts <backup-dir> --blob  --apply  # upload + rewrite URLs
 *
 * --local  copies the files into public/restored-media/ and rewrites every stored URL to
 *          /restored-media/<path> -- the site then serves its own media, on any host, with no
 *          storage account. Commit public/restored-media/ (or keep it in the folder you deploy).
 * --blob   uploads every file to the Vercel Blob store of BLOB_READ_WRITE_TOKEN (same paths) and
 *          rewrites every stored URL to that store.
 *
 * The rewrite is a plain text replace of the old storage origin in every text / json / text[]
 * column of DATABASE_URL (Media rows, page content, published snapshots, settings, ...). Each file is
 * checked against its sha256 first. Idempotent: a second run finds nothing left to rewrite.
 */
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type ManifestEntry = { url: string; file: string; bytes: number; sha256: string; contentType: string };

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const mode = process.argv.includes("--blob") ? "blob" : process.argv.includes("--local") ? "local" : null;
const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function main() {
  const dir = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!dir || !mode) throw new Error("usage: restore-media.ts <backup-dir> --local|--blob [--apply]");
  const manifest = JSON.parse(readFileSync(path.join(dir, "media/manifest.json"), "utf8")) as ManifestEntry[];

  // Integrity first: every file must match the checksum taken at backup time.
  for (const m of manifest) {
    const buf = readFileSync(path.join(dir, m.file));
    if (createHash("sha256").update(buf).digest("hex") !== m.sha256) throw new Error(`Checksum mismatch: ${m.file}`);
  }
  console.log(`${manifest.length} files verified.`);

  // Old origin -> new origin (same paths underneath).
  const oldOrigins = [...new Set(manifest.map((m) => new URL(m.url).origin + "/"))];
  let newOrigin: string;
  if (mode === "local") {
    newOrigin = "/restored-media/";
    if (apply) {
      for (const m of manifest) {
        const target = path.join("public/restored-media", new URL(m.url).pathname.replace(/^\/+/, ""));
        mkdirSync(path.dirname(target), { recursive: true });
        copyFileSync(path.join(dir, m.file), decodeURIComponent(target));
      }
      console.log(`Copied ${manifest.length} files into public/restored-media/.`);
    }
  } else {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Set BLOB_READ_WRITE_TOKEN for --blob.");
    if (!apply) {
      newOrigin = "<new blob store>/";
    } else {
      const { put } = await import("@vercel/blob");
      let origin = "";
      for (const m of manifest) {
        const pathname = decodeURIComponent(new URL(m.url).pathname.replace(/^\/+/, ""));
        const blob = await put(pathname, readFileSync(path.join(dir, m.file)), {
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: m.contentType,
        });
        origin = new URL(blob.url).origin + "/";
      }
      newOrigin = origin;
      console.log(`Uploaded ${manifest.length} files to ${newOrigin}`);
    }
  }

  // Rewrite every stored reference.
  const columns = await prisma.$queryRaw<{ table_name: string; column_name: string; data_type: string; udt_name: string }[]>`
    SELECT c.table_name, c.column_name, c.data_type, c.udt_name FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.table_name <> '_prisma_migrations'
      AND (c.data_type IN ('text', 'character varying', 'json', 'jsonb') OR c.udt_name = '_text')`;
  let total = 0;
  for (const oldOrigin of oldOrigins) {
    for (const col of columns) {
      const cast = col.data_type === "ARRAY" ? "text[]" : col.data_type === "character varying" ? "varchar" : col.data_type;
      const where = `${q(col.column_name)}::text LIKE $1`;
      const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM ${q(col.table_name)} WHERE ${where}`, `%${oldOrigin}%`);
      if (!Number(count)) continue;
      total += Number(count);
      console.log(`  ${col.table_name}.${col.column_name}: ${count} row(s)`);
      if (apply) {
        await prisma.$executeRawUnsafe(
          `UPDATE ${q(col.table_name)} SET ${q(col.column_name)} = replace(${q(col.column_name)}::text, $2, $3)::${cast} WHERE ${where}`,
          `%${oldOrigin}%`,
          oldOrigin,
          newOrigin
        );
      }
    }
  }
  console.log(`\n${apply ? "Rewrote" : "Would rewrite"} ${total} row(s): ${oldOrigins.join(", ")} -> ${newOrigin}`);
  if (!apply) console.log("Dry run -- re-run with --apply.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
