import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/components/site/product-card";
import { productCardImageInclude, resolveProductCardImage } from "@/lib/catalog/product-image";
import { areTextStylesEnabled } from "@/lib/text-style/flag";
import { buildVariantsView, cardTextFields, cardVariantFields, optionFilterWhere, variantGraphInclude } from "@/lib/catalog/variants/load";
import { variantQuery, type ProductVariantsView } from "@/lib/catalog/variants/core";
import type { ListingParams } from "./products-listing-params";

/**
 * Server data for the products listing (/products and the Page Builder «Products Catalog» block).
 * Moved verbatim from app/[locale]/products/page.tsx so both render the same products, in the same
 * order, from the same query.
 */

const upper = (locale: string) => locale.toUpperCase();

export async function getListingCategories(locale: string) {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, include: { translations: true } });
  return categories.map((c) => ({ slug: c.slug, name: c.translations.find((t) => t.locale === upper(locale))?.name ?? c.slug }));
}

export async function getCategoryIntro(slug: string, locale: string) {
  const category = await prisma.category.findUnique({ where: { slug, isActive: true }, include: { translations: true, banner: { select: { url: true } } } });
  if (!category) return null;
  const translation = category.translations.find((t) => t.locale === upper(locale));
  return { name: translation?.name ?? category.slug, description: translation?.description ?? null, bannerUrl: category.banner?.url ?? null };
}

export async function getListingBrands(locale: string) {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { slug: "asc" }], include: { translations: true } });
  return brands.map((b) => ({ slug: b.slug, name: b.translations.find((t) => t.locale === upper(locale))?.name ?? b.slug }));
}

export interface ListingOptions {
  /** Cards per page (pagination) -- or the step of «load more». */
  pageSize: number;
  /** "pages": skip/take by page; "loadMore": the first `show` cards. */
  paging?: "pages" | "loadMore";
  /** "product": one card per product (default, as today); "variant": one card per variant. */
  variantCards?: "product" | "variant";
}

export async function getListingProducts(
  locale: string,
  params: ListingParams,
  variantsEnabled: boolean,
  optionSelection: Record<string, string>,
  opts: ListingOptions
): Promise<{ items: ProductCardData[]; total: number }> {
  const where: Prisma.ProductWhereInput = { isPublished: true, ...optionFilterWhere(optionSelection) };
  if (params.category) where.category = { slug: params.category };
  if (params.brand) where.brand = { slug: params.brand };
  if (params.temp) where.temperatureClass = params.temp;
  if (params.q) where.translations = { some: { name: { contains: params.q, mode: "insensitive" } } };

  const orderBy: Prisma.ProductOrderByWithRelationInput = params.sort === "name-asc" || params.sort === "name-desc" ? { sku: params.sort === "name-asc" ? "asc" : "desc" } : { createdAt: "desc" };
  const loadMore = opts.paging === "loadMore";
  const skip = loadMore ? 0 : (params.page - 1) * opts.pageSize;
  const take = loadMore ? params.show : opts.pageSize;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { translations: true, category: { include: { translations: true } }, ...productCardImageInclude, ...variantGraphInclude },
    }),
    prisma.product.count({ where }),
  ]);

  const textStyles = await areTextStylesEnabled();
  // With option filters active, each card shows the variant that matched them.
  const matching = (view: ProductVariantsView) =>
    Object.keys(optionSelection).length ? view.variants.find((v) => Object.entries(optionSelection).every(([k, val]) => v.options[k] === val)) : undefined;

  let mapped: ProductCardData[] = products.flatMap((product): ProductCardData[] => {
    const card: ProductCardData = {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      temperatureClass: product.temperatureClass,
      name: product.translations.find((t) => t.locale === upper(locale))?.name ?? product.sku,
      shortDescription: product.translations.find((t) => t.locale === upper(locale))?.shortDescription ?? null,
      categoryName: product.category.translations.find((t) => t.locale === upper(locale))?.name ?? product.category.slug,
      ...resolveProductCardImage(product),
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      ...cardTextFields(product, locale, textStyles),
      ...cardVariantFields(product, locale, variantsEnabled, matching),
    };
    if (opts.variantCards !== "variant" || !variantsEnabled || product.type !== "VARIANT") return [card];
    // One card per variant (the ones matching the option filters, when any): its own name/image,
    // linking to it preselected -- same expansion as the Product Grid block.
    const view = buildVariantsView(product, locale, true);
    const variants = view.variants.filter((v) => Object.entries(optionSelection).every(([k, val]) => v.options[k] === val));
    if (variants.length <= 1) return [card];
    return variants.map((variant) => ({
      ...card,
      ...cardVariantFields(product, locale, true, () => variant, true),
      id: `${product.id}:${variant.id}`,
      name: variant.name,
      nameRich: undefined,
      variantSummary: null,
      variantQuery: variantQuery(view, variant) || null,
    }));
  });

  if (params.sort === "name-asc" || params.sort === "name-desc") {
    mapped = mapped.sort((a, b) => (params.sort === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }
  return { items: mapped, total };
}
