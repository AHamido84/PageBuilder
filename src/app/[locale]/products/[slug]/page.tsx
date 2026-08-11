import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { TemperatureBadge } from "@/components/ui/badge";
import { BackArrow } from "@/components/ui/arrow";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { ProductGallery } from "./product-gallery";
import { InquiryForm } from "./inquiry-form";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { translations: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  if (!product || !product.isPublished) return {};

  const upperLocale = locale.toUpperCase();
  const translation = product.translations.find((t) => t.locale === upperLocale) ?? product.translations[0];

  return buildMetadata({
    locale,
    path: `/products/${slug}`,
    seo: product.seo,
    fallbackTitle: translation?.name ?? product.sku,
    fallbackDescription: translation?.shortDescription ?? translation?.description ?? null,
  });
}

const ORIGIN_LABELS: Record<string, { en: string; ar: string }> = {
  "Saudi Arabia": { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  Brazil: { en: "Brazil", ar: "البرازيل" },
  India: { en: "India", ar: "الهند" },
  "United States": { en: "United States", ar: "الولايات المتحدة" },
  France: { en: "France", ar: "فرنسا" },
  Turkey: { en: "Turkey", ar: "تركيا" },
  "United Arab Emirates": { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
};

function localizedOrigin(origin: string, locale: string): string {
  const entry = ORIGIN_LABELS[origin];
  if (!entry) return origin;
  return locale === "ar" ? entry.ar : entry.en;
}

async function getProduct(slug: string, locale: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: true,
      category: { include: { translations: true } },
      brand: { include: { translations: true } },
      images: { select: { id: true, url: true } },
      videos: { select: { id: true, url: true } },
      documents: { select: { id: true, url: true, originalName: true } },
      certifications: { where: { isPublished: true }, include: { image: { select: { url: true } } } },
    },
  });

  if (!product || !product.isPublished) return null;

  const upperLocale = locale.toUpperCase();
  const translation = product.translations.find((t) => t.locale === upperLocale) ?? product.translations[0];

  const related =
    product.relatedProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: product.relatedProductIds }, isPublished: true },
          include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
        })
      : [];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    originCountry: product.originCountry,
    weight: product.weight,
    dimensions: product.dimensions,
    categoryId: product.categoryId,
    categoryName: product.category.translations.find((t) => t.locale === upperLocale)?.name ?? product.category.slug,
    brandName: product.brand?.translations.find((t) => t.locale === upperLocale)?.name ?? product.brand?.slug ?? null,
    images: product.images,
    videos: product.videos,
    documents: product.documents,
    certifications: product.certifications.map((c) => ({
      id: c.id,
      name: locale === "ar" ? c.nameAr : c.nameEn,
      imageUrl: c.image?.url ?? null,
    })),
    curatedRelated: related,
    name: translation?.name ?? product.sku,
    shortDescription: translation?.shortDescription ?? null,
    description: translation?.description ?? null,
    packagingInfo: translation?.packagingInfo ?? null,
    storageInfo: translation?.storageInfo ?? null,
    ingredients: translation?.ingredients ?? null,
    nutritionInfo: translation?.nutritionInfo ?? null,
    allergens: translation?.allergens ?? null,
  };
}

async function getRelated(categoryId: string, excludeId: string, locale: string): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { categoryId, isPublished: true, NOT: { id: excludeId } },
    take: 4,
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
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
  }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("productDetail");
  const tCommon = await getTranslations("common");

  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const curatedRelatedCards: ProductCardData[] = product.curatedRelated.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    temperatureClass: p.temperatureClass,
    name: p.translations.find((t2) => t2.locale === locale.toUpperCase())?.name ?? p.sku,
    categoryName: p.category.translations.find((t2) => t2.locale === locale.toUpperCase())?.name ?? p.category.slug,
    imageUrl: p.images[0]?.url ?? null,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt,
  }));

  const related = curatedRelatedCards.length > 0 ? curatedRelatedCards : await getRelated(product.categoryId, product.id, locale);

  const structuredData = [
    productSchema({
      name: product.name,
      description: product.shortDescription ?? product.description,
      sku: product.sku,
      imageUrls: product.images.map((img) => img.url),
      brandName: product.brandName,
      url: `${SITE_URL}/${locale}/products/${product.slug}`,
      isAvailable: true,
    }),
    breadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/${locale}` },
      { name: tCommon("backToProducts"), url: `${SITE_URL}/${locale}/products` },
      { name: product.name, url: `${SITE_URL}/${locale}/products/${product.slug}` },
    ]),
  ];

  const additionalInfo = [
    { label: t("weight"), value: product.weight },
    { label: t("dimensions"), value: product.dimensions },
    { label: t("ingredients"), value: product.ingredients },
    { label: t("nutritionInfo"), value: product.nutritionInfo },
    { label: t("allergens"), value: product.allergens },
  ].filter((row) => row.value);

  return (
    <div>
      <JsonLd data={structuredData} />
      <Section tone="paper" className="border-t-0 pb-10 pt-10 sm:pb-12 sm:pt-14">
        <Link href={`/${locale}/products`} className="text-sm text-ink/50 hover:text-harbor">
          <BackArrow /> {tCommon("backToProducts")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images} videos={product.videos} productName={product.name} />

            {product.certifications.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">{t("certifications")}</p>
                <div className="flex flex-wrap gap-3">
                  {product.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-ink/10 px-3 py-2">
                      {cert.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cert.imageUrl} alt="" className="h-8 w-8 object-contain" />
                      ) : null}
                      <span className="text-xs font-medium">{cert.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.documents.length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">{t("documents")}</p>
                <ul className="space-y-1.5">
                  {product.documents.map((doc) => (
                    <li key={doc.id}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-harbor underline hover:text-ink">
                        {doc.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div>
            <p className="manifest-strip mb-2 text-harbor">{product.categoryName}</p>
            <h1 className="font-display text-3xl leading-[1.1] sm:text-4xl">{product.name}</h1>
            {product.shortDescription ? <p className="mt-3 text-lg text-ink/60">{product.shortDescription}</p> : null}
            {product.description ? <p className="mt-4 text-base leading-relaxed text-ink/70">{product.description}</p> : null}

            {/* Specifications */}
            <div className="mt-8 rounded-[var(--radius-md)] border border-ink/10">
              <p className="border-b border-ink/10 px-5 py-3 text-sm font-medium">{t("specifications")}</p>
              <dl className="divide-y divide-ink/10">
                <SpecRow label={t("sku")} value={<span className="font-mono-data">{product.sku}</span>} />
                <SpecRow label={t("category")} value={product.categoryName} />
                {product.brandName ? <SpecRow label={t("brand")} value={product.brandName} /> : null}
                <SpecRow label={t("temperatureClass")} value={<TemperatureBadge value={product.temperatureClass} locale={locale} />} />
                {product.originCountry ? <SpecRow label={t("origin")} value={localizedOrigin(product.originCountry, locale)} /> : null}
              </dl>
            </div>

            {product.packagingInfo ? (
              <div className="mt-6">
                <p className="mb-1.5 text-sm font-medium">{t("packaging")}</p>
                <p className="text-sm leading-relaxed text-ink/65">{product.packagingInfo}</p>
              </div>
            ) : null}
            {product.storageInfo ? (
              <div className="mt-6">
                <p className="mb-1.5 text-sm font-medium">{t("storage")}</p>
                <p className="text-sm leading-relaxed text-ink/65">{product.storageInfo}</p>
              </div>
            ) : null}

            {additionalInfo.length > 0 ? (
              <div className="mt-6 rounded-[var(--radius-md)] border border-ink/10">
                <p className="border-b border-ink/10 px-5 py-3 text-sm font-medium">{t("additionalInfo")}</p>
                <dl className="divide-y divide-ink/10">
                  {additionalInfo.map((row) => (
                    <SpecRow key={row.label} label={row.label} value={row.value!} />
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Inquiry */}
      <Section tone="frost" title={t("inquiryTitle")} description={t("inquiryBody")} containerClassName="max-w-3xl">
        <InquiryForm productId={product.id} productName={product.name} />
      </Section>

      {/* Related */}
      {related.length > 0 ? (
        <Section tone="paper" title={t("relatedProducts")}>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
