import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Archivo, Public_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import { prisma } from "@/lib/prisma";
import { organizationSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { AnalyticsScripts } from "@/components/site/analytics-scripts";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import "../globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Seven Eleven Trading", template: "%s — Seven Eleven Trading" },
  description: "Wholesale food distribution — Jeddah, Saudi Arabia",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function getSiteSettings() {
  return prisma.siteSetting.findUnique({ where: { id: "singleton" }, include: { logo: { select: { url: true } } } });
}

async function getNavData(locale: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { order: "asc" },
    include: {
      translations: true,
      image: { select: { url: true } },
      children: { include: { translations: true }, orderBy: { order: "asc" } },
    },
    take: 8,
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug,
    imageUrl: category.image?.url ?? null,
    children: category.children.map((child) => ({
      id: child.id,
      slug: child.slug,
      name: child.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? child.slug,
    })),
  }));
}

async function getMegaMenuFeatured(locale: string) {
  const products = await prisma.product.findMany({
    where: { isPublished: true, isFeatured: true },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { translations: true, images: { take: 1, select: { url: true } } },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    imageUrl: product.images[0]?.url ?? null,
  }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";
  const [categories, featuredProducts, settings, tCommon] = await Promise.all([
    getNavData(locale),
    getMegaMenuFeatured(locale),
    getSiteSettings(),
    getTranslations({ locale, namespace: "common" }),
  ]);

  const orgSchema = organizationSchema({
    siteName: locale === "ar" ? settings?.siteNameAr ?? "" : settings?.siteNameEn ?? "",
    logoUrl: settings?.logo?.url,
    contactEmail: settings?.contactEmail,
    contactPhone: settings?.contactPhone,
    socialLinks: settings?.socialLinks as { facebook?: string; instagram?: string; linkedin?: string; twitter?: string } | null,
    address: settings?.address,
  });

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${archivo.variable} ${publicSans.variable} ${plexMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <JsonLd data={orgSchema} />
        <AnalyticsScripts gtmId={settings?.gtmId} ga4Id={settings?.analyticsId} metaPixelId={settings?.metaPixelId} />
        {/* reducedMotion="user" makes every framer-motion component in the tree honor
            prefers-reduced-motion automatically — the CSS media query in globals.css only
            catches CSS transitions/animations, not framer-motion's own JS-driven ones. */}
        <MotionConfig reducedMotion="user">
          <NextIntlClientProvider>
            <ToastProvider>
              <SiteHeader categories={categories} featuredProducts={featuredProducts} logoUrl={settings?.logo?.url} locale={locale} />
              <main className="flex-1">{children}</main>
              <SiteFooter categories={categories} locale={locale} />
            </ToastProvider>
          </NextIntlClientProvider>
        </MotionConfig>
        <WhatsAppCta whatsapp={settings?.whatsapp} label={tCommon("chatOnWhatsApp")} />
      </body>
    </html>
  );
}
