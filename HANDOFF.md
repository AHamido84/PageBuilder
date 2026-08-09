# Seven Eleven Trading — Project Handoff / Continuation Notes

**Read this first in a new session** to pick up where this one left off. This file is intentionally *not* a design document — it's operational context: what exists, what's verified, what's not done, and how to keep going.

---

## What this project is

A production website + enterprise CMS for **Seven Eleven Trading**, a real Jeddah-based wholesale food distributor (verified via LinkedIn: founded 2023, 51–200 employees, frozen-food specialty, serves hotels/restaurants/catering/hospitals/wholesale). No fabricated certifications, awards, or stats appear anywhere in the build — only verified facts or clearly-labeled placeholders.

Built in 4 phases so far, each a separate user-issued command:
- **Phase 0** — architecture analysis & plan (see `PROJECT-PLAN.md`)
- **Phase 1** — database, auth, RBAC, foundational admin CRUD
- **Phase 2** — premium public website (design system + all public pages)
- **Phase 3** — enterprise CMS (every remaining admin module)

Everything is committed and pushed to **https://github.com/AHamido84/PageBuilder** (branch `main`, currently at commit `bc04d28`). Working tree was clean as of the last commit.

---

## Environment setup (things that bit us before)

- **Node.js**: installed via `winget` (v24.19.0) at `C:\Program Files\nodejs`. This shell's PATH does **not** auto-refresh across PowerShell invocations — every command needs `$env:Path += ";C:\Program Files\nodejs;$env:APPDATA\npm"` prepended, or use the existing `.claude/launch.json` configs which already bake this in via `cmd.exe /c "set PATH=...&& npm run dev"`.
- **Docker Desktop never worked** in this environment (GUI first-run dialog can't be clicked headlessly). We gave up on local Postgres and used a **cloud Neon Postgres** instance instead.
- **Database**: PostgreSQL on Neon. Connection string lives in `.env` (`DATABASE_URL`) — **not** committed, not reproduced here. If starting fresh and `.env` is missing, you'll need the user to supply it again (see Phase 1 conversation for the original setup flow).
- **Admin login**: credentials are in `.env` as `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Log in at `/admin/login`.
- **Prisma is pinned to v6** (not v7) — v7's driver-adapter-only config was too new/unstable when this was built. Don't upgrade without deliberately re-testing the migration flow.
- **`prisma migrate dev` doesn't work in this non-interactive shell** (needs a TTY to confirm data-loss warnings). The working pattern used throughout: `prisma migrate diff --from-url <url> --to-schema-datamodel prisma/schema.prisma --script` → manually write the SQL into a new `prisma/migrations/<timestamp>_<name>/migration.sql` file (avoid PowerShell `Out-File`/redirection — it adds a UTF-8 BOM that breaks Postgres; use the `Write` tool instead) → `prisma migrate deploy` → `prisma generate`.
- **Neon occasionally cold-starts/drops connections** (P1001 errors) after idle periods — this caused at least one false "bug" during testing that was actually just a transient reconnect. Retry before assuming a real issue.
- **Dev vs prod preview**: `.claude/launch.json` has two configs — `seven-eleven-trading` (dev, `npm run dev`) and `seven-eleven-trading-prod` (`npm run build && npm run start`... actually just `npm run start`, so build first manually). Testing was mostly done against the **prod build** since Turbopack dev-mode HMR was flaky during heavy editing (stale bundles, phantom module-not-found errors that were just cache issues).
- **Browser automation quirk**: the `computer` tool's `left_click` occasionally times out or silently no-ops on certain buttons (root cause never fully identified — possibly environment-specific). When a click seems to not register, verify via `read_page`/`get_page_text` before assuming a code bug — several "bugs" during Phase 2/3 testing turned out to be this, not real issues. A dispatched-then-separately-checked JS pattern (`javascript_tool`) was the reliable fallback for confirming React state actually changed (React's commit isn't synchronous within a scripted `dispatchEvent`, so check in a *separate* tool call, not the same one).

---

## Tech stack

- Next.js 16.3 (App Router, Turbopack), TypeScript, React 19
- Prisma 6 + PostgreSQL (Neon)
- Custom auth: bcrypt + signed JWT session cookie (`jose`), no third-party auth library
- `next-intl` for Arabic (RTL, default)/English (LTR)
- Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js`)
- Zod validation throughout server actions

---

## Design system (Phase 2)

Palette: Ink `#0B1C2C`, Paper `#F7F5F0`, Harbor `#1F4E5F`, Wheat `#C99A4B`, Frost `#DCE6E4`, Signal `#B23A2F`. Type: Archivo Expanded (display) + Public Sans (body) + IBM Plex Mono (data) + IBM Plex Sans Arabic (own voice, not a mirrored Latin face). Signature motif: SKU/temperature-class data rendered as a recurring "manifest strip" — operational data as the visual material.

---

## Full database schema (models)

`User`, `Role`, `Permission`, `RolePermission` (RBAC — 15 resources × 5 actions = 75 permissions, 5 roles: Super Admin/Content Manager/Marketing Manager/Sales/Viewer) · `Page`, `PageSection`, `PageRevision` (page builder — revisions table exists but isn't used yet, see gaps) · `Category`, `CategoryTranslation` (+ icon, SEO) · `Brand`, `BrandTranslation` (+ logo, banner, SEO) · `Product`, `ProductTranslation` (+ isFeatured, originCountry, packaging/storage info) · `Media` · `Menu`, `MenuItem` (links to Page/Category/Product/custom URL) · `BlogCategory`, `Tag`, `BlogPost` · `Form`, `FormSubmission` · `Industry`, `Lead`, `LeadNote` · `Certification` (schema exists, no admin UI yet) · `SiteSetting` (singleton, fully expanded) · `SEO` (attachable to Page/Product/BlogPost/Category/Brand) · `NewsletterSubscriber` · `ActivityLog`.

---

## Admin dashboard — routes that exist and are real

All under `/admin/*`, protected by the RBAC session + `src/proxy.ts` (Next 16's middleware replacement):

- `/admin` — dashboard with live stats
- `/admin/pages`, `/admin/pages/[id]` — **Page Builder** (create/duplicate/draft/publish/unpublish/archive, typed section editor: Hero/Text/ValueProps/MediaText/Gallery/ProductGrid/ContactCTA)
- `/admin/media` — Media Library (upload/search/filter/rename/replace/delete)
- `/admin/menus` — Menu Builder (header/footer, nested items)
- `/admin/blog`, `/admin/blog/[id]` — Blog CMS
- `/admin/products`, `/admin/products/[id]` — Products (full CRUD, feature/duplicate/publish toggle, video upload, spec sheet, SEO)
- `/admin/categories`, `/admin/categories/[id]` — Categories (nested tree, reorder, icon, SEO)
- `/admin/brands`, `/admin/brands/[id]` — Brands (full CRUD, logo/banner, SEO)
- `/admin/leads`, `/admin/leads/[id]` — Leads (notes, CSV export, search/filter)
- `/admin/forms`, `/admin/forms/[id]` — lightweight Form/FormSubmission management (see gaps)
- `/admin/users`, `/admin/users/[id]` — Users
- `/admin/roles` — Roles (read-only view of seeded RBAC matrix; no custom role builder UI yet)
- `/admin/settings` — Settings (General/Contact/Social/Hours/SEO defaults/Footer — all configurable)
- `/admin/activity` — Activity Log viewer

Shared admin UX kit at `src/components/admin/ui/`: `Modal`, `Drawer`, `ConfirmDialog` (promise-based, replaces `window.confirm`), `Toast`, `Tabs`, `SeoForm`, `MediaPickerField` (browse-or-upload, used everywhere), `DeleteButton`.

---

## Public site — routes that exist and are real

All under `/[locale]/*` (`ar`/`en`), driven by `src/proxy.ts` + `next-intl`:

`/`, `/products`, `/products/[slug]`, `/brands`, `/brands/[slug]`, `/about`, `/solutions`, `/solutions/[segment]` (7 real segments: hotels/restaurants/catering/hospitals/wholesale/retail/food-service), `/quality-food-safety`, `/distribution-logistics`, `/contact`, `/privacy`, `/terms`, `/cookies`, and a **catch-all `/[...slug]`** that renders CMS pages created via the Page Builder (respects draft/publish status + admin-preview access).

Header (sticky, mega menus for Products/Solutions/Company, mobile drawer) and Footer (nav, real newsletter signup, contact from `SiteSetting`, legal links) wrap every page.

---

## Genuine gaps — read before continuing

1. **Public header/footer menu is still Phase 2's static nav, not wired to the new `Menu`/`MenuItem` records.** The Menu Builder admin is real, but nothing on the public site reads from it yet. This is probably the highest-value next task if continuing the CMS thread.
2. **No public `/blog` listing or `/blog/[slug]` page.** The Blog CMS admin is fully real; there's just no public consumer yet.
3. **Forms module has no real submitter.** The public quote-request form still writes directly to `Lead` (intentional — matches a CRM-style pipeline). The `/admin/forms` module is real infrastructure for a *future* standalone form; this is disclosed on the page itself, not hidden.
4. **`Certification` model exists in the schema with no admin UI and no public page.**
5. **`PageRevision` model exists but nothing writes to it** — no revision history is actually captured on page edits yet, despite the schema supporting it.
6. **No custom role/permission builder UI** — `/admin/roles` is read-only; roles are seeded, not editable via UI.
7. **No automated test suite** (Vitest/Playwright). All verification so far has been manual/scripted against a real build and real database — thorough, but not a committed regression suite.
8. **Test data lives in the real database** (never cleaned up, always flagged to the user, never auto-deleted):
   - Category "Frozen Poultry" (`frozen-poultry`)
   - Product "Whole Frozen Chicken" (`FP-1001`, published, with real packaging/storage/origin data)
   - Lead "Ahmed Al-Otaibi"
   - Brand "Nordic Foods" (`nordic-foods`)
   - Page `/test-cms-page` (published, one Text section)
   - The user has been asked twice whether to clean these up and hasn't answered yet — worth asking again or just doing it (low-risk, clearly-labeled test data) if it comes up.
9. **Not every `SiteSetting` field is consumed on the public site yet** — e.g. logo/favicon replacing the text wordmark, map embed display, business hours display. The admin can configure them; the public site doesn't render all of them yet.

---

## How to resume work

```bash
# from D:\Claude Code
git log --oneline -5          # confirm you're at bc04d28 or later
git status                    # should be clean
```

To run the dev server (PowerShell, from this repo):
```powershell
$env:Path += ";C:\Program Files\nodejs;$env:APPDATA\npm"
npm run dev
```
Or use the `preview_start` tool with config name `seven-eleven-trading` (dev) or `seven-eleven-trading-prod` (build + start; run `npm run build` first).

Log in at `/admin/login` with the credentials in `.env`.

If `prisma generate` seems out of sync after a fresh checkout: `npx prisma generate`. If schema changes are needed, follow the migration workaround documented above (not `prisma migrate dev`).

---

## Natural next steps (not started, just candidates)

- Wire public header/footer to real `Menu`/`MenuItem` data
- Build public `/blog` + `/blog/[slug]`
- Build `Certification` admin + public display
- Wire `PageRevision` capture on every section/page save (schema's ready)
- Custom role/permission builder UI
- Consume remaining `SiteSetting` fields on the public site (logo, favicon, map, hours)
- Automated test suite
- Clean up or keep the test data listed above (ask the user)
