/**
 * Read-only logical backup: every table in the `public` schema (including Prisma's implicit
 * many-to-many tables like "_ProductImages") -> one JSON file. For when pg_dump isn't installed.
 *
 *   DATABASE_URL="<url>" npx tsx scripts/backup-db-json.ts <out.json>
 */
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("usage: backup-db-json.ts <out.json>");
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;
  const dump: Record<string, unknown[]> = {};
  for (const { table_name } of tables) {
    dump[table_name] = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${table_name.replace(/"/g, '""')}"`);
    console.log(`${table_name}: ${dump[table_name].length}`);
  }
  const host = new URL(process.env.DATABASE_URL ?? "").hostname.split(".")[0];
  writeFileSync(out, JSON.stringify({ host, takenAt: new Date().toISOString(), tables: dump }, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
  console.log(`\nWrote ${out}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
