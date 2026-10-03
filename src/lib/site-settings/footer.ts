import { z } from "zod";

/**
 * SiteSetting.footerSettings -- footer options beyond the text fields that already had their own
 * columns (about text, newsletter title/body). Every field is optional and defaults to the
 * footer's original behavior, so a null/malformed value renders exactly the footer as it was.
 */
const text = (max: number) => z.string().max(max).optional();

export const footerSettingsSchema = z.object({
  showNewsletter: z.boolean().optional(),
  showProductsColumn: z.boolean().optional(),
  showContactColumn: z.boolean().optional(),
  showLegalLinks: z.boolean().optional(),
  productsTitleEn: text(60),
  productsTitleAr: text(60),
  contactTitleEn: text(60),
  contactTitleAr: text(60),
  /** Supports {year} and {siteName}. Empty = "© {year} {siteName}. All rights reserved." (localized). */
  copyrightEn: text(200),
  copyrightAr: text(200),
});
export type FooterSettings = z.infer<typeof footerSettingsSchema>;

export function parseFooterSettings(raw: unknown): FooterSettings {
  const parsed = footerSettingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

export function formatCopyright(template: string | undefined, fallback: string, values: { year: number | string; siteName: string }): string {
  const source = template?.trim() ? template : fallback;
  return source.replaceAll("{year}", String(values.year)).replaceAll("{siteName}", values.siteName);
}
