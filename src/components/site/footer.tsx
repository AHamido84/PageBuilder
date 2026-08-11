import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { NewsletterForm } from "./newsletter-form";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { PublicMenuItem } from "@/lib/menus";

interface CategoryNavItem {
  id: string;
  slug: string;
  name: string;
}

interface FooterProps {
  categories: CategoryNavItem[];
  /** Real admin-managed nav items (from /admin/menus, FOOTER location) — each top-level item becomes a column. */
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
  return prisma.siteSetting.findUnique({ where: { id: "singleton" } });
}

export async function SiteFooter({ categories, menuItems = [], locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contactPage");
  const settings = await getSiteSettings();
  const social = (settings?.socialLinks as SocialLinks | null) ?? null;
  const hasSocial = Boolean(social && (social.facebook || social.linkedin || social.instagram || social.twitter));

  return (
    <footer className="border-t border-paper/10 bg-ink text-paper">
      {/* Tier 1 — conversion: newsletter signup, the footer's one job besides navigation. */}
      <div className="border-b border-paper/10 bg-ink-soft">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
          <ScrollReveal variant="fade-up" className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <p className="font-display text-h3">{t("newsletterTitle")}</p>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{t("newsletterBody")}</p>
            </div>
            <div className="lg:w-auto lg:shrink-0">
              <NewsletterForm />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Tier 2 — navigation. */}
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <p className="font-display text-lg">{t("aboutTitle")}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">{t("aboutBody")}</p>
          </div>

          {menuItems.map((item) => (
            <div key={item.id}>
              <p className="manifest-strip mb-4 text-paper/40">{item.label}</p>
              <ul className="space-y-2.5 text-sm text-paper/70">
                {item.children.length > 0
                  ? item.children.map((child) => (
                      <li key={child.id}>
                        <Link href={child.href ?? `/${locale}`} className="transition-colors hover:text-paper">
                          {child.label}
                        </Link>
                      </li>
                    ))
                  : (
                      <li>
                        <Link href={item.href ?? `/${locale}`} className="transition-colors hover:text-paper">
                          {item.label}
                        </Link>
                      </li>
                    )}
              </ul>
            </div>
          ))}

          <div>
            <p className="manifest-strip mb-4 text-paper/40">{t("productsTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link href={`/${locale}/products?category=${category.slug}`} className="transition-colors hover:text-paper">
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
            <p className="manifest-strip mb-4 text-paper/40">{t("contactTitle")}</p>
            <ul className="space-y-2.5 text-sm text-paper/70">
              <li>{tContact("location")}</li>
              {settings?.contactEmail ? (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} dir="ltr" className="inline-block transition-colors hover:text-paper">
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}
              {settings?.contactPhone ? (
                <li>
                  <a href={`tel:${settings.contactPhone}`} dir="ltr" className="inline-block transition-colors hover:text-paper">
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
      </div>

      {/* Tier 3 — legal, social, copyright. */}
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-6 text-xs text-paper/40 sm:px-8 sm:flex-row sm:items-center sm:justify-between lg:px-12">
          <p>
            © {new Date().getFullYear()} Seven Eleven Trading. {t("rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={`/${locale}/privacy`} className="transition-colors hover:text-paper/70">
              {t("privacy")}
            </Link>
            <Link href={`/${locale}/terms`} className="transition-colors hover:text-paper/70">
              {t("terms")}
            </Link>
            <Link href={`/${locale}/cookies`} className="transition-colors hover:text-paper/70">
              {t("cookies")}
            </Link>
            {hasSocial ? (
              <span className="flex items-center gap-4 border-s border-paper/15 ps-5">
                {social?.facebook ? (
                  <a href={social.facebook} target="_blank" rel="noreferrer" className="transition-colors hover:text-paper/70">
                    Facebook
                  </a>
                ) : null}
                {social?.linkedin ? (
                  <a href={social.linkedin} target="_blank" rel="noreferrer" className="transition-colors hover:text-paper/70">
                    LinkedIn
                  </a>
                ) : null}
                {social?.instagram ? (
                  <a href={social.instagram} target="_blank" rel="noreferrer" className="transition-colors hover:text-paper/70">
                    Instagram
                  </a>
                ) : null}
                {social?.twitter ? (
                  <a href={social.twitter} target="_blank" rel="noreferrer" className="transition-colors hover:text-paper/70">
                    X
                  </a>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
