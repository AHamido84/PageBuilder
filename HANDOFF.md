# Seven Eleven Trading — Project Handoff / Continuation Notes

**Read this first in a new session** to pick up where this one left off. This file is intentionally *not* a design document — it's operational context: what exists, what's verified, what's not done, and how to keep going.

---

## What this project is

A production website + enterprise CMS for **Seven Eleven Trading**, a real Jeddah-based wholesale food distributor (verified via LinkedIn: founded 2023, 51–200 employees, frozen-food specialty, serves hotels/restaurants/catering/hospitals/wholesale). No fabricated certifications, awards, or stats appear anywhere in the build — only verified facts or clearly-labeled placeholders.

Built in 5 phases so far, each a separate user-issued command:
- **Phase 0** — architecture analysis & plan (see `PROJECT-PLAN.md`)
- **Phase 1** — database, auth, RBAC, foundational admin CRUD
- **Phase 2** — premium public website (design system + all public pages)
- **Phase 3** — enterprise CMS (every remaining admin module)
- **Phase 4** — real visual Page Builder: 31-block registry, drag-and-drop canvas, responsive per-breakpoint styling, draft/publish snapshot versioning with restore (see below)

Also: this app is deployed to production on Vercel at `https://seven-eleven-trading.vercel.app`, on a separate Neon branch (`prod`) from the dev database described below — see "Production deployment" further down.

Everything is committed and pushed to **https://github.com/AHamido84/PageBuilder** (branch `main`). Working tree was clean as of the last Phase 3 commit; Phase 4's changes are described here but confirm `git status`/`git log` for the current commit.

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

`User`, `Role`, `Permission`, `RolePermission` (RBAC — 15 resources × 5 actions = 75 permissions, 5 roles: Super Admin/Content Manager/Marketing Manager/Sales/Viewer) · `Page`, `PageSection` (+ `settings` Json, Phase 4), `PageRevision` (+ `isPublished` Bool, Phase 4 — now actually written on every Publish, see below) · `Category`, `CategoryTranslation` (+ icon, SEO) · `Brand`, `BrandTranslation` (+ logo, banner, SEO) · `Product`, `ProductTranslation` (+ isFeatured, originCountry, packaging/storage info) · `Media` · `Menu`, `MenuItem` (links to Page/Category/Product/custom URL) · `BlogCategory`, `Tag`, `BlogPost` · `Form`, `FormSubmission` · `Industry`, `Lead`, `LeadNote` · `Certification` (schema exists, no admin UI yet) · `SiteSetting` (singleton, fully expanded) · `SEO` (attachable to Page/Product/BlogPost/Category/Brand) · `NewsletterSubscriber` · `ActivityLog`.

---

## Admin dashboard — routes that exist and are real

All under `/admin/*`, protected by the RBAC session + `src/proxy.ts` (Next 16's middleware replacement):

- `/admin` — dashboard with live stats
- `/admin/pages`, `/admin/pages/[id]` — page list + Details/SEO; `/admin/pages/[id]/builder` — **the real visual Page Builder** (Phase 4): full-screen editor, 31 registry-driven block types (see "Page Builder architecture" below), drag-and-drop reorder, responsive Desktop/Tablet/Mobile settings per section, undo/redo, autosave, and real draft→publish versioning with a restorable revision history
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
3. **The dormant `Form`/`FormSubmission` system is still untouched.** Phase 4's new Contact Form/Quote Form page-builder blocks deliberately write to `Lead` (the real CRM pipeline), same as the existing site-wide contact form — this was a conscious choice, not an oversight; see "Page Builder architecture" below.
4. **`Certification` model exists in the schema with no admin UI and no public page.**
5. ~~`PageRevision` model exists but nothing writes to it~~ — **resolved in Phase 4.** Every Publish now snapshots into `PageRevision` (`isPublished` flag marks the live one), and Restore is real (see below).
6. **No custom role/permission builder UI** — `/admin/roles` is read-only; roles are seeded, not editable via UI.
7. **No automated test suite** (Vitest/Playwright). All verification so far has been manual/scripted against a real build and real database — thorough, but not a committed regression suite.
8. **Test data lives in the real database** (never cleaned up, always flagged to the user, never auto-deleted):
   - Category "Frozen Poultry" (`frozen-poultry`)
   - Product "Whole Frozen Chicken" (`FP-1001`, published, with real packaging/storage/origin data)
   - Lead "Ahmed Al-Otaibi"
   - Brand "Nordic Foods" (`nordic-foods`)
   - Page `/test-cms-page` (published, one Text section — this predates Phase 4's registry; its `TEXT` type is gone from the new registry, so it'll render as an empty/skipped section now. Delete and recreate through the new builder if it needs to stay.)
   - Page `/page-builder-e2e-test` (Phase 4's end-to-end test page — Hero/Rich Text/Feature Cards/Accordion sections, published). Same disposable-test-data status as the rest of this list.
   - The user has been asked multiple times whether to clean these up and hasn't answered yet — worth asking again or just doing it (low-risk, clearly-labeled test data) if it comes up. **Note: the production Vercel deployment's database is clean/empty of all this** — it's only the dev Neon branch that has it.
9. **Not every `SiteSetting` field is consumed on the public site yet** — e.g. logo/favicon replacing the text wordmark, map embed display, business hours display. The admin can configure them; the public site doesn't render all of them yet.
10. **The hardcoded marketing homepage (`src/app/[locale]/page.tsx`) is still hardcoded React**, not a Page Builder-driven `Page`/`PageSection` record. This was a deliberate Phase 4 scope boundary, not an oversight — ask before migrating it if that comes up.

---

## Page Builder architecture (Phase 4)

Registry-driven, not hardcoded: `src/lib/page-builder/registry.ts` assembles `BLOCK_REGISTRY` from 8 category files under `blocks/` (31 block types total). Every block is one `BlockDefinition` — `{ type, label, category, icon, dataSchema (Zod), defaultData, defaultSettings, Edit, Render, canvasPreview? }`. The **same `Render` component powers both the admin canvas and the public site** via `SectionShell` — there is no separate "renderer" to keep in sync by hand.

**Two gotchas that cost real debugging time, if extending this:**
- **RSC boundary**: `block.Render` must always be used as JSX (`<block.Render .../>`), never called as a plain function (`Render(props)`) — the latter breaks for any block that's a `"use client"` component (i.e. almost all of them) with a cryptic React #418/#441 hydration error. Same rule for `Edit`: never export a *factory function* that returns a component from a `"use client"` file and call that factory from a server module (e.g. a `blocks/*.ts` registry file) — calling a client-exported function from server code at module-eval time throws "Attempted to call X() from the server but X is on the client." `layout/columns.tsx` and `interactive/accordion.tsx` show the fix: export the concrete pre-bound components directly (`TwoColumnsEdit`, `ThreeColumnsEdit`, ...), never a `makeXEdit(count)` factory.
- **Commerce blocks** (Product Grid/Carousel, Category Grid, Brand Grid) do live Prisma queries, so their real `Render` must be an async Server Component — which can't mount inside the client-side admin canvas. They get a `canvasPreview` (a small static summary card) instead; `canvasPreview`, when present, is what the canvas shows, and `Render` is reserved for the public site.

**Responsive settings**: `PageSection.settings` (`{ desktop, tablet, mobile, background, animation }`) resolves to Tailwind classes via **fully literal lookup tables** in `style-tokens.ts` (e.g. separate `PADDING_Y_BASE`/`_MD`/`_LG` objects) — never string-concatenated (`` "md:" + token ``). Tailwind v4's JIT only detects literal class substrings physically present in source; a concatenated class silently produces no styling in the production build while looking fine in dev. Don't "simplify" these tables into a prefix-builder helper.

**Draft vs. published**: `PageSection` rows are always the live *working draft*. Publishing snapshots the current sections into a new `PageRevision` (flips `isPublished`, unflips the previous one — enforced by a hand-added partial unique index, `PageRevision_pageId_published_key ... WHERE "isPublished" = true`, that **isn't representable in `schema.prisma`'s DSL** — a future `prisma migrate diff` won't know about it and may propose dropping it; keep it in the next migration's SQL by hand if that happens). Anonymous visitors on a `PUBLISHED` page read that snapshot; logged-in admins previewing always see the live working draft. Restoring an old revision copies its content back into the live working draft **without** auto-republishing (a safety snapshot of the pre-restore draft is taken first) — the admin reviews it and must hit Publish again.

**Two real race-condition bugs found and fixed during Phase 4's own end-to-end testing** (both in `page-builder-shell.tsx`), worth knowing about if autosave ever seems to silently revert content: (1) the autosave-scheduling `useEffect` used to fire on the component's very first mount too, arming a stale-data save timer immediately after every page load; (2) the `beforeunload` handler unconditionally called `save()` with stale in-memory `sections` — since `window.location.reload()` (used after a Restore, so the client re-reads fresh server data) triggers `beforeunload`, this could fire *after* a restore's DB write and silently overwrite it back to the pre-restore content. Both are fixed (mount-skip flag + a `suppressAutosaveRef` set before any deliberate reload) — this is exactly the kind of bug that only shows up by actually clicking through the flow end-to-end, not by code review alone.

**Browser-automation note**: the `computer` tool's `left_click_drag` needs a prior `screenshot` to calibrate coordinates, and fails outright if the Browser pane hasn't been composited yet (fresh preview tabs sometimes need one throwaway `screenshot` call before drag works). dnd-kit's `PointerSensor` also could not be reliably driven via manually-dispatched synthetic `PointerEvent`s (tried `document.dispatchEvent`, direct `props.onPointerDown` invocation, custom `pointerId`s — none activated the sensor); once the pane was composited, the real `computer{action:"left_click_drag"}` tool worked perfectly. If drag-and-drop testing seems stuck, try a screenshot first before concluding it's a real bug.

---

## Production deployment

Live at **https://seven-eleven-trading.vercel.app** (Vercel project `ahamido/seven-eleven-trading`, connected to this GitHub repo — pushes to `main` auto-deploy). Uses a **separate Neon branch** (`prod`, not the dev branch this file otherwise describes) with its own clean database — seeded with only a Super Admin account, no test data. Production env vars (`DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`) are set directly in Vercel, independent of the local `.env`. Phase 4's schema migration (`PageSection.settings`, `PageRevision.isPublished`) has **only been applied to the dev branch so far** — it needs to be applied to the `prod` branch too (same migration file, same `prisma migrate deploy` workflow) before Phase 4 is usable in production.

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

- Apply Phase 4's schema migration to the production Neon branch and deploy (see "Production deployment" above)
- Wire public header/footer to real `Menu`/`MenuItem` data
- Build public `/blog` + `/blog/[slug]`
- Build `Certification` admin + public display
- Custom role/permission builder UI
- Consume remaining `SiteSetting` fields on the public site (logo, favicon, map, hours)
- Automated test suite
- Clean up or keep the test data listed above, including the new `/page-builder-e2e-test` page (ask the user)
- Migrate the hardcoded marketing homepage into the Page Builder, if ever wanted (deliberately out of scope for Phase 4)
