import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import { prisma } from "@/lib/prisma";
import { getPublicMenu } from "@/lib/menus";
import { organizationSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { AnalyticsScripts } from "@/components/site/analytics-scripts";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import { normalizeHeaderLogoSettings } from "@/lib/site-settings/header-logo";
import { parseDesignTokens } from "@/lib/design-tokens/schema";
import { buildDesignTokensCss, isAnimationEnabled, isPageTransitionEnabled, isScrollRevealEnabled, resolveAnimationSpeed, resolveDefaultAnimation } from "@/lib/design-tokens/resolve-css";
import { DesignAnimationProvider } from "@/components/site/design-animation-context";
import { PageTransition } from "@/components/site/page-transition";
import { fontVariableClassNames } from "@/lib/fonts";
import { ThemePreviewReceiver } from "@/components/site/theme-preview-receiver";
import "../globals.css";
import { productCardImageInclude, resolveProductCardImage } from "@/lib/catalog/product-image";

export async function generateMetadata(): Promise<Metadata> {
  // The favicon lives at public/favicon.ico (a plain static asset), not the App Router's special
  // src/app/favicon.ico convention -- that convention always auto-injects its own <link rel="icon">
  // regardless of what `icons` below declares, which would leave two competing icon tags in <head>
  // once a custom favicon is uploaded (observed directly: browsers don't reliably pick one).
  // Referencing the static file explicitly here instead makes this the single source of truth,
  // falling back to it whenever no SiteSetting.favicon has been uploaded yet.
  const settings = await getSiteSettings();
  return {
    title: { default: "Seven Eleven Trading", template: "%s — Seven Eleven Trading" },
    description: "Wholesale food distribution — Jeddah, Saudi Arabia",
    icons: { icon: settings?.favicon?.url ?? "/favicon.ico" },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function getSiteSettings() {
  return prisma.siteSetting.findUnique({
    where: { id: "singleton" },
    include: { logo: { select: { url: true } }, favicon: { select: { url: true } } },
  });
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
    include: { translations: true, ...productCardImageInclude },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    imageUrl: resolveProductCardImage(product).imageUrl,
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
  const [categories, featuredProducts, settings, tCommon, headerMenu, footerMenu] = await Promise.all([
    getNavData(locale),
    getMegaMenuFeatured(locale),
    getSiteSettings(),
    getTranslations({ locale, namespace: "common" }),
    getPublicMenu("HEADER", locale),
    getPublicMenu("FOOTER", locale),
  ]);

  const orgSchema = organizationSchema({
    siteName: locale === "ar" ? settings?.siteNameAr ?? "" : settings?.siteNameEn ?? "",
    logoUrl: settings?.logo?.url,
    contactEmail: settings?.contactEmail,
    contactPhone: settings?.contactPhone,
    socialLinks: settings?.socialLinks as { facebook?: string; instagram?: string; linkedin?: string; twitter?: string } | null,
    address: settings?.address,
  });

  // Phase 8 "Global Visual Control Center" -- see src/lib/design-tokens/. `designTokens` is empty
  // for every site that hasn't opened the Appearance panel yet, so `overrideCss` is an empty string
  // and every helper below resolves to today's exact existing defaults (animations on, reveal on,
  // 1x speed, no page transition) -- this whole block is a no-op until an admin actually configures
  // something.
  const designTokens = parseDesignTokens(settings?.designTokens);
  const overrideCss = buildDesignTokensCss(designTokens);
  const animationEnabled = isAnimationEnabled(designTokens);
  const hoverAnimationEnabled = animationEnabled && designTokens.animation?.hoverAnimation !== false;

  return (
    <html
      lang={locale}
      dir={dir}
      data-hover-animation={hoverAnimationEnabled ? "on" : "off"}
      className={`${fontVariableClassNames} h-full antialiased`}
    >
      {overrideCss ? <head><style id="theme-overrides" dangerouslySetInnerHTML={{ __html: overrideCss }} /></head> : null}
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <JsonLd data={orgSchema} />
        <AnalyticsScripts gtmId={settings?.gtmId} ga4Id={settings?.analyticsId} metaPixelId={settings?.metaPixelId} />
        {/* reducedMotion="user" (default) makes every framer-motion component in the tree honor
            prefers-reduced-motion automatically -- the CSS media query in globals.css only catches
            CSS transitions/animations, not framer-motion's own JS-driven ones. Animation > Animation
            Enabled=false promotes this to "always" (the master switch), which framer-motion's own
            useReducedMotion() -- already called by every primitive in motion/primitives.tsx --
            immediately respects with zero further code changes needed there. */}
        <MotionConfig reducedMotion={animationEnabled ? "user" : "always"}>
          <DesignAnimationProvider
            value={{
              scrollRevealEnabled: isScrollRevealEnabled(designTokens),
              speed: resolveAnimationSpeed(designTokens),
              pageTransitionEnabled: isPageTransitionEnabled(designTokens),
              defaultAnimation: resolveDefaultAnimation(designTokens) as never,
            }}
          >
            <NextIntlClientProvider>
              <ToastProvider>
                <SiteHeader
                  categories={categories}
                  featuredProducts={featuredProducts}
                  logoUrl={settings?.logo?.url}
                  logoSettings={normalizeHeaderLogoSettings(settings?.headerLogo)[locale === "ar" ? "ar" : "en"]}
                  menuItems={headerMenu}
                  locale={locale}
                />
                <PageTransition>
                  <main className="flex-1">{children}</main>
                </PageTransition>
                <SiteFooter categories={categories} menuItems={footerMenu} locale={locale} />
              </ToastProvider>
            </NextIntlClientProvider>
          </DesignAnimationProvider>
        </MotionConfig>
        <WhatsAppCta whatsapp={settings?.whatsapp} label={tCommon("chatOnWhatsApp")} />
        <ThemePreviewReceiver />
      </body>
    </html>
  );
}
