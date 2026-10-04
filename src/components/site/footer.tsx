import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { PublicMenuItem } from "@/lib/menus";
import { formatCopyright, parseFooterSettings } from "@/lib/site-settings/footer";
import { getBrandIdentity, normalizeBrandSpelling } from "@/lib/brand";

interface CategoryNavItem {
  id: string;
  slug: string;
  name: string;
}

interface FooterProps {
  categories: CategoryNavItem[];
  /** Admin FOOTER menu -- no longer rendered by the v7 footer (fixed design links), kept so the layout contract is unchanged. */
  menuItems?: PublicMenuItem[];
  locale: string;
}

interface SocialLinks {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

async function getSiteSettings() {
  return prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    include: { footerLogo: { select: { url: true } }, logo: { select: { url: true } } },
  });
}

const HEADING = "t-p font-medium text-[var(--g7-gold-500)]";
const LINK = "transition-colors hover:text-[var(--g7-gold-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";

/**
 * Golden Seven home v7 footer (design-assets/reference/10-footer.png): logo + tagline + domain,
 * "Quick links" (Products / Our story / For businesses) and
 * "Contact us" columns, then copyright and the language switch. No newsletter band (not in the
 * design; the Settings > Footer newsletter toggle no longer applies). Contact email/phone, legal
 * links and social links stay driven by /admin/settings as before.
 */
export async function SiteFooter({ locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const settings = await getSiteSettings();
  const social = (settings?.socialLinks as SocialLinks | null) ?? null;
  const isAr = locale === "ar";
  const footerOptions = parseFooterSettings(settings?.footerSettings);
  // Per-domain identity (src/lib/brand.ts): "جولدن سفن فودز" / Golden Seven logo on goldensevenfoods.
  const identity = await getBrandIdentity(locale, settings ?? {});
  const siteName = identity.companyName;
  const currentYear = new Date().getFullYear();
  const year = isAr ? new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(currentYear) : currentYear;
  const rawCopyright = formatCopyright(isAr ? footerOptions.copyrightAr : footerOptions.copyrightEn, t("rightsLine"), { year, siteName });
  const copyright = identity.brand === "golden-seven" ? normalizeBrandSpelling(rawCopyright) : rawCopyright;
  const logoUrl = settings?.footerLogo?.url ?? settings?.logo?.url ?? null;
  const address = settings?.address || t("address");

  // Design 10: three fixed quick links (the admin FOOTER menu was a long multi-column list).
  const quickLinks = [
    { id: "products", label: tNav("productsMenu"), href: `/${locale}/products` },
    { id: "about", label: tNav("ourStory"), href: `/${locale}/about` },
    { id: "business", label: tNav("forBusiness"), href: `/${locale}/solutions` },
  ];
  const socialEntries = ([
    ["Facebook", social?.facebook],
    ["LinkedIn", social?.linkedin],
    ["Instagram", social?.instagram],
    ["X", social?.twitter],
  ] as [string, string | undefined][]).filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <footer className="bg-[var(--g7-teal-800)] text-[var(--g7-cream-50)]">
      <div className="g7-container pb-[clamp(2.5rem,6vw,7rem)] pt-[clamp(3rem,4.4vw,5.3rem)]">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[44.7fr_31.2fr_24.1fr] lg:gap-0">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/${locale}`} className="inline-block">
              {!logoUrl && identity.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- fixed-size static logo; srcSet covers 2x
                <img
                  src={identity.logo.src}
                  srcSet={`${identity.logo.src} 1x, ${identity.logo.src2x} 2x`}
                  width={identity.logo.width}
                  height={identity.logo.height}
                  alt={identity.name}
                  loading="lazy"
                  className="h-[clamp(5rem,7.8vw,9.4rem)] w-auto"
                />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo of unknown aspect ratio; sized by height only
                <img src={logoUrl} alt={siteName} className="h-[clamp(5rem,7.8vw,9.4rem)] w-auto max-w-[clamp(9rem,13.7vw,16.5rem)] object-contain object-start" loading="lazy" />
              ) : (
                <span className="text-2xl font-bold">{siteName}</span>
              )}
            </Link>
            <p className="t-p mt-[clamp(1rem,1.9vw,2.25rem)] font-light">{t("tagline")}</p>
            <p dir="ltr" className="t-p mt-[clamp(0.5rem,1.2vw,1.4rem)] font-light rtl:text-right">
              {t("website")}
            </p>
          </div>

          <nav aria-label={t("quickLinks")}>
            <p className={HEADING}>{t("quickLinks")}</p>
            <ul className="t-ui mt-[clamp(1rem,2.1vw,2.5rem)] space-y-[clamp(0.25rem,0.5vw,0.6rem)] font-light">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={HEADING}>{t("contactUs")}</p>
            <ul className="t-ui mt-[clamp(1rem,2.1vw,2.5rem)] space-y-[clamp(0.25rem,0.5vw,0.6rem)] font-light">
              <li>{address}</li>
              {settings?.contactEmail ? (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} dir="ltr" className={`inline-block ${LINK}`}>
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}
              {settings?.contactPhone ? (
                <li>
                  <a href={`tel:${settings.contactPhone}`} dir="ltr" className={`inline-block ${LINK}`}>
                    {settings.contactPhone}
                  </a>
                </li>
              ) : null}
              <li>
                <Link href={`/${locale}#quote-form`} className={LINK}>
                  {tNav("requestQuote")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="t-small mt-[clamp(2.5rem,5.4vw,6.5rem)] flex flex-col gap-5 border-t border-[var(--g7-divider-on-teal)] pt-[clamp(1.5rem,2.3vw,2.75rem)] font-light sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {footerOptions.showLegalLinks !== false ? (
              <>
                <Link href={`/${locale}/privacy`} className={`text-sm opacity-80 ${LINK}`}>
                  {t("privacy")}
                </Link>
                <Link href={`/${locale}/terms`} className={`text-sm opacity-80 ${LINK}`}>
                  {t("terms")}
                </Link>
                <Link href={`/${locale}/cookies`} className={`text-sm opacity-80 ${LINK}`}>
                  {t("cookies")}
                </Link>
              </>
            ) : null}
            {socialEntries.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className={`text-sm opacity-80 ${LINK}`}>
                {label}
              </a>
            ))}
            <p className="flex items-center gap-3" aria-label={t("languageSwitch")}>
              <Link href="/ar" hrefLang="ar" lang="ar" aria-current={isAr ? "true" : undefined} className={`${LINK} ${isAr ? "font-medium" : "opacity-75"}`}>
                {t("languageAr")}
              </Link>
              <span aria-hidden="true">|</span>
              <Link href="/en" hrefLang="en" lang="en" aria-current={!isAr ? "true" : undefined} className={`${LINK} ${!isAr ? "font-medium" : "opacity-75"}`}>
                {t("languageEn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
