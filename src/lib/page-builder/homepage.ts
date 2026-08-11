/**
 * Reserved `Page.slug` for the homepage's Page Builder record, rendered at `/`
 * by `src/app/[locale]/page.tsx` (see `scripts/seed-homepage.ts`). Deliberately
 * not a normal-looking slug like "home" so it's never independently reachable
 * through the `[...slug]` catch-all as a duplicate URL for the same content.
 */
export const HOMEPAGE_SLUG = "__homepage__";
