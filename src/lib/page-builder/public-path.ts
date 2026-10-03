import { HOMEPAGE_SLUG } from "./homepage";

/**
 * The public URL path (without locale) where a Page's content actually appears. Reserved pages
 * don't live at their own slug: Solution pages render at /solutions/<slug>, and the editable
 * index-page headers render on top of /products, /brands, /blog and /solutions.
 */
const HEADER_PATHS: Record<string, string> = {
  __header__products: "/products",
  __header__brands: "/brands",
  __header__blog: "/blog",
  "__header__solutions-index": "/solutions",
  __header__faq: "/faq",
};

export function publicPathForPageSlug(slug: string): string {
  if (slug === HOMEPAGE_SLUG) return "";
  if (slug.startsWith("__solution__")) return `/solutions/${slug.slice("__solution__".length)}`;
  return HEADER_PATHS[slug] ?? `/${slug}`;
}
