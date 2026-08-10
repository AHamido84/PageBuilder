import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export { SITE_URL };

export interface SeoRecord {
  titleEn: string | null;
  titleAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  ogImage?: { url: string } | null;
}

/** Cached per-request via React's fetch memoization isn't available for Prisma, so callers
 *  that also need settings for other rendering should fetch once and pass it in where possible. */
export async function getSeoSiteSettings() {
  return prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    include: { defaultOgImage: { select: { url: true } } },
  });
}

type SiteSettingsForSeo = Awaited<ReturnType<typeof getSeoSiteSettings>>;

interface BuildMetadataInput {
  locale: string;
  /** Path without the locale prefix, e.g. "/products/fp-1001" or "/" for home. */
  path: string;
  seo?: SeoRecord | null;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  ogType?: "website" | "article";
  /** Pass in an already-fetched SiteSetting to avoid a redundant query when the caller needs it anyway. */
  settings?: SiteSettingsForSeo;
}

/**
 * Builds a full Next.js Metadata object from an optional per-entity SEO record, falling back
 * to SiteSetting-wide defaults, then a hardcoded site name. Handles canonical URL, hreflang
 * alternates (en/ar/x-default), Open Graph, Twitter card, and robots (noIndex).
 */
export async function buildMetadata({
  locale,
  path,
  seo,
  fallbackTitle,
  fallbackDescription,
  ogType = "website",
  settings: settingsInput,
}: BuildMetadataInput): Promise<Metadata> {
  const settings = settingsInput ?? (await getSeoSiteSettings());
  const isAr = locale === "ar";
  const cleanPath = path === "/" ? "" : path;

  const siteName = (isAr ? settings?.siteNameAr : settings?.siteNameEn) || "Seven Eleven Trading";
  const customTitle = (isAr ? seo?.titleAr : seo?.titleEn) || null;
  const title = customTitle || `${fallbackTitle} — ${siteName}`;

  const description =
    (isAr ? seo?.descriptionAr : seo?.descriptionEn) ||
    fallbackDescription ||
    (isAr ? settings?.seoDefaultDescriptionAr : settings?.seoDefaultDescriptionEn) ||
    undefined;

  const canonical = seo?.canonicalUrl || `${SITE_URL}/${locale}${cleanPath}`;
  const ogImageUrl = seo?.ogImage?.url || settings?.defaultOgImage?.url || undefined;
  const noIndex = seo?.noIndex ?? false;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en${cleanPath}`,
        ar: `${SITE_URL}/ar${cleanPath}`,
        "x-default": `${SITE_URL}/ar${cleanPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      locale: isAr ? "ar_SA" : "en_US",
      type: ogType,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
