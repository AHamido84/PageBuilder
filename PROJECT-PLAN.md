# Seven Eleven Trading — Website & CMS: Phase 0 Analysis & Architecture Plan

Status: **Planning only. No implementation started.** Awaiting go-ahead to begin Phase 1.

---

## 0. Repository state (as found)

`D:\Claude Code` is **empty** — no `package.json`, no framework, no components, routes, database, auth, CMS, assets, fonts, deployment config, or tests exist. This is a greenfield build, not a migration. The "preserve / refactor / broken / risks" analysis the brief asks for therefore has no existing code to apply to — it's deferred to Phase 1+ as new code is written, and re-run for real once any starter template or existing asset is dropped in.

**External check performed** (since no local assets existed to inspect):
- LinkedIn company page: reachable, confirms Jeddah HQ, wholesale import/export, food distribution, founded 2023, 51–200 employees, frozen food specialty, serves hotels/restaurants/catering/hospitals/wholesale.
- `7eleventrading.org` (their current site, referenced as prior art): **connection refused** at fetch time. Don't assume it's permanently down — confirm with the client whether it's a DNS/hosting lapse, and ask if this project is meant to replace it, and whether the domain will transfer.
- No certifications, awards, partnerships, or statistics found anywhere public. None are invented in this plan or will be in later copy — placeholders will be explicitly marked `[CLIENT TO PROVIDE]`.

---

## 1. Business analysis → design/content implications

| Trait to communicate | What that means structurally |
|---|---|
| Trust, reliability, food safety | Dedicated quality/food-safety page with real cold-chain/handling process content (client-supplied), not stock claims |
| B2B capability | No cart/checkout — the primary conversion is a **quote/inquiry request**, not e-commerce |
| Saudi market presence + international sourcing | Bilingual **Arabic (primary) / English** from day one, not bolted on later |
| Logistics, distribution, cold-chain | Visual language should lean into cold-chain/logistics imagery and process, not generic "corporate handshake" stock photography |
| Premium products, frozen food specialty | Product catalog needs categories/temperature-class metadata (frozen/chilled/ambient), not just a flat product list |
| Target buyers (hotels, restaurants, catering, hospitals, wholesale) | Segment-aware landing content — the homepage should speak to a procurement manager, not a consumer |

---

## 2. Recommended architecture

**Pattern:** Single Next.js application with an embedded CMS (Payload CMS 3, which runs inside Next.js itself — one codebase, one deploy, shared TypeScript types between content schema and frontend). This avoids the two-repo/two-deploy overhead of a separate headless CMS while still giving the client a real admin UI, not a "call me to edit copy" static site.

```
seven-eleven-trading/
├── src/
│   ├── app/
│   │   ├── (frontend)/[locale]/          # public site, ar/en
│   │   │   ├── page.tsx                  # home
│   │   │   ├── about/
│   │   │   ├── products/[category]/[slug]/
│   │   │   ├── quality/                  # food safety — real content only
│   │   │   ├── contact/
│   │   │   └── [...slug]/                # CMS-driven flexible pages
│   │   └── (payload)/admin/[[...segments]]  # CMS admin, mounted at /admin
│   ├── collections/                      # Payload: Pages, Products, Categories,
│   │                                      # Media, Leads, NavigationMenus, SiteSettings
│   ├── blocks/                           # page-builder blocks (see §7)
│   ├── components/                       # UI (shadcn/ui primitives + custom)
│   ├── lib/                              # data access, validation, email
│   └── i18n/                             # next-intl config, ar/en message catalogs
├── public/
└── payload.config.ts
```

## 3. Recommended tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript | SSR/SSG for SEO-critical B2B pages, ISR for product catalog |
| CMS | Payload CMS 3 | Embeds in Next.js, native page-builder (blocks), built-in RBAC + drafts + localization, no vendor lock-in |
| Database | PostgreSQL (Payload Postgres adapter) | Relational fit for products/categories/leads; portable, self-hostable |
| Styling | Tailwind CSS v4 + shadcn/ui | Accessible primitives, fast to theme, matches the design-token approach below |
| i18n | next-intl + Payload localization | Arabic (RTL) / English, one content model, two renderings |
| Forms/email | Server actions + Zod validation + Resend (or client SMTP) | Type-safe validation, no invented CRM integration |
| Media | Payload media collection + `sharp` | Auto-resize/format, avoids serving oversized originals |
| Hosting | Vercel (or Docker self-host — open question, see §16) | Next.js-native; self-host only if data residency requires it |
| Testing | Vitest (unit) + Playwright (e2e, incl. RTL layout checks) | Covers logic and real browser rendering, both locales |

## 4. Database architecture

Core tables (via Payload collections, Postgres-backed):
- `pages` — flexible CMS pages built from blocks (§7), versioned with drafts
- `products`, `product_categories` — name, description, category, temperature class (frozen/chilled/ambient), images, spec sheet (optional PDF), localized fields (ar/en)
- `media` — uploads, alt text (required, both locales), focal point
- `navigation_menus` — header/footer menu structures
- `site_settings` — singleton: contact details, social links, business hours, default SEO/OG image
- `leads` — inquiry/quote submissions: contact info, message, requested products, source page, timestamp, spam-flag
- `users` — CMS admin accounts only (no public user accounts — this is not a customer portal)

No product pricing/inventory sync is in scope unless the client confirms an ERP/data source (see open questions, §17).

## 5. Authentication architecture

- **Admin/CMS only.** Payload's built-in auth (email + password, httpOnly session cookie) for staff editing content.
- Roles: `Admin` (full access incl. users/settings), `Editor` (content + products + media, no user management), `Viewer` (read-only, for stakeholder review) — RBAC enforced at the Payload access-control layer, not just hidden UI.
- **No public-facing authentication** in this phase — the public site has no accounts, carts, or logins. If a future B2B ordering portal is wanted, that's a distinct phase with its own auth model (flagged in roadmap, not built now).

## 6. CMS architecture

- Payload admin mounted at `/admin`, same deploy as the public site.
- Draft/publish workflow on `pages` and `products` so editors can stage changes without affecting the live site.
- Field-level localization (ar/en) on every editorial field — editors fill both locales in one screen, not separate content trees.
- Media library with mandatory alt-text field (accessibility + SEO), organized by collection type (product photography, facility/logistics, corporate).

## 7. Page Builder architecture

Block-based, editor-composable pages (Payload blocks), each with a typed schema and matching React renderer:

- `HeroBlock` — headline, supporting copy, image/video, primary CTA
- `ValuePropsBlock` — repeatable icon + label + short text (only used where content is genuinely enumerable — not forced onto every page)
- `ProductGridBlock` — pulls from `products`, filterable by category
- `ProcessBlock` — ordered steps (used only for genuinely sequential content, e.g. a real cold-chain/logistics process — not decorative numbering)
- `TextBlock` / `RichTextBlock` — general editorial content
- `GalleryBlock` — facility/product imagery
- `ContactCTABlock` — lead-form embed or link
- `MediaTextBlock` — image + copy, left/right variants

Editors compose these per-page in the admin; developers only add new block types, not new pages.

## 8. Product architecture

- `ProductCategory` (e.g. Frozen, Chilled, Ambient, Bakery, Dairy, Disposables — **placeholder taxonomy, confirm real categories with client**) → `Product` (name, description, category, temperature class, images, optional spec sheet, localized).
- Catalog is **informational, not transactional** — no cart, no price display unless client requests a quote-request-per-product flow (recommended: "Request a quote" CTA per product/category instead of pricing).

## 9. Media architecture

- All imagery either client-supplied (product/facility photography) or clearly-licensed stock, resized server-side via `sharp` into responsive srcsets.
- No fabricated "certification badge" or "award" imagery — if the client later supplies real certifications (e.g. SFDA, HACCP, ISO), a `CertificationsBlock` can be added; not built speculatively now.
- CDN delivery via hosting platform (Vercel Image Optimization, or equivalent if self-hosted).

## 10. Menu architecture

- `navigation_menus` singleton(s) for header and footer, editor-managed (label, link, order, optional children for a dropdown), localized labels.
- Mobile nav: standard disclosure pattern, RTL-aware.

## 11. Internationalization architecture

- **Arabic (primary) / English**, routed via `[locale]` segment (`/ar/...`, `/en/...`), `next-intl` for UI strings, Payload localization for content fields.
- Full RTL support: Tailwind logical properties (`ms-`/`me-` not `ml-`/`mr-`), mirrored layout/iconography where directional, Arabic type pairing chosen deliberately (not just a fallback system font) — this is a design-system decision to make properly in Phase 1, not an afterthought.
- `hreflang` tags for SEO between the two locales.

## 12. SEO architecture

- Next.js Metadata API per page/product, dynamic OG images, `sitemap.xml` + `robots.txt` generated from CMS content, JSON-LD (`Organization`, `LocalBusiness`, `Product` where applicable — only fields with real data populated).
- Core Web Vitals budget set and tested in Phase 6 (image optimization, font loading strategy, minimal client JS on marketing pages).

## 13. Forms/Lead architecture

- Contact + per-product/category "Request a quote" forms → server action → Zod-validated → stored in `leads` collection → email notification to a client-supplied address (Resend or client SMTP).
- Spam mitigation: honeypot field + rate limiting; add Turnstile/hCaptcha only if abuse is observed (avoid friction by default).
- No CRM integration invented or assumed — flagged as an open question (§17) if the client has one (e.g. HubSpot, Zoho) they want leads pushed to.

## 14. Admin architecture

- Payload admin UI (`/admin`), role-scoped (§5).
- Editors manage: pages (via blocks), products/categories, media, navigation, site settings, and view/export leads.
- No custom admin UI built from scratch — Payload's generated admin is themed to match brand rather than reinvented.

## 15. Security architecture

- RBAC in CMS (§5); server-side Zod validation on every mutation, not just client-side.
- Rate limiting + honeypot on public forms (§13); CSRF handled by Payload/Next defaults, verified not bypassed.
- Upload validation: MIME/type/size checks on media, never trusting client-declared file type.
- Standard headers: CSP, HSTS, `X-Content-Type-Options`, etc. set at the Next.js/hosting layer.
- Secrets via environment variables only, never committed; `.env.example` checked in, `.env` gitignored.
- Dependency scanning (`npm audit` / Dependabot) as part of CI.

## 16. Deployment architecture

- **Open decision, not yet made:** Vercel (fastest path, Next.js-native, global edge) vs. self-hosted Docker (Next.js + Payload + Postgres) on a regional VPS. This matters if the client has a **Saudi data-residency requirement** — flagged as a question for the client, not assumed either way.
- CI: lint + typecheck + unit tests + build on every PR; e2e (Playwright) on merge to main.
- Environments: `production`, `staging` (client review before publish), local dev via Docker Compose for Postgres.

## 17. Testing architecture

- Unit (Vitest): validation schemas, data-access helpers, block renderers.
- E2E (Playwright): critical paths in **both locales** — homepage, product browse, lead form submit, admin login + create/publish a page.
- Accessibility: automated `axe` checks in CI + manual keyboard-nav pass (this is a B2B trust-building site — accessibility is part of the "premium" bar, not optional).
- Visual: RTL layout regression checks (mirroring bugs are the most common RTL failure mode).

---

## Preserved / refactored / broken / risks

Since there is no existing codebase: **nothing to preserve, nothing to refactor, nothing broken.** This section will be re-run for real the moment any starter template, existing brand assets, or legacy export is added to the repo.

**Risks identified now, from the business-analysis side:**
1. `7eleventrading.org` unreachable at time of check — confirm with client whether this project replaces it and whether DNS/domain transfer is needed.
2. No brand assets (logo, color codes, existing type choices) found anywhere public — Phase 1 design-token work depends on either client-supplied brand guidelines or a from-scratch identity proposal (design-lead judgment call, to be presented before full build).
3. No real product data, certifications, or process content available — placeholder-marked until supplied; launch should not proceed with invented claims in these areas.

**Missing dependencies:** none yet (nothing installed). Phase 1 will pin exact versions when scaffolding.

**Missing environment variables** (to define in `.env.example` at Phase 1 start): `DATABASE_URL`, `PAYLOAD_SECRET`, `RESEND_API_KEY` (or SMTP creds), `NEXT_PUBLIC_SITE_URL`, lead-notification recipient address.

---

## Implementation roadmap

| Phase | Scope |
|---|---|
| **0 — Analysis (this doc)** | Done. Awaiting approval to proceed. |
| **1 — Foundation** | Scaffold Next.js + TS + Tailwind + shadcn; install Payload + Postgres; i18n/RTL scaffolding; **design-token proposal** (palette, type pairing, layout concept, one signature visual element) presented for approval before UI is built |
| **2 — CMS & content modeling** | Collections (§4), page-builder blocks (§7), navigation, site settings |
| **3 — Public website** | Home, About, Products/Catalog, Quality (real content only), Contact, CMS-driven flexible pages — built on the approved design tokens |
| **4 — SEO & performance** | Metadata, sitemaps, structured data, Core Web Vitals pass, hreflang |
| **5 — Admin/CMS polish** | RBAC roles live, draft/publish flow, lead inbox/export, admin theming |
| **6 — Testing & QA** | Unit + e2e (both locales) + accessibility + RTL visual regression |
| **7 — Deployment & launch** | Hosting decision finalized (§16), CI/CD, env vars, analytics (privacy-conscious), backups |
| **8 — Handover** | CMS usage docs + short training for the client's content editors |

---

## Open questions for the client (blocking Phase 1 design work)

1. Is `7eleventrading.org` being replaced, and does the domain transfer to this project?
2. Any existing brand guidelines (logo, colors, fonts) — or is visual identity being created from scratch here?
3. Arabic as primary language, English secondary — confirm, since this drives layout direction throughout.
4. Real product catalog source — spreadsheet, ERP export, or manual entry into the CMS?
5. Any real certifications/standards compliance (SFDA, HACCP, ISO, etc.) to feature? None will be shown until confirmed.
6. Hosting/data-residency requirement — Saudi-hosted infrastructure required, or is Vercel/global-edge acceptable?
7. Any existing CRM leads should feed into (e.g. HubSpot, Zoho), or is the built-in leads inbox sufficient for now?
8. Is a future B2B login/ordering portal in scope eventually? (Affects whether we leave room for it in Phase 1's data model, even though it's not built now.)

---

**Waiting for your review of this plan before Phase 1 begins.**
