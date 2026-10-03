/** Returns the URL only if it is an absolute http(s) URL -- for admin-entered external links rendered as `href`. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
}
