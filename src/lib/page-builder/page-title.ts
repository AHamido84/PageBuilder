/** PHASE 8: a Page's admin-entered title for this locale, or null when none was entered (callers keep their own fallback). */
export function pageTitle(page: { titleEn?: string | null; titleAr?: string | null } | null | undefined, locale: string): string | null {
  if (!page) return null;
  const title = locale === "ar" ? page.titleAr : page.titleEn;
  return title?.trim() || null;
}
