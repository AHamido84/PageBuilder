# Seven Eleven Trading — Project Handoff / Continuation Notes

**Read this first in a new session** to pick up where this one left off. This file is intentionally *not* a design document — it's operational context: what exists, what's verified, what's not done, and how to keep going.

---

## What this project is

A production website + enterprise CMS for **Seven Eleven Trading**, a real Jeddah-based wholesale food distributor (verified via LinkedIn: founded 2023, 51–200 employees, frozen-food specialty, serves hotels/restaurants/catering/hospitals/wholesale). No fabricated certifications, awards, or stats appear anywhere in the build — only verified facts or clearly-labeled placeholders.

Built in 6 phases so far, each a separate user-issued command:
- **Phase 0** — architecture analysis & plan (see `PROJECT-PLAN.md`)
- **Phase 1** — database, auth, RBAC, foundational admin CRUD
- **Phase 2** — premium public website (design system + all public pages)
- **Phase 3** — enterprise CMS (every remaining admin module)
- **Phase 4** — real visual Page Builder: 31-block registry, drag-and-drop canvas, responsive per-breakpoint styling, draft/publish snapshot versioning with restore (see below)
- **Phase 5** — product catalog depth (specs/certifications/related products/multi-document media), a hardened Media Library (MIME+extension+size validation, image optimization, SVG sanitization), split product inquiries (Request Info vs. Request Quote), public Blog + FAQ, and a real demo-content seed script (see "Product Catalog & Media architecture" below)
- **Post-Phase-5** — switched the Media Library's storage backend from the local filesystem to Vercel Blob (see "Media pipeline" below), then pushed and deployed everything through Phase 5 to production

Also: this app is deployed to production on Vercel at `https://seven-eleven-trading.vercel.app`, on a separate Neon branch (`prod`) from the dev database described below — see "Production deployment" further down.

Everything through Phase 5 (plus the Vercel Blob storage migration below) is committed, pushed to **https://github.com/AHamido84/PageBuilder** (branch `main`), and deployed to production. Phase 5's schema migration (`20260810015850_product_catalog_v2`) has been applied to the `prod` Neon branch. Confirm `git status`/`git log` for the current state before assuming otherwise.

---

## Environment setup (things that bit us before)

- **Node.js**: installed via `winget` (v24.19.0) at `C:\Program Files\nodejs`. This shell's PATH does **not** auto-refresh across PowerShell invocations — every command needs `$env:Path += ";C:\Program Files\nodejs;$env:APPDATA\npm"` prepended, or use the existing `.claude/launch.json` configs which already bake this in via `cmd.exe /c "set PATH=...&& npm run dev"`.
- **Docker Desktop never worked** in this environment (GUI first-run dialog can't be clicked headlessly). We gave up on local Postgres and used a **cloud Neon Postgres** instance instead.
- **Database**: PostgreSQL on Neon. Connection string lives in `.env` (`DATABASE_URL`) — **not** committed, not reproduced here. If starting fresh and `.env` is missing, you'll need the user to supply it again (see Phase 1 conversation for the original setup flow).
- **Media storage**: Vercel Blob (`BLOB_READ_WRITE_TOKEN`, in `.env.local`, gitignored). If missing after a fresh checkout, the project is already linked (`.vercel/project.json`) — run `npx vercel env pull .env.local` (needs `vercel login` / an authenticated CLI session first) to fetch it, or `npx vercel blob list-stores` to confirm the store still exists. See "Media pipeline" under Phase 5 below.
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

`User`, `Role`, `Permission`, `RolePermission` (RBAC — 16 resources × 5 actions = 80 permissions after Phase 5 added `faqs`, 5 roles: Super Admin/Content Manager/Marketing Manager/Sales/Viewer) · `Page`, `PageSection` (+ `settings` Json, Phase 4), `PageRevision` (+ `isPublished` Bool, Phase 4 — now actually written on every Publish, see below) · `Category`, `CategoryTranslation` (+ icon, SEO) · `Brand`, `BrandTranslation` (+ logo, banner, SEO) · `Product` (+ `weight`, `dimensions`, `relatedProductIds String[]`, Phase 5), `ProductTranslation` (+ isFeatured, originCountry, packaging/storage info, + `shortDescription`/`ingredients`/`nutritionInfo`/`allergens`, Phase 5) · `Media` (+ `width`/`height` now actually populated, Phase 5) · `Menu`, `MenuItem` (links to Page/Category/Product/custom URL) · `BlogCategory`, `Tag`, `BlogPost` · `Form`, `FormSubmission` · `Industry`, `Lead` (+ `inquiryType LeadInquiryType`, Phase 5), `LeadNote` · `Certification` (schema existed since Phase 1; admin UI + product relation added Phase 5, seeded with zero rows — see gaps) · `Faq` (new, Phase 5) · `SiteSetting` (singleton, fully expanded) · `SEO` (attachable to Page/Product/BlogPost/Category/Brand) · `NewsletterSubscriber` · `ActivityLog`.

Product's `videos`/`documents` are separate `Media[]` relations from the pre-existing `images` gallery (Phase 5 split a single mixed image+video bucket into three distinct relations). `relatedProducts` ended up as a plain `relatedProductIds String[]` scalar array on `Product`, **not** a Prisma self-relation as originally planned — simpler to query/update (no join table, no symmetric-relation semantics to reason about) and sufficient for a curated "pick a few related SKUs" use case.

---

## Admin dashboard — routes that exist and are real

All under `/admin/*`, protected by the RBAC session + `src/proxy.ts` (Next 16's middleware replacement):

- `/admin` — dashboard with live stats
- `/admin/pages`, `/admin/pages/[id]` — page list + Details/SEO; `/admin/pages/[id]/builder` — **the real visual Page Builder** (Phase 4): full-screen editor, 31 registry-driven block types (see "Page Builder architecture" below), drag-and-drop reorder, responsive Desktop/Tablet/Mobile settings per section, undo/redo, autosave, and real draft→publish versioning with a restorable revision history
- `/admin/media` — Media Library (upload/search/filter/rename/replace/delete; Phase 5: JPG/PNG/WEBP/SVG/MP4/WEBM/PDF with MIME+extension+size validation, raster images auto-resized >2000px and re-encoded via `sharp`, SVGs sanitized on upload, `width`/`height` now actually populated)
- `/admin/menus` — Menu Builder (header/footer, nested items)
- `/admin/blog`, `/admin/blog/[id]` — Blog CMS
- `/admin/products`, `/admin/products/[id]` — Products: list has search/category/brand/status filters + pagination (Phase 5); detail is 5 tabs — Details, Specifications (weight/dimensions/packaging/storage/ingredients/nutrition/allergens, Phase 5), Media (Images/Videos/Documents via one generic `product-media-collection.tsx`, Phase 5), Related & Certifications (curated related-product picker + certification checklist, Phase 5), SEO
- `/admin/categories`, `/admin/categories/[id]` — Categories (nested tree, reorder, icon, SEO)
- `/admin/brands`, `/admin/brands/[id]` — Brands (full CRUD, logo/banner, SEO)
- `/admin/certifications`, `/admin/certifications/[id]` — Certifications (new, Phase 5: slug, name EN·AR, issuer, valid from/until, image, publish toggle; seeded with **zero rows**, see gaps)
- `/admin/faqs`, `/admin/faqs/[id]` — FAQs (new, Phase 5: question/answer EN·AR, category tag, order, publish toggle)
- `/admin/leads`, `/admin/leads/[id]` — Leads (notes, CSV export, search/filter; Phase 5: Product + Inquiry Type columns, `Lead.productId`/`inquiryType` finally populated by the public inquiry forms)
- `/admin/forms`, `/admin/forms/[id]` — lightweight Form/FormSubmission management (see gaps)
- `/admin/users`, `/admin/users/[id]` — Users
- `/admin/roles` — Roles (read-only view of seeded RBAC matrix; no custom role builder UI yet)
- `/admin/settings` — Settings (General/Contact/Social/Hours/SEO defaults/Footer — all configurable)
- `/admin/activity` — Activity Log viewer

Shared admin UX kit at `src/components/admin/ui/`: `Modal`, `Drawer`, `ConfirmDialog` (promise-based, replaces `window.confirm`), `Toast`, `Tabs`, `SeoForm`, `MediaPickerField` (browse-or-upload, used everywhere; Phase 5: accepts SVG too), `DeleteButton`, `Pagination` (new, Phase 5 — `variant?: "dark"|"light"`, reused by both the admin product list and the public product listing).

---

## Public site — routes that exist and are real

All under `/[locale]/*` (`ar`/`en`), driven by `src/proxy.ts` + `next-intl`:

`/`, `/products` (search + category + brand filter + pagination, Phase 5), `/products/[slug]` (Phase 5: short description, Additional Information section for weight/dimensions/ingredients/nutrition/allergens — each rendered only if populated, certification badges, document downloads, videos alongside the image gallery, curated related products falling back to same-category auto-query), `/brands`, `/brands/[slug]`, `/about`, `/solutions`, `/solutions/[segment]` (7 real segments: hotels/restaurants/catering/hospitals/wholesale/retail/food-service), `/quality-food-safety`, `/distribution-logistics`, `/blog`, `/blog/[slug]` (new, Phase 5 — first public consumer of the Blog CMS), `/faq` (new, Phase 5 — grouped by category, accordion UI), `/contact`, `/privacy`, `/terms`, `/cookies`, and a **catch-all `/[...slug]`** that renders CMS pages created via the Page Builder (respects draft/publish status + admin-preview access).

Header (sticky, mega menus for Products/Solutions/Company, mobile drawer) and Footer (nav, real newsletter signup, contact from `SiteSetting`, legal links) wrap every page.

---

## Genuine gaps — read before continuing

1. **Public header/footer menu is still Phase 2's static nav, not wired to the new `Menu`/`MenuItem` records.** The Menu Builder admin is real, but nothing on the public site reads from it yet. This is probably the highest-value next task if continuing the CMS thread.
2. ~~No public `/blog` listing or `/blog/[slug]` page~~ — **resolved in Phase 5.** `/[locale]/blog` and `/[locale]/blog/[slug]` are real.
3. **The dormant `Form`/`FormSubmission` system is still untouched.** Both Phase 4's Contact Form/Quote Form page-builder blocks and Phase 5's product inquiry forms deliberately write to `Lead` (the real CRM pipeline) — a conscious choice, not an oversight; see "Page Builder architecture" below.
4. ~~`Certification` model exists in the schema with no admin UI and no public page~~ — **partially resolved in Phase 5.** `/admin/certifications` is real and products can be linked to certifications; there is still no dedicated public certifications page, and **zero certifications are seeded** (deliberate — the user's instruction was explicit: do not invent certifications; the feature is ready to use the moment the user supplies real, verified certification data).
5. ~~`PageRevision` model exists but nothing writes to it~~ — **resolved in Phase 4.** Every Publish now snapshots into `PageRevision` (`isPublished` flag marks the live one), and Restore is real (see below).
6. **No custom role/permission builder UI** — `/admin/roles` is read-only; roles are seeded, not editable via UI.
7. **No automated test suite** (Vitest/Playwright). All verification so far has been manual/scripted against a real build and real database — thorough, but not a committed regression suite.
8. ~~Phase 5's schema migration only applied to dev, code committed locally only~~ — **resolved.** Pushed to `main` and deployed; migration `20260810015850_product_catalog_v2` has been applied to the `prod` Neon branch via `prisma migrate deploy`.
9. ~~Uploaded media written to the local filesystem, won't persist on Vercel~~ — **resolved.** `src/lib/media-upload.ts` now uploads to a **Vercel Blob** store (`seven-eleven-trading-media`, public access) instead of `public/uploads/`. See "Media pipeline" under Phase 5 below for details. `public/uploads/` may still contain leftover dev-only files from before this switchover — harmless, gitignored, safe to ignore or delete.
10. **Test data lives in the real (dev) database** (never cleaned up, always flagged to the user, never auto-deleted):
    - Category "Frozen Poultry" (`frozen-poultry`)
    - Product "Whole Frozen Chicken" (`FP-1001`, published, with real packaging/storage/origin data)
    - Lead "Ahmed Al-Otaibi"
    - Brand "Nordic Foods" (`nordic-foods`)
    - Page `/test-cms-page` (published, one Text section — this predates Phase 4's registry; its `TEXT` type is gone from the new registry, so it'll render as an empty/skipped section now. Delete and recreate through the new builder if it needs to stay.)
    - Page `/page-builder-e2e-test` (Phase 4's end-to-end test page — Hero/Rich Text/Feature Cards/Accordion sections, published). Same disposable-test-data status as the rest of this list.
    - Plus Phase 5's real demo catalog from `scripts/seed-demo-content.ts` (19 categories, 6 brands, 23 products, 6 blog posts, 10 FAQs, 0 certifications) — see "Demo content" below. This is meant to look like real catalog data (it's what a visitor/reviewer will see), unlike the items above which are throwaway single-record test fixtures.
    - One test SVG (`public/uploads/2026/08/…svg`) uploaded while verifying the Phase 5 SVG-sanitizer fix — left on disk, not committed (see `.gitignore`).
    - The user has been asked multiple times whether to clean up the single-record test fixtures and hasn't answered yet — worth asking again or just doing it (low-risk, clearly-labeled test data) if it comes up. **Note: the production Vercel deployment's database has no seed/demo catalog data** — it's only the dev Neon branch that has the items above. Prod is not necessarily *empty* though (see gap #13) — check `/admin` before assuming.
11. **Not every `SiteSetting` field is consumed on the public site yet** — e.g. logo/favicon replacing the text wordmark, map embed display, business hours display. The admin can configure them; the public site doesn't render all of them yet.
12. **The hardcoded marketing homepage (`src/app/[locale]/page.tsx`) is still hardcoded React**, not a Page Builder-driven `Page`/`PageSection` record. This was a deliberate Phase 4 scope boundary, not an oversight — ask before migrating it if that comes up.
13. **The user works directly in this same dev server / prod admin panel in their own browser, concurrently with agent sessions.** During the Vercel Blob migration testing, an automated browser test collided with the user's own real activity: the user uploaded a real `Logo.png` through `/admin/media` (or `/admin/settings`) at the exact moment an automated test script was mid-flow on that same Media record, and a DOM-selector bug in the test script (`document.querySelector('input[type="file"]')` matching the wrong hidden file input while a details drawer was open) caused the test to **replace, then delete** the user's real logo upload. The blob was permanently gone from Vercel Blob storage by the time this was caught (confirmed via `vercel blob list`) — no undo available. **Lesson for future sessions**: don't assume you have exclusive control of a shared dev server or the prod admin panel; check the Activity Log (`/admin/activity`) for actions you didn't take before and after any live UI testing, prefer scoping file-input selectors precisely (e.g. by a stable `data-testid`, not a bare `input[type="file"]` query) when more than one such input can be mounted at once, and flag to the user immediately if anything unexpected shows up mid-test rather than continuing. If the user ever needs their logo re-uploaded, that's on them to supply — it wasn't recoverable from this end.

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

## Product Catalog & Media architecture (Phase 5)

**Products stay simple, unlike pages**: Page Builder's draft/working-copy vs. published-snapshot split does **not** apply to `Product`. A product is just `isPublished: Boolean` — editing a published product changes it live immediately, same as Categories/Brands/Blog. This is intentional (products aren't a layout-authoring surface with an undo/preview workflow; they're catalog records), not a leftover gap.

**`relatedProductIds` is a scalar array, not a relation**: `Product.relatedProductIds String[] @default([])` holds raw product ids picked via the admin's Related & Certifications tab. This was a deliberate simplification from the original plan (a `Product[] @relation("RelatedProducts")` self many-to-many) — a scalar array needs no join table and no symmetric-relation bookkeeping, and the picker only needs "show me these specific other products," never a query in the reverse direction. If a product referenced in the array gets deleted, its id just becomes a harmless dangling entry (the detail-page query filters to `{ id: { in: relatedProductIds } }`, which silently ignores ids that no longer resolve) — no cascading delete/foreign-key error to handle.

**SVG upload security bug found and fixed during Phase 5's own testing** (`src/lib/media-upload.ts`): the first version of `sanitizeSvg()` passed `allowedAttributes: false` to `sanitize-html`, which means "allow every attribute on every tag" — the exact opposite of the intended allowlist, and it let `onload`/`onclick`/etc. straight through while only the `<script>` tag itself got stripped. Caught by a direct test payload (`<svg onload="alert(1)"><script>alert('xss')</script><circle onclick="alert(2)"/></svg>`), not user-reported. Fixed with an explicit `SVG_SAFE_ATTRIBUTES` allowlist (presentation/geometry attributes only) passed as `allowedAttributes: { "*": SVG_SAFE_ATTRIBUTES }`. If touching SVG handling again: `allowedAttributes: false` in `sanitize-html` is a footgun that reads like "no attributes allowed" but means the opposite — always pass an explicit list.

**Media pipeline**: `saveUploadedFile()` validates both MIME type *and* derives the file extension from that validated MIME type (never from the client-supplied filename, so a malicious extension can't reach disk) *and* enforces a per-type size cap (images 5MB, SVG 1MB, PDF 10MB, video 50MB). Raster images (`jpeg`/`png`/`webp`) go through `sharp`: resized down (preserving aspect ratio) if wider than 2000px, re-encoded at quality ~82, and their final `width`/`height` returned and persisted on `Media` — previously-empty columns. SVGs are sanitized (above) but not resized (vector). Video/PDF pass through unmodified.

**Storage backend (added after Phase 5)**: uploads are written to a **Vercel Blob** store, not the local filesystem — `saveUploadedFile()` calls `put()` from `@vercel/blob` with `access: "public"` and a UUID-based pathname (`uploads/YYYY/MM/<uuid>.<ext>`, `addRandomSuffix: false` since the UUID already guarantees uniqueness), and `deleteUploadedFile()` calls `del()` on the stored blob URL. This was required because Vercel's serverless functions have an ephemeral filesystem — anything written to `public/uploads/` in production would vanish after the instance recycled (this was gap #9, now resolved). The store is named `seven-eleven-trading-media`, connected to the Vercel project, and its `BLOB_READ_WRITE_TOKEN` is set in all three Vercel environments (Production/Preview/Development) plus pulled into local `.env.local` for dev — `next dev` reads both `.env` and `.env.local` automatically, no manual wiring needed. `next.config.ts`'s CSP `img-src`/`media-src` directives allow the `*.public.blob.vercel-storage.com` domain. `deleteUploadedFile()` no-ops on any URL that isn't `http(s)://` (guards against pre-migration `/uploads/...`-style Media rows, though none exist in prod — prod's DB was empty when this was built).

**Inquiry split**: `contact-form.tsx` renders two submit buttons using the native HTML multi-submit-button pattern — `<button type="submit" name="inquiryType" value="INFO">` and `value="QUOTE"` — so only the clicked button's name/value pair reaches `FormData`, giving Request Info vs. Request Quote without any extra client-side state. `submitLead()`/`leadSchema` (`src/lib/leads/submit-lead.ts`) accept an optional `productId`, looked up defensively (doesn't throw if the id doesn't resolve) so a stale product reference can't break lead submission.

**Demo content**: `scripts/seed-demo-content.ts` (run via `tsx`, standalone from `prisma/seed.ts` which stays focused on auth/RBAC bootstrap) is real and rerunnable — it upserts by slug/SKU, so running it again updates rather than duplicates. Current counts in the dev database: 19 categories (with subcategories), 6 brands, 23 products (all new Phase 5 fields populated with realistic-but-generic bilingual copy), 6 blog posts, 10 FAQs, **0 certifications** (deliberate — see gap #4). Every fabricated detail in this content is a generic product/operational attribute (weight, packaging, typical allergens, etc.); no certifications, awards, partnerships, revenue figures, customer counts, or geographic/official company claims were invented anywhere, per the user's explicit instruction.

---

## Production deployment

Live at **https://seven-eleven-trading.vercel.app** (Vercel project `ahamido/seven-eleven-trading`, connected to this GitHub repo — pushes to `main` auto-deploy). Uses a **separate Neon branch** (`prod`, not the dev branch this file otherwise describes) with its own database. Production env vars (`DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`) are set directly in Vercel, independent of the local `.env`. Note the build script (`package.json`) does **not** run `prisma migrate deploy` — only `postinstall: prisma generate`. Applying a schema migration to `prod` has always been a manual step in this project's workflow (`prisma migrate deploy` run by hand against the prod `DATABASE_URL`, same command as for dev, just pointed at the other branch — the CLI pattern used: `vercel env pull <tmpfile> --environment=production`, read `DATABASE_URL` out of it into `$env:DATABASE_URL`, run `prisma migrate deploy`, then delete the tmp file since it holds plaintext prod secrets).

**Phase 5 is live**: pushed to GitHub, migration `20260810015850_product_catalog_v2` applied to `prod`, deployed. Prod's database has **no demo/seed catalog data** — only whatever's been created directly through the live admin (unlike the dev branch, which has the full `seed-demo-content.ts` catalog plus assorted test fixtures, see gap #10). Don't assume prod is empty without checking `/admin` — it's been used directly (real logo uploaded via `/admin/media` or `/admin/settings` at least once, see the note on concurrent-session risk below).

---

## How to resume work

```bash
# from D:\Claude Code
git log --oneline -5          # should include Phase 5 + the Vercel Blob storage commit, pushed to origin/main
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
- Build a dedicated public certifications page once real certification data exists (admin UI is ready, seeded empty by design)
- Custom role/permission builder UI
- Consume remaining `SiteSetting` fields on the public site (logo, favicon, map, hours)
- Automated test suite
- Clean up or keep the test data listed above, including the new `/page-builder-e2e-test` page and the leftover test SVG (ask the user)
- Migrate the hardcoded marketing homepage into the Page Builder, if ever wanted (deliberately out of scope for Phase 4)
