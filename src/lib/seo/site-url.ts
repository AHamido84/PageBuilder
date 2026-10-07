/**
 * The public origin every absolute URL is built from: metadataBase, canonical, og:url, hreflang
 * alternates, sitemap.xml, robots.txt and JSON-LD. Single source of truth -- never derive it from
 * VERCEL_URL or the request host (a preview or *.vercel.app host must still point search engines at
 * the real domain).
 *
 * NEXT_PUBLIC_* is inlined at build time, so a changed value needs a redeploy. A leading BOM /
 * whitespace (seen once in the Vercel env) and a trailing slash are stripped.
 */
export const PRODUCTION_SITE_URL = "https://www.goldensevenfoods.com";

const BOM_PATTERN = new RegExp("^" + String.fromCharCode(0xfeff));

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL)
  .replace(BOM_PATTERN, "")
  .trim()
  .replace(/\/$/, "");

/** The duplicate Vercel production alias that must 308 to PRODUCTION_SITE_URL (src/proxy.ts). */
export const DUPLICATE_PRODUCTION_HOST = "goldensevenfoods.vercel.app";

/** Absolute URL on SITE_URL for a site-relative path ("/ar/products") or an already-absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
