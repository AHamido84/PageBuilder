import { headers } from "next/headers";

/**
 * Per-domain brand identity. Both Vercel projects (goldensevenfoods, seven-eleven-trading) run this
 * codebase against ONE shared database, so SiteSetting (logo, site name) can only hold one
 * identity. The Golden Seven domain therefore takes its NAME from here. The logo stays editable in
 * /admin/settings (header logo, footer logo); the static Golden Seven file below is only used when
 * no logo is uploaded.
 *
 * Resolution: SITE_BRAND env ("golden-seven" | "seven-eleven") wins; otherwise a host containing
 * "seven-eleven"/"seveneleven" is Seven Eleven and everything else (goldensevenfoods.com, its
 * vercel.app/preview hosts, localhost) is Golden Seven.
 */
export type SiteBrand = "golden-seven" | "seven-eleven";

export const GOLDEN_SEVEN = {
  /** Brand name (logo, short references). */
  name: { ar: "جولدن سفن", en: "Golden Seven" },
  /** Full company name (copyright, metadata, JSON-LD). */
  companyName: { ar: "جولدن سفن فودز", en: "Golden Seven Foods" },
  logo: {
    src: "/images/brand/golden-seven-logo.webp",
    src2x: "/images/brand/golden-seven-logo@2x.webp",
    width: 260,
    height: 150,
  },
  /** Business facts for structured data (JSON-LD) only, as supplied by the owner (2026-10-07). */
  contact: {
    telephone: "+966565908777",
    email: "info@goldensevenfoods.com",
    addressLocality: { ar: "جدة", en: "Jeddah" },
    addressCountry: "SA",
    areaServed: { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
  },
  /** Square brand icon (public/icon.png, 512x512) -- the Organization logo for search engines. */
  squareLogo: { src: "/icon.png", size: 512 },
  /**
   * Official social profiles for Organization.sameAs. TODO(owner): add the full profile URLs, e.g.
   *   "https://www.instagram.com/<handle>", "https://x.com/<handle>",
   *   "https://www.linkedin.com/company/<slug>", "https://www.facebook.com/<page>",
   *   "https://www.tiktok.com/@<handle>", "https://www.snapchat.com/add/<handle>"
   */
  sameAs: [] as readonly string[],
  /** Registered legal name (Organization.legalName). TODO(owner): confirm -- left unset until then. */
  legalName: null as string | null,
} as const;

export async function getSiteBrand(): Promise<SiteBrand> {
  const forced = process.env.SITE_BRAND;
  if (forced === "golden-seven" || forced === "seven-eleven") return forced;
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  return /seven-?eleven/.test(host) ? "seven-eleven" : "golden-seven";
}

/** Misspelled Arabic variants of the brand seen in stored content ("جولدن سيفين", "جولدن سيفن", ...). */
const ARABIC_NAME_VARIANTS = /جولدن\s+(?:سيفين|سيفن|سفين|سڤن)/g;

/** Normalizes the brand's Arabic spelling inside free text coming from shared DB content. */
export function normalizeBrandSpelling(text: string): string {
  return text.replace(ARABIC_NAME_VARIANTS, GOLDEN_SEVEN.name.ar);
}

/** Display identity for the current request: name/companyName per locale + optional static logo. */
export async function getBrandIdentity(locale: string, fallback: { siteNameAr?: string | null; siteNameEn?: string | null } = {}) {
  const brand = await getSiteBrand();
  const isAr = locale === "ar";
  if (brand === "golden-seven") {
    return {
      brand,
      name: isAr ? GOLDEN_SEVEN.name.ar : GOLDEN_SEVEN.name.en,
      companyName: isAr ? GOLDEN_SEVEN.companyName.ar : GOLDEN_SEVEN.companyName.en,
      logo: GOLDEN_SEVEN.logo as typeof GOLDEN_SEVEN.logo | null,
    };
  }
  const siteName = (isAr ? fallback.siteNameAr : fallback.siteNameEn) || "Seven Eleven Trading";
  return { brand, name: siteName, companyName: siteName, logo: null as typeof GOLDEN_SEVEN.logo | null };
}
