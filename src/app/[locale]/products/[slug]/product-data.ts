import { permanentRedirect, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/components/site/product-card";
import { productCardImageInclude, resolveProductCardImage } from "@/lib/catalog/product-image";
import { buildVariantsView, cardTextFields, cardVariantFields, variantGraphInclude } from "@/lib/catalog/variants/load";
import { areTextStylesEnabled } from "@/lib/text-style/flag";
import { richMapOf } from "@/lib/text-style/rich-text";

/** Product page data (moved from page.tsx; shared by the built-in page and the product template). */

const ORIGIN_LABELS: Record<string, { en: string; ar: string }> = {
  "Saudi Arabia": { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  Brazil: { en: "Brazil", ar: "البرازيل" },
  India: { en: "India", ar: "الهند" },
  "United States": { en: "United States", ar: "الولايات المتحدة" },
  France: { en: "France", ar: "فرنسا" },
  Turkey: { en: "Turkey", ar: "تركيا" },
  "United Arab Emirates": { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
};

export function localizedOrigin(origin: string, locale: string): string {
  const entry = ORIGIN_LABELS[origin];
  if (!entry) return origin;
  return locale === "ar" ? entry.ar : entry.en;
}

/**
 * An unknown/unpublished product slug first checks Admin -> Redirects (e.g. the merged Absher
 * product's old URLs -> `/products/absher-french-fries?size=7mm`) before 404ing. Rows are
 * locale-less ("/products/<slug>"), like the catch-all page route's.
 */
export async function redirectIfMoved(slug: string, locale: string) {
  const rule = await prisma.redirect.findUnique({ where: { fromPath: `/products/${slug}` } });
  if (!rule || !rule.isActive) return;
  const to = /^\/(ar|en)(\/|$|\?)/.test(rule.toPath) || /^https?:\/\//.test(rule.toPath) ? rule.toPath : `/${locale}${rule.toPath}`;
  if (rule.statusCode === "MOVED_PERMANENTLY") permanentRedirect(to);
  redirect(to);
}

export async function getProduct(slug: string, locale: string, variantsEnabled: boolean, textStyles: boolean) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: true,
      category: { include: { translations: true } },
      brand: { include: { translations: true } },
      images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true } },
      mainImage: { select: { id: true, url: true } },
      mobileImage: { select: { url: true } },
      videos: { select: { id: true, url: true } },
      documents: { select: { id: true, url: true, originalName: true } },
      certifications: { where: { isPublished: true }, include: { image: { select: { url: true } } } },
      ...variantGraphInclude,
    },
  });

  if (!product || !product.isPublished) return null;

  const upperLocale = locale.toUpperCase();
  const translation = product.translations.find((t) => t.locale === upperLocale) ?? product.translations[0];

  const related =
    product.relatedProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: product.relatedProductIds }, isPublished: true },
          include: { translations: true, category: { include: { translations: true } }, ...productCardImageInclude, ...variantGraphInclude },
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
    categorySlug: product.category.slug,
    categoryName: product.category.translations.find((t) => t.locale === upperLocale)?.name ?? product.category.slug,
    brandName: product.brand?.translations.find((t) => t.locale === upperLocale)?.name ?? product.brand?.slug ?? null,
    // One view for both product types: SIMPLE = the product's own fields (main image first, then
    // the gallery in upload order -- PHASE 7), VARIANT = per-variant data with product fallbacks.
    variants: buildVariantsView(product, locale, variantsEnabled, textStyles),
    // Text styling of the variant-independent "additional info" texts (product translation).
    infoRich: textStyles
      ? { ingredients: richMapOf(translation?.rich, "ingredients"), nutritionInfo: richMapOf(translation?.rich, "nutritionInfo"), allergens: richMapOf(translation?.rich, "allergens") }
      : {},
    mobileImageUrl: product.mobileImage?.url ?? null,
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

export async function getRelated(categoryId: string, excludeId: string, locale: string, variantsEnabled: boolean): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { categoryId, isPublished: true, NOT: { id: excludeId } },
    take: 4,
    include: { translations: true, category: { include: { translations: true } }, ...productCardImageInclude, ...variantGraphInclude },
  });

  const textStyles = await areTextStylesEnabled();
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    ...resolveProductCardImage(product),
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    ...cardTextFields(product, locale, textStyles),
    ...cardVariantFields(product, locale, variantsEnabled),
  }));
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

/** Curated related products (as cards), else up to 4 from the same category. */
export async function getRelatedCards(product: ProductPageData, locale: string, variantsEnabled: boolean, textStyles: boolean): Promise<ProductCardData[]> {
  const curated: ProductCardData[] = product.curatedRelated.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    temperatureClass: p.temperatureClass,
    name: p.translations.find((t2) => t2.locale === locale.toUpperCase())?.name ?? p.sku,
    categoryName: p.category.translations.find((t2) => t2.locale === locale.toUpperCase())?.name ?? p.category.slug,
    ...resolveProductCardImage(p),
    isFeatured: p.isFeatured,
    createdAt: p.createdAt,
    ...cardTextFields(p, locale, textStyles),
    ...cardVariantFields(p, locale, variantsEnabled),
  }));
  return curated.length > 0 ? curated : getRelated(product.categoryId, product.id, locale, variantsEnabled);
}
