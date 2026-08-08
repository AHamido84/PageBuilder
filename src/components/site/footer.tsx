import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { NewsletterForm } from "./newsletter-form";
import { SOLUTIONS_SEGMENTS } from "@/lib/solutions-segments";

interface CategoryNavItem {
  id: string;
  slug: string;
  name: string;
}

interface FooterProps {
  categories: CategoryNavItem[];
  locale: string;
}

interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

async function getSiteSettings() {
  return prisma.siteSetting.findUnique({ where: { id: "singleton" } });
}

export async function SiteFooter({ categories, locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tSolutions = await getTranslations("solutions");
  const tContact = await getTranslations("contactPage");
  const settings = await getSiteSettings();
  const social = (settings?.socialLinks as SocialLinks | null) ?? null;

  return (
    <footer className="border-t border-paper/10 bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <p className="font-display text-lg">{t("aboutTitle")}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">{t("aboutBody")}</p>
            {social && (social.linkedin || social.instagram || social.twitter) ? (
              <div className="mt-5 flex gap-4 text-sm text-paper/60">
                {social.linkedin ? (
                  <a href={social.linkedin} target="_blank" rel="noreferrer" className="hover:text-paper">
                    LinkedIn
                  </a>
                ) : null}
                {social.instagram ? (
                  <a href={social.instagram} target="_blank" rel="noreferrer" className="hover:text-paper">
                    Instagram
                  </a>
                ) : null}
                {social.twitter ? (
                  <a href={social.twitter} target="_blank" rel="noreferrer" className="hover:text-paper">
                    X
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <p className="manifest-strip mb-4 text-paper/40">{t("navTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              <li><Link href={`/${locale}/about`} className="hover:text-paper">{tNav("about")}</Link></li>
              <li><Link href={`/${locale}/quality-food-safety`} className="hover:text-paper">{tNav("quality")}</Link></li>
              <li><Link href={`/${locale}/distribution-logistics`} className="hover:text-paper">{tNav("distribution")}</Link></li>
              <li><Link href={`/${locale}/brands`} className="hover:text-paper">{tNav("brands")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="manifest-strip mb-4 text-paper/40">{t("productsTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link href={`/${locale}/products?category=${category.slug}`} className="hover:text-paper">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/${locale}/products`} className="text-wheat hover:underline">
                  {tNav("viewAllProducts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="manifest-strip mb-4 text-paper/40">{t("solutionsTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              {SOLUTIONS_SEGMENTS.slice(0, 5).map((segment) => (
                <li key={segment.slug}>
                  <Link href={`/${locale}/solutions/${segment.slug}`} className="hover:text-paper">
                    {tSolutions(`${segment.key}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="manifest-strip mb-4 text-paper/40">{t("contactTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              <li>{tContact("location")}</li>
              {settings?.contactEmail ? (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-paper">
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}
              {settings?.contactPhone ? (
                <li>
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-paper">
                    {settings.contactPhone}
                  </a>
                </li>
              ) : null}
              <li>
                <Link href={`/${locale}/contact`} className="text-wheat hover:underline">
                  {tNav("requestQuote")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-paper/10 pt-8 lg:flex lg:items-end lg:justify-between">
          <div className="max-w-sm">
            <p className="manifest-strip mb-2 text-paper/40">{t("newsletterTitle")}</p>
            <p className="mb-3 text-sm text-paper/60">{t("newsletterBody")}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-paper/10 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Seven Eleven Trading. {t("rights")}
          </p>
          <div className="flex gap-5">
            <Link href={`/${locale}/privacy`} className="hover:text-paper/70">
              {t("privacy")}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-paper/70">
              {t("terms")}
            </Link>
            <Link href={`/${locale}/cookies`} className="hover:text-paper/70">
              {t("cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
