/**
 * Full production backup in one command -- everything needed to bring the site back on any host.
 * Read-only against the database and the media storage. See docs/DISASTER-RECOVERY.md.
 *
 *   DATABASE_URL="<production url>" npx tsx scripts/backup-production.ts [out-dir]
 *
 * Writes <out-dir> (default design-assets/backups/full-<timestamp>/) and <out-dir>.zip:
 *   code/PageBuilder.bundle     full git history (git clone PageBuilder.bundle site)
 *   code/source.zip             the committed source tree at the backed-up commit
 *   database/database.json      every table (scripts/restore-db-json.ts loads it)
 *   media/files/<path>          every uploaded file (images, videos, PDFs) from Vercel Blob
 *   media/manifest.json         original URL -> file, size, sha256 (scripts/restore-media.ts)
 *   env/ENV-VARIABLES.md        the environment variables to set on the new host (names only)
 *   RESTORE.md                  the step-by-step restore guide
 *   BACKUP-INFO.json            when, which commit, counts, sizes, any problems
 *
 * Secrets (database password, session secret, Blob token, SMTP) are NOT written -- keep them in a
 * password manager. The backup folder is gitignored (design-assets/); copy the .zip off this machine.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const BLOB_URL = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'\\)<>]+/g;

const ENV_VARIABLES = `# Environment variables for the restored site

Set these on the new host (Vercel: Project -> Settings -> Environment Variables -> Production).
Values marked SECRET are not in this backup -- take them from your password manager, or create new ones.

| Variable | Required | Value |
|---|---|---|
| DATABASE_URL | yes | SECRET -- connection string of the (new) PostgreSQL database |
| SESSION_SECRET | yes | SECRET -- any random string of 32+ characters (\`openssl rand -base64 32\`). A new one only logs admins out. |
| NEXT_PUBLIC_SITE_URL | yes | https://www.goldensevenfoods.com |
| BLOB_READ_WRITE_TOKEN | for admin uploads | SECRET -- Vercel Blob store token (Vercel -> Storage -> Blob). Without it the site works but admins cannot upload new media. |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM | optional | SECRET -- new-lead email notifications; skipped when unset |
| SITE_BRAND | optional | golden-seven (forces the Golden Seven identity on any host name) |
| VARIANTS_ENABLED, TEXT_STYLES_ENABLED, PRODUCTS_PAGE_BUILDER | optional | leave unset (the admin switches in the database decide) |
| SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME | no | only for seeding an empty database -- not needed when restoring a backup |
`;

function run(cmd: string, args: string[], opts: { env?: NodeJS.ProcessEnv; cwd?: string } = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: opts.env ?? process.env, cwd: opts.cwd });
}

const sha256 = (buf: Buffer) => createHash("sha256").update(buf).digest("hex");
const timestamp = () => new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Set DATABASE_URL to the production database.");
  const out = path.resolve(process.argv[2] ?? `design-assets/backups/full-${timestamp()}`);
  if (existsSync(out)) throw new Error(`${out} already exists`);
  for (const dir of ["code", "database", "media/files", "env"]) mkdirSync(path.join(out, dir), { recursive: true });
  const problems: string[] = [];

  // 1. Code -- the committed tree; uncommitted changes are NOT in the backup, so say so.
  const commit = run("git", ["rev-parse", "HEAD"]).trim();
  const dirty = run("git", ["status", "--porcelain"]).trim();
  if (dirty) problems.push(`Uncommitted changes were not backed up:\n${dirty}`);
  run("git", ["bundle", "create", path.join(out, "code/PageBuilder.bundle"), "--all"]);
  run("git", ["archive", "--format=zip", "-o", path.join(out, "code/source.zip"), "HEAD"]);
  console.log(`code: commit ${commit.slice(0, 7)}${dirty ? " (working tree has uncommitted changes -- not included)" : ""}`);

  // 2. Database -- every table as JSON (same format scripts/restore-db-json.ts loads).
  const dbFile = path.join(out, "database/database.json");
  // tsx through this Node binary, no shell -- paths with spaces stay intact on Windows.
  run(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), "scripts/backup-db-json.ts", dbFile]);
  const dump = JSON.parse(readFileSync(dbFile, "utf8")) as { host: string; takenAt: string; tables: Record<string, unknown[]> };
  const rowCount = Object.values(dump.tables).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`database: ${Object.keys(dump.tables).length} tables, ${rowCount} rows (${dump.host})`);

  // 3. Media -- every Blob URL referenced anywhere in the data (Media rows, page content, settings).
  const urls = [...new Set(JSON.stringify(dump.tables).match(BLOB_URL) ?? [])].sort();
  const manifest: { url: string; file: string; bytes: number; sha256: string; contentType: string }[] = [];
  for (const url of urls) {
    const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, "");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const file = path.join("media/files", pathname);
      mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
      writeFileSync(path.join(out, file), buf);
      manifest.push({ url, file: file.split(path.sep).join("/"), bytes: buf.length, sha256: sha256(buf), contentType: res.headers.get("content-type") ?? "application/octet-stream" });
    } catch (error) {
      problems.push(`media download failed: ${url} (${(error as Error).message})`);
    }
  }
  writeFileSync(path.join(out, "media/manifest.json"), JSON.stringify(manifest, null, 2));
  const mediaBytes = manifest.reduce((sum, m) => sum + m.bytes, 0);
  console.log(`media: ${manifest.length}/${urls.length} files, ${(mediaBytes / 1048576).toFixed(1)} MB`);

  // 4. Env variable list + restore guide.
  writeFileSync(path.join(out, "env/ENV-VARIABLES.md"), ENV_VARIABLES);
  copyFileSync("docs/DISASTER-RECOVERY.md", path.join(out, "RESTORE.md"));

  const info = {
    takenAt: new Date().toISOString(),
    site: "https://www.goldensevenfoods.com",
    commit,
    database: { host: dump.host, takenAt: dump.takenAt, tables: Object.keys(dump.tables).length, rows: rowCount },
    media: { files: manifest.length, referenced: urls.length, bytes: mediaBytes },
    problems,
  };
  writeFileSync(path.join(out, "BACKUP-INFO.json"), JSON.stringify(info, null, 2));

  // 5. One portable archive (Windows 10+ ships bsdtar as tar.exe; elsewhere use zip).
  const zip = `${out}.zip`;
  try {
    if (process.platform === "win32") run(path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", zip, "-C", path.dirname(out), path.basename(out)]);
    else run("zip", ["-qr", zip, path.basename(out)], { cwd: path.dirname(out) });
    console.log(`archive: ${zip} (${(statSync(zip).size / 1048576).toFixed(1)} MB)`);
  } catch (error) {
    problems.push(`zip failed (${(error as Error).message}) -- the folder is complete, zip it manually`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\nBackup complete: ${out}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
