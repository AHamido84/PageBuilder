import type { Metadata } from "next";
import { getBrandIdentity, normalizeBrandSpelling } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

import { SITE_URL, absoluteUrl } from "./site-url";
import { SITE_DEFAULT_COPY, type SeoCopy } from "./page-copy";

// The one site origin (src/lib/seo/site-url.ts), re-exported for existing importers.
export { SITE_URL };

/** Default 1200x630 share image (public/og) used when neither the page nor Admin -> Settings sets one. */
export const DEFAULT_OG_IMAGE = { url: "/og/golden-seven-foods.jpg", width: 1200, height: 630 };

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
  /** Golden Seven search copy (src/lib/seo/page-copy.ts): an absolute title + description used when
   *  the CMS SEO record leaves them empty. Ignored on the Seven Eleven domain. */
  copy?: SeoCopy | null;
  /** Page-specific share image (e.g. the product photo), below the CMS SEO record's own. */
  image?: string | null;
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
  copy,
  image,
}: BuildMetadataInput): Promise<Metadata> {
  const settings = settingsInput ?? (await getSeoSiteSettings());
  const isAr = locale === "ar";
  const cleanPath = path === "/" ? "" : path;

  // Per-domain identity (src/lib/brand.ts): Golden Seven on goldensevenfoods, SiteSetting elsewhere.
  const identity = await getBrandIdentity(locale, settings ?? {});
  const siteName = identity.companyName;
  const rawCustomTitle = (isAr ? seo?.titleAr : seo?.titleEn) || null;
  const customTitle = rawCustomTitle && identity.brand === "golden-seven" ? normalizeBrandSpelling(rawCustomTitle) : rawCustomTitle;
  const isGolden = identity.brand === "golden-seven";
  const pageCopy = isGolden ? copy : null;
  const title = customTitle || pageCopy?.title || `${fallbackTitle} — ${siteName}`;

  const description =
    (isAr ? seo?.descriptionAr : seo?.descriptionEn) ||
    pageCopy?.description ||
    fallbackDescription ||
    (isAr ? settings?.seoDefaultDescriptionAr : settings?.seoDefaultDescriptionEn) ||
    (isGolden ? (isAr ? SITE_DEFAULT_COPY.ar : SITE_DEFAULT_COPY.en).description : undefined);

  // Self-referencing and query-free (?size=7mm etc. never reach `path`); a category listing keeps
  // its own ?category= because that parameter is what makes it a distinct page.
  const canonical = seo?.canonicalUrl || `${SITE_URL}/${locale}${cleanPath}`;
  const pageImageUrl = seo?.ogImage?.url || image || settings?.defaultOgImage?.url || null;
  const ogImage = pageImageUrl
    ? { url: absoluteUrl(pageImageUrl), alt: title }
    : { ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url), alt: title };
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
      alternateLocale: isAr ? ["en_US"] : ["ar_SA"],
      type: ogType,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
