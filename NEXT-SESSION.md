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

Latest deploy: `goldensevenfoods-6h2y5bgrv` (commit `d43d145`). No schema changes since the 4 redesign migrations (all applied to prod).

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
