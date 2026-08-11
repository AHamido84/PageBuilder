import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { ScrollReveal } from "@/lib/motion/primitives";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { translations: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  if (!brand || !brand.isActive) return {};
  const upperLocale = locale.toUpperCase();
  const translation = brand.translations.find((t) => t.locale === upperLocale);
  return buildMetadata({
    locale,
    path: `/brands/${slug}`,
    seo: brand.seo,
    fallbackTitle: translation?.name ?? brand.slug,
    fallbackDescription: translation?.description ?? null,
  });
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("brands");
  const upperLocale = locale.toUpperCase();

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { translations: true, logo: { select: { url: true } }, banner: { select: { url: true } } },
  });

  if (!brand || !brand.isActive) notFound();

  const name = brand.translations.find((tr) => tr.locale === upperLocale)?.name ?? brand.slug;
  const description = brand.translations.find((tr) => tr.locale === upperLocale)?.description ?? null;

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/${locale}` },
    { name: t("title"), url: `${SITE_URL}/${locale}/brands` },
    { name, url: `${SITE_URL}/${locale}/brands/${slug}` },
  ]);

  const products = await prisma.product.findMany({
    where: { brandId: brand.id, isPublished: true },
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  const productCards: ProductCardData[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((tr) => tr.locale === upperLocale)?.name ?? product.sku,
    categoryName: product.category.translations.find((tr) => tr.locale === upperLocale)?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
  }));

  return (
    <div>
      <JsonLd data={breadcrumb} />
      <div className="relative overflow-hidden bg-ink text-paper">
        {brand.banner?.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.banner.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          </>
        ) : null}
        <Container className="relative py-16 sm:py-24">
          <ScrollReveal variant="fade-up">
            <p className="manifest-strip mb-5 opacity-60">{t("title")}</p>
            <div className="flex flex-wrap items-center gap-6">
              {brand.logo?.url ? (
                <span className="flex h-16 items-center rounded-[var(--radius-md)] bg-paper px-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brand.logo.url} alt={name} className="h-9 max-w-[160px] object-contain" />
                </span>
              ) : null}
              <h1 className="font-display text-hero">{name}</h1>
            </div>
            {description ? <p className="measure-ar mt-6 max-w-2xl text-lg leading-relaxed opacity-75">{description}</p> : null}
          </ScrollReveal>
        </Container>
      </div>
      <Section tone="paper" title={t("productsFrom") + " " + name}>
        {productCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("productsFrom") + " " + name} description={t("empty")} />
        )}
      </Section>
    </div>
  );
}
