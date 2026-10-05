import { HOMEPAGE_SLUG } from "./homepage";

/**
 * Phase 11 QA fix: the site has three separate "this Page.slug backs another entity/zone, it
 * has no independently reachable URL of its own" conventions, added incrementally across earlier
 * sessions with no shared check between them -- `HOMEPAGE_SLUG` (`__homepage__`), Solution's own
 * `__solution__<slug>` (`admin/(dashboard)/solutions/actions.ts`'s `solutionPageSlug()`), and the
 * newer `__header__*` reserved header/intro pages (`page-headers.ts`). `sitemap.ts` excluded the
 * first two but was never updated when `__header__*` was introduced, leaking those 4 pages (x2
 * locales) into the sitemap as thin, cryptically-titled standalone URLs -- and the `[...slug]`
 * catch-all only ever guarded against the homepage slug, so any of these fragment-only pages was
 * (and, for `__solution__*`, still is) directly servable as a full page if the URL were guessed or
 * crawled. Centralized here so a future 4th convention only needs one edit, not a re-audit of
 * every call site that used to hand-roll its own prefix check.
 */
// `__template__*` (system-pages.ts): the product page template, rendered on every /products/<slug>.
const RESERVED_PAGE_SLUG_PREFIXES = ["__solution__", "__header__", "__template__"] as const;

export function isReservedPageSlug(slug: string): boolean {
  return slug === HOMEPAGE_SLUG || RESERVED_PAGE_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
}
