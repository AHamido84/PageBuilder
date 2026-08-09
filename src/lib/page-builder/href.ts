/** Resolves a CTA/link URL: absolute (http/https/mailto/tel) URLs pass through untouched, relative paths get the current locale prefixed. */
export function resolveHref(url: string, locale: string): string {
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `/${locale}${path}`;
}
