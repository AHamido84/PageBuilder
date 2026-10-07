# Golden Seven site — start here (new session)

Short, current handoff (2026-10-05). `HANDOFF.md` is the long history; read only its top blocks if you need more.

**Paste this to start a new session:**

> Read `NEXT-SESSION.md` in `D:\Claude Code` and continue from "Open items". Ask me before any deploy, migration or production database change.

---

## 1. What this is

- Next.js 16 (App Router, Turbopack) + Prisma/Neon + next-intl (AR default RTL, EN LTR) + Tailwind v4. CMS with a Page Builder (blocks in `src/lib/page-builder/`). Repo `github.com/AHamido84/PageBuilder`, branch `main`.
- **Two Vercel projects, one codebase, ONE shared prod database:**
  - `goldensevenfoods` → **https://www.goldensevenfoods.com** (the live Golden Seven site, the one we work on)
  - `seven-eleven-trading` → seven-eleven-trading.vercel.app (old build; NOT redeployed since before the redesign)
- `.vercel/project.json` stays linked to **seven-eleven-trading**. Pushing does **not** deploy. To deploy goldensevenfoods:
  ```bash
  cp .vercel/project.json "$TEMP/project.json.bak"; cp .env.local "$TEMP/env.local.bak"
  npx vercel link --yes --project goldensevenfoods
  npx vercel deploy --prod --yes        # or without --prod for a preview
  cp "$TEMP/project.json.bak" .vercel/project.json; cp "$TEMP/env.local.bak" .env.local
  ```
- **Vercel Preview deployments use the DEV database**, not prod — previews can't show prod content.
- Local: `.env` = dev DB (`ep-jolly-glade`). Prod DB (`ep-quiet-band`) URL is Sensitive in Vercel; only available from the Neon console (ask the user).
- Dev server: Browser pane `preview_start` name `seven-eleven-trading` (dev, slow first compile) or `seven-eleven-trading-prod` (`npm run build` first). Node at `C:\Program Files\nodejs` (prefix PATH in Bash).

## 2. Current state (all on `main`, deployed to goldensevenfoods)

**2026-10-07 -- Product card images DEPLOYED** (`fix/product-card-image` -> local `main` @ `f123ace`, deploy `goldensevenfoods-uyajz8y51`; rollback = `goldensevenfoods-6m5jsa29w`). Cards show the product's own image (`cardVariantFields` no longer overrides it; variant image only for per-variant cards or a product with no image); «الأنواع المتاحة» shows each variant's image. e2e/product-images.spec.ts 12/12 on live. Open: أبشر بالبطاطس's main image is the 7 mm variant's photo (upload its own); product page overflows horizontally at 390px (pre-existing); not done: ?variant=<id> on the product page, product image as OG image, admin warning for a parent without its own image.

**2026-10-05 -- Products page builder + alignment + quote dropdown DEPLOYED to production** (`feat/products-page-builder` fast-forwarded into local `main` @ `6048865`, deploy `goldensevenfoods-6m5jsa29w`; rollback = `goldensevenfoods-db1vpbn3x`). Prod: backup `design-assets/backups/prod-pre-products-page-2026-10-05.json` -> migration `20261005120000_products_page_builder` applied -> both system pages seeded + published -> **switch «صفحات المنتجات» ON** (turn off in Admin -> Settings to fall back to the built-in pages instantly). The prod DB URL/password was pasted in chat again on 2026-10-05: rotate it in Neon + Vercel + .env.
- A (`d4098b5`): alignment «المحاذاة» تلقائي/يمين/وسط/شمال/ضبط for sections (saved left/right keep their logical meaning) and styled text fields (align + alignMobile); /contact details card now on the start side; G7 photo text start/end; quote form side; FAQ text-left and WhatsApp right-* -> logical.
- B (`49c932f`): «المنتجات المطلوبة» = `<MultiSelectDropdown>` (components/ui/multi-select-dropdown.tsx; model lib/quote/products-field.ts); Dropdown default / Pills legacy per Quote block; payload `productItems` (slug~variantId), AR/EN lines in the lead; server requires 1 product.
- C (`56567d6` + follow-ups): system pages (Page.isSystem) «المنتجات» (slug products) and «قالب صفحة المنتج» (__template__product); blocks PRODUCTS_CATALOG / PRODUCT_DETAILS (required) / PRODUCT_RELATED; switch Admin -> Settings «صفحات المنتجات» (SiteSetting.productsPageBuilderEnabled, env PRODUCTS_PAGE_BUILDER=off|on); off = built-in pages unchanged. Seed: `npx tsx scripts/seed-products-system-pages.ts [--apply] [--force]`.
- Migration `20261005120000_products_page_builder` (2 boolean columns) applied on DEV only. Prod order: backup -> migrate deploy -> seed --apply -> deploy -> (switch on when happy). Code reads Page.isSystem, so NEVER deploy before the prod migration.
- DEV DB INCIDENT 2026-10-05 ~11:44 UTC: a `prisma migrate diff --shadow-database-url <dev>` wiped dev. Rebuilt from `design-assets/backups/prod-pre-text-styles-2026-10-05.json` with `scripts/restore-db-json.ts` (dev now = prod data of 09:07 UTC, incl. real users/leads). Dev QA admin = SEED_ADMIN_* from .env. Never pass a real DB as a shadow DB.
- Tests: unit 50+ (align, quote field, listing params, system pages); e2e quote-dropdown, alignment, products-page-builder (dev only, writes + reverts), regression.spec.ts (screenshot diff vs live, E2E_REGRESSION=1).

**2026-10-05 -- Text styling P2 deployed to production** (`feat/text-styling-p2` fast-forwarded into local `main`, commit `8c09f5f`, deploy `goldensevenfoods-db1vpbn3x`; rollback = `goldensevenfoods-xdf76nclg` (P1)). Text-styling switch still OFF on prod, so styling does not show on the live site until it is turned on in Admin -> Settings -> «تنسيق النصوص». e2e not run on prod (form test blocked by the permission check); /ar, /en, products, product page, about, contact return 200. No migration (page-builder styling lives in `__rich` maps inside dataEn/dataAr). Styled editor + public rendering for the remaining page-builder blocks: Hero (+ slides), Heading, Page intro, CTA, Banner, Image+Text, Two/Three/Four columns, Statistics, Testimonials, Timeline (list + journey), Icon/Feature cards, Accordion/FAQ/Tabs, Newsletter, Contact/Quote form (heading, text, button, field labels, side panel), Product grid/carousel (heading, description, promo card), Category/Brand/News/Certifications/Solutions grids + Gallery, Logo cloud, Marquee, Social, Contact details (headings). Left plain on purpose: URLs, alt text, sizes, per-card CTA labels and the "All" filter chip (repeated on every card), the Hero decorative background text, Rich Text (already HTML). A styled Hero/slide/Newsletter-panel headline renders as a plain h1/h2 (the word-by-word KineticText animation needs a plain string). Tests: `src/lib/text-style/block-coverage.test.ts` (33/33 unit). Dev QA page: `npx tsx scripts/qa-text-styles-p2-dev.ts` -> /ar/qa-text-styles-p2 (`--cleanup` removes it; currently removed). Admin editor still not browser-tested (needs a login). Next: P3.

**2026-10-05 -- Text styling P1 deployed to production** (`feat/text-styling` -> local `main`, commit `dd4f670`, deploy `goldensevenfoods-xdf76nclg`; previous deploy for rollback = the variants deploy). Migration `20261005081606_text_styles` (13 `rich Json?` columns + `SiteSetting.textStylesEnabled`) applied on dev + prod; prod backup `design-assets/backups/prod-pre-text-styles-2026-10-05.json`. **Switch is OFF on prod** (Settings -> «تنسيق النصوص»; `TEXT_STYLES_ENABLED=off` forces off). Code: `src/lib/text-style/` (format, zod, `__rich` pass-through, flag), `src/components/text/styled-text.tsx` (renderer), `src/components/admin/text/styled-text-field.tsx` (TipTap editor), `styledProps` in `components/admin/ui/field.tsx`. P1 = G7 home blocks, product texts, variants, options. TODO: P3 (categories, brands, solutions, FAQ, certifications, menus, footer/settings, forms, blog); admin editor not yet browser-tested (needs a login). Dev DB has the switch ON + QA styling on absher-french-fries.

**2026-10-05 -- Variant products deployed to production** (branch `feat/admin-variant-products`, fast-forwarded into local `main`, NOT pushed yet). Previous production deploy for rollback: `goldensevenfoods-6h2y5bgrv` (commit `d43d145`).
- Migrations `20261004225505_product_variants` + `20261005044548_variant_descriptions` applied on dev AND prod (additive only).
- Prod backup before the change: `design-assets/backups/prod-pre-variants-2026-10-05.json` (all tables, via `scripts/backup-db-json.ts`; no Neon branch was made).
- Prod data: Absher 7/10 mm merged into `absher-french-fries` («أبشر بالبطاطس», group SKU `AB-01-GRP`, variants AB-01/AB-02); old products unpublished; 301s in `next.config.ts` + Redirect rows. Revert logs: `scripts/.migrate-variants-ep-quiet-band-*.json` (gitignored -- keep them) -> `npx tsx scripts/migrate-variants.ts --revert --log <file> [--apply]` (needs the code rolled back too).
- **Variants are OFF on the live site** (`SiteSetting.variantsEnabled=false`); switch in Admin -> Product options. `VARIANTS_ENABLED=off` env forces off. Dev DB has it ON plus QA data -- remove with `npx tsx scripts/qa-variants-dev-data.ts --cleanup`.
- Not yet verified with a real admin login: the «الأنواع» editor, /admin/options, the admin e2e flow (needs E2E_ADMIN_EMAIL/PASSWORD).
- Code map: `src/lib/catalog/variants/` (core/schema/load/copy + tests, `npm run test:unit`), admin `products/[id]/variants/`, `products/variant-actions.ts`, `options/`; public `products/[slug]/variant-islands.tsx`, `components/site/variant-selector.tsx`; e2e `e2e/variants.spec.ts`.
- The dev and prod DB password (shared) was pasted in chat on 2026-10-05 -- the user should rotate it in Neon and update Vercel + `.env`.

**Homepage = Page Builder page** (`slug __homepage__`) built from the **G7_\*** blocks (`src/lib/page-builder/blocks/golden/`, registry `golden-blocks.ts`, Add-panel group "Golden Seven home"): Hero, About, Categories, Featured products, Brands, Lifestyle banner, Steps, Business sectors, Quote form. It is published on prod. `scripts/build-home-v7.ts [--dry-run]` rewrites a homepage DRAFT with these sections (old sections kept hidden).

Key behaviour:
- **Catalog-driven cards** (`golden/resolve.ts`): category/product/brand cards link and count from the catalog — explicit picker (`categoryId`/`productId`/`brandId`) or automatic name match (Arabic-normalized; a typed `/products/<slug>` URL only wins if that product exists). Category card titles = catalog category names. Brand counts computed ("منتجان", "٨ منتجات").
- **Per-domain identity** (`src/lib/brand.ts`, by host; `SITE_BRAND` env overrides): on goldensevenfoods the site NAME is "جولدن سفن فودز"/"Golden Seven Foods" (titles, footer ©, JSON-LD). **Logo is editable again** from Admin → Settings (header + footer logo); the static Golden Seven file (`public/images/brand/golden-seven-logo*.webp`) is only a fallback when no logo is uploaded.
- **One fluid type scale** (`--fs-hero/h2/h3/product/p/ui/small` + `.t-*` classes in `src/app/globals.css`): hero 38→68px, H2 30→44, H3 22→26, product 19→21, paragraph 17→19 (390→1440px). Old `.g7-*` / `.text-h*` classes are aliases.
- **Design tokens** `--g7-*` (teal/gold/cream) + Lama Sans self-hosted (`src/fonts/lama-sans`, next/font/local). Site-wide: 12px cards, 6px buttons, bold headings, dark-teal product card (`src/components/site/product-card.tsx`).
- **Text-on-photo position controls** (hero, banner, quote image, category labels) in the Page Builder.
- **Quote form** (G7_QUOTE → `submitQuoteRequestAction` in `src/app/[locale]/page-builder-lead-action.ts`): saves a QUOTE lead via `submitLead` (no email field — stored as ""; phone required; city/products/quantity folded into the message). "Other city" shows a required city input. Anchors `#quote` (form panel) and `#quote-form` (heading).
- Header/footer restyled to the design; footer newsletter band removed.
- **E2E:** `npm run test:e2e` (Playwright, system Chrome; `PLAYWRIGHT_BASE_URL`, optional `E2E_HOME_SUFFIX=?preview=draft` + `E2E_ADMIN_EMAIL/PASSWORD` for local drafts). Form test aborts the request (no lead). 14/14 pass on production.
- `design-assets/` (gitignored, never deployed): design reference, audit PDF, logo, before/after/production screenshots.

## 3. Open items (waiting on the user)

1. **Logo:** prod Settings logo is still the Seven Eleven PNG, so the live header/footer show Seven Eleven. User should upload `design-assets/logo/golden-seven-logo.png` in Admin → Settings (shared DB → also shows on seven-eleven-trading).
2. **DB spelling fixes NOT applied on prod:** category names «بطاطس/فواكه/خضروات مجمده» → «مجمدة», brand «جولدن سيفن» → «جولدن سفن», site name «جولدن سيفين فودز». Run (needs prod URL from Neon + user OK):
   `DATABASE_URL="<prod>" npx tsx scripts/fix-audit-content.ts` (dry run) then `--apply`.
3. **No verified contact method** (phone/WhatsApp/email) exists — footer has none. Don't invent one.
4. **Favicon** is still the Seven Eleven image (SiteSetting favicon) — ask before changing.
5. **Legal pages** (`src/lib/legal-content.ts`) name «سفن إليفن للتجارة» as the company — ask.
6. **Catalog name typos** (user's data, list only): "Absher Frensh Fries", «لب الجوافه», «توتابورى», slug `golden-even-reen-peas-carrot`.
7. **seven-eleven-trading** not redeployed; its old code doesn't know the G7 blocks now published in the shared DB (its homepage likely renders sections missing). Redeploy only if the user asks.
8. City and quantity options in the quote form are placeholders (8 cities, 4 ranges) — confirm with the user.
9. Contrast: cream text on gold buttons/badges is below WCAG AA for small text (design colors) — reported, unchanged.

## 4. Rules (from the user)

- **Ask before** any deploy, any `prisma migrate deploy` (dev included), and any production DB/content change. Approval is per action.
- Don't invent data (contacts, prices, product info). Don't redesign beyond the request.
- Verify (typecheck `npx tsc --noEmit`, `npm run lint`, `npm run build`) with a strict chain — a `;` once let a broken commit through. Many files are CRLF; edit with node scripts that normalize and restore line endings, or the Edit tool.
- QA on dev with disposable data and delete it afterwards; anonymous checks with curl.
