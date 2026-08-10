import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ContactForm } from "./contact-form";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Arrow } from "@/components/ui/arrow";
import { ManifestStrip } from "@/components/site/manifest-strip";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return buildMetadata({
    locale,
    path: "/",
    fallbackTitle: t("heroTitle"),
    fallbackDescription: t("heroSubtitle"),
  });
}

async function getCategories(locale: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { order: "asc" },
    include: { translations: true, image: { select: { url: true } }, _count: { select: { products: true } } },
    take: 8,
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? category.slug,
    imageUrl: category.image?.url ?? null,
    productCount: category._count.products,
  }));
}

async function getFeaturedProducts(locale: string): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
  }));
}

async function getBrands(locale: string) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { slug: "asc" },
    take: 6,
    include: { translations: true, logo: { select: { url: true } } },
  });

  return brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? brand.slug,
    logoUrl: brand.logo?.url ?? null,
  }));
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const [categories, featuredProducts, brands] = await Promise.all([
    getCategories(locale),
    getFeaturedProducts(locale),
    getBrands(locale),
  ]);

  return (
    <div>
      {/* Hero */}
      <Section tone="paper" className="border-t-0 pb-0 pt-14 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="manifest-strip mb-5 text-harbor">{t("heroEyebrow")}</p>
          <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">{t("heroSubtitle")}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/${locale}/contact`} className={buttonClasses("primary", "lg")}>
              {t("heroCtaPrimary")}
            </Link>
            <Link href={`/${locale}/products`} className={buttonClasses("secondary", "lg")}>
              {t("heroCtaSecondary")}
            </Link>
          </div>
        </div>
        <div className="mt-14 sm:mt-16">
          <ManifestStrip text={t("manifestStrip")} />
        </div>
      </Section>

      {/* Intro */}
      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="manifest-strip mb-3 text-harbor">{t("introEyebrow")}</p>
            <h2 className="font-display text-3xl leading-[1.1] sm:text-4xl">{t("introTitle")}</h2>
          </div>
          <p className="text-base leading-relaxed text-ink/70 sm:text-lg">{t("introBody")}</p>
        </div>
      </Section>

      {/* Categories */}
      <Section tone="frost" eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")}>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/products?category=${category.slug}`}
                className="group block rounded-[var(--radius-md)] border border-ink/10 bg-paper p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <p className="font-medium">{category.name}</p>
                <p className="font-mono-data mt-2 text-xs text-ink/40">{tCommon("skuCount", { count: category.productCount })}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t("categoriesTitle")} description={t("categoriesEmpty")} />
        )}
      </Section>

      {/* Featured products */}
      <Section tone="paper" eyebrow={t("featuredEyebrow")} title={t("featuredTitle")}>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("featuredTitle")} description={t("featuredEmpty")} />
        )}
      </Section>

      {/* Brands */}
      <Section tone="frost" eyebrow={t("brandsEyebrow")} title={t("brandsTitle")}>
        {brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/${locale}/brands/${brand.slug}`}
                className="flex h-20 items-center justify-center rounded-[var(--radius-md)] border border-ink/10 bg-paper px-4 text-center text-sm font-medium hover:shadow-[var(--shadow-card)]"
              >
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt={brand.name} className="max-h-10 max-w-full object-contain" />
                ) : (
                  brand.name
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t("brandsTitle")} description={t("brandsEmpty")} />
        )}
      </Section>

      {/* Why Seven Eleven */}
      <Section tone="ink" eyebrow={t("whyEyebrow")} title={t("whyTitle")}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <p className="font-display text-xl">{t(`why${n}Title`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-paper/65">{t(`why${n}Body`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Solutions teaser */}
      <Section
        tone="paper"
        eyebrow={t("solutionsEyebrow")}
        title={t("solutionsTitle")}
        description={t("solutionsBody")}
      >
        <Link href={`/${locale}/solutions`} className={buttonClasses("secondary", "md")}>
          {t("solutionsCta")} <Arrow />
        </Link>
      </Section>

      {/* Distribution teaser */}
      <Section tone="harbor" eyebrow={t("distributionEyebrow")} title={t("distributionTitle")} description={t("distributionBody")}>
        <Link href={`/${locale}/distribution-logistics`} className={buttonClasses("secondary", "md")}>
          {t("distributionCta")} <Arrow />
        </Link>
      </Section>

      {/* Quality teaser */}
      <Section tone="paper" eyebrow={t("qualityEyebrow")} title={t("qualityTitle")} description={t("qualityBody")}>
        <Link href={`/${locale}/quality-food-safety`} className={buttonClasses("secondary", "md")}>
          {t("qualityCta")} <Arrow />
        </Link>
      </Section>

      {/* CTA */}
      <Section tone="ink" className="text-center">
        <Container className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-paper/65">{t("ctaBody")}</p>
          <Link href={`/${locale}/contact`} className={`${buttonClasses("primary", "lg")} mt-8 inline-flex`}>
            {t("ctaButton")}
          </Link>
        </Container>
      </Section>

      {/* Contact */}
      <Section tone="frost" eyebrow={undefined} title={t("contactHeading")} description={t("contactSubheading")} containerClassName="max-w-3xl">
        <ContactForm />
      </Section>
    </div>
  );
}
