# Golden Seven Foods — backup & restore

The live site (https://www.goldensevenfoods.com) is made of four things. A full backup holds all of them:

| Part | Lives in | In the backup |
|---|---|---|
| Code | GitHub `AHamido84/PageBuilder` (`main`) | `code/PageBuilder.bundle` (full git history) + `code/source.zip` |
| Database (all content, products, pages, leads, admin users) | Neon PostgreSQL | `database/database.json` |
| Uploaded media (product photos, logos, videos, PDFs) | Vercel Blob | `media/files/` + `media/manifest.json` |
| Settings (env variables, domain) | Vercel + Cloudflare | `env/ENV-VARIABLES.md` (names only — secrets stay in your password manager) |

---

## 1. Make a backup

From the project folder (Node.js installed), with the **production** database URL:

```bash
DATABASE_URL="<production database url>" npx tsx scripts/backup-production.ts
```

PowerShell:

```powershell
$env:DATABASE_URL="<production database url>"; npx tsx scripts/backup-production.ts
```

It only reads. Result: `design-assets/backups/full-<date>/` and the same as a `.zip`. **Copy the .zip somewhere else**
(Google Drive, OneDrive, a USB disk) — a backup that only lives on this computer is not a backup.

Make one before every risky change (migration, big content edit) and at least monthly.
`BACKUP-INFO.json` in the backup lists the commit, row/file counts and any problems.

---

## 2. Which restore do I need?

| What happened | Do this |
|---|---|
| A bad deploy (site broken after an update) | **Vercel → goldensevenfoods → Deployments → previous Ready production deployment → ⋯ → Promote to Production.** Takes seconds, data untouched. |
| Content/data was damaged or deleted | Neon first: **Neon console → project → Restore / Branches** (point-in-time restore within the plan's history window). Older than that: section 4 step 3 with a backup. |
| Vercel or Neon account lost, or moving host | Full rebuild — section 4. |

---

## 3. Restore checklist (what "back up" means)

- [ ] https://www.goldensevenfoods.com/ar and /en load, product images show
- [ ] Admin login works at /admin/login (admin users and passwords are restored with the database)
- [ ] Quote form submits (Admin → Leads shows the test lead; delete it)
- [ ] https://www.goldensevenfoods.com/sitemap.xml and /robots.txt load on the www domain

---

## 4. Full rebuild on new accounts

You need: Node.js 22+, the backup folder (unzipped), and a PostgreSQL database (Neon, Supabase, Railway, any).

### Step 1 — Get the code

From GitHub (`git clone https://github.com/AHamido84/PageBuilder.git site`) or, if GitHub is unavailable, from the backup:

```bash
git clone <backup>/code/PageBuilder.bundle site
cd site
npm ci
```

### Step 2 — Create the database schema

Create an empty PostgreSQL database, copy its connection string, then:

```bash
export DATABASE_URL="<new database url>"        # PowerShell: $env:DATABASE_URL="<new database url>"
npx prisma migrate deploy
```

### Step 3 — Load the data

```bash
npx tsx scripts/restore-db-json.ts <backup>/database/database.json            # dry run: shows the tables
npx tsx scripts/restore-db-json.ts <backup>/database/database.json --apply    # loads everything
```

(Restoring into the *current* production database instead of a new one also needs `--allow-production` —
only when the live data really must be replaced. Take a fresh backup first.)

### Step 4 — Put the media back online (pick one)

**A. Self-hosted (any host, no storage account):**

```bash
npx tsx scripts/restore-media.ts <backup> --local --apply
git add public/restored-media && git commit -m "Restored media"
```

The site now serves its own images from `/restored-media/...`. (Admin uploads of *new* media still need a
Vercel Blob token — B — until another storage is wired in.)

**B. A new Vercel Blob store** (Vercel → Storage → Create → Blob, copy `BLOB_READ_WRITE_TOKEN`):

```bash
BLOB_READ_WRITE_TOKEN="<token>" npx tsx scripts/restore-media.ts <backup> --blob --apply
```

Both verify every file's checksum and rewrite every stored image URL in the database.

### Step 5 — Deploy

**Vercel (simplest):** vercel.com → Add New → Project → import the GitHub repo (or `npx vercel` in the folder)
→ Framework: Next.js (detected) → add the variables from `env/ENV-VARIABLES.md` → Deploy.
Then Settings → Domains → add `www.goldensevenfoods.com` (and `goldensevenfoods.com` → redirect to www).

**Any container host (Render, Railway, Fly.io, a VPS):** the repo has a `Dockerfile`:

```bash
docker build -t golden-seven .
docker run -p 3000:3000 -e DATABASE_URL="..." -e SESSION_SECRET="..." -e NEXT_PUBLIC_SITE_URL="https://www.goldensevenfoods.com" golden-seven
```

On Render/Railway: "New Web Service from Dockerfile", set the same variables, port 3000.

**Plain Node server:** `npm ci && npm run build && npx prisma migrate deploy && npm start` (port 3000, behind nginx/Caddy for HTTPS).

### Step 6 — Point the domain

DNS is at **Cloudflare**. Point `www` (and the bare domain) at the new host — for Vercel: `CNAME www → cname.vercel-dns.com`,
`A @ → 76.76.21.21`; other hosts show their target in their domain settings. Keep `NEXT_PUBLIC_SITE_URL=https://www.goldensevenfoods.com`.

Then run the checklist in section 3, and in Google Search Console resubmit `https://www.goldensevenfoods.com/sitemap.xml`.

---

## Notes

- **Secrets are never in the backup** (database password, `SESSION_SECRET`, Blob token, SMTP). A new `SESSION_SECRET` only logs admins out.
- The old site build "seven-eleven-trading" shares this database; restoring the database restores its content too.
- `scripts/fix-seo-slugs.ts`, `scripts/fix-audit-content.ts` etc. are one-off content fixes — **not** part of a restore.
