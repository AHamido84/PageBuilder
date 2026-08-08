import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/ui/section";
import { TemperatureBadge } from "@/components/ui/badge";
import { BackArrow } from "@/components/ui/arrow";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { InquiryForm } from "./inquiry-form";

export const dynamic = "force-dynamic";

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
    },
  });

  if (!product || !product.isPublished) return null;

  const upperLocale = locale.toUpperCase();
  const translation = product.translations.find((t) => t.locale === upperLocale) ?? product.translations[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    originCountry: product.originCountry,
    categoryId: product.categoryId,
    categoryName: product.category.translations.find((t) => t.locale === upperLocale)?.name ?? product.category.slug,
    brandName: product.brand?.translations.find((t) => t.locale === upperLocale)?.name ?? product.brand?.slug ?? null,
    images: product.images,
    name: translation?.name ?? product.sku,
    description: translation?.description ?? null,
    packagingInfo: translation?.packagingInfo ?? null,
    storageInfo: translation?.storageInfo ?? null,
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
  }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("productDetail");
  const tCommon = await getTranslations("common");

  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const related = await getRelated(product.categoryId, product.id, locale);

  return (
    <div>
      <Section tone="paper" className="border-t-0 pb-10 pt-10 sm:pb-12 sm:pt-14">
        <Link href={`/${locale}/products`} className="text-sm text-ink/50 hover:text-harbor">
          <BackArrow /> {tCommon("backToProducts")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            {product.images.length > 0 ? (
              <div className="grid gap-3">
                <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-frost">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                </div>
                {product.images.length > 1 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.slice(1, 5).map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={image.id} src={image.url} alt="" className="aspect-square rounded-[var(--radius-sm)] object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-md)] bg-frost">
                <span className="font-mono-data text-sm text-ink/30">{product.sku}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="manifest-strip mb-2 text-harbor">{product.categoryName}</p>
            <h1 className="font-display text-3xl leading-[1.1] sm:text-4xl">{product.name}</h1>
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
          </div>
        </div>
      </Section>

      {/* Inquiry */}
      <Section tone="frost" title={t("inquiryTitle")} description={t("inquiryBody")} containerClassName="max-w-3xl">
        <InquiryForm productName={product.name} />
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
