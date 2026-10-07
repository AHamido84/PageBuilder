import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/components/site/product-card";
import { ProductCarouselTrack } from "@/components/site/product-carousel-track";
import type { Prisma } from "@prisma/client";
import { ProductGridFilterable } from "./product-grid-filterable";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import type { BlockRenderProps } from "../../types";
import type { ProductGridData } from "../commerce-blocks";
import { productCardImageInclude, resolveProductCardImage } from "@/lib/catalog/product-image";
import { areVariantsEnabled, buildVariantsView, cardTextFields, cardVariantFields, variantGraphInclude } from "@/lib/catalog/variants/load";
import { areTextStylesEnabled } from "@/lib/text-style/flag";
import { variantQuery } from "@/lib/catalog/variants/core";

async function loadCards(data: ProductGridData, locale: string): Promise<ProductCardData[]> {
  const limit = Number(data.limit) || 8;
  const mode = data.mode ?? "latest";
  const manualIds = mode === "manual" ? (data.productIds ?? []).slice(0, limit) : [];
  if (mode === "manual" && manualIds.length === 0) return [];
  const where: Prisma.ProductWhereInput = { isPublished: true };
  if (mode === "manual") where.id = { in: manualIds };
  else {
    if (mode === "featured") where.isFeatured = true;
    // "latest" keeps the original behavior: an optional category narrows it.
    if ((mode === "category" || mode === "latest" || mode === "featured") && data.categoryId) where.categoryId = data.categoryId;
  }
  const found = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      translations: true,
      category: { include: { translations: true } },
      ...productCardImageInclude,
      ...variantGraphInclude,
    },
  });

  // Manual mode: the editor's chosen order, not the database's.
  const products = mode === "manual" ? manualIds.map((id) => found.find((p) => p.id === id)).filter((p): p is (typeof found)[number] => Boolean(p)) : found;
  const variantsEnabled = await areVariantsEnabled();
  const textStyles = await areTextStylesEnabled();

  return products.flatMap((product): ProductCardData[] => {
    const card: ProductCardData = {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      temperatureClass: product.temperatureClass,
      name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
      categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
      ...resolveProductCardImage(product),
      shortDescription: product.translations.find((t) => t.locale === locale.toUpperCase())?.shortDescription ?? null,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      weight: product.weight,
      dimensions: product.dimensions,
      ...cardTextFields(product, locale, textStyles),
    };
    if (!variantsEnabled || product.type !== "VARIANT" || product.variants.length === 0) return [card];
    if (data.variantDisplay !== "variants") return [{ ...card, ...cardVariantFields(product, locale, true) }];
    // One card per variant: the variant's own name/image/weight, linking to it preselected.
    const view = buildVariantsView(product, locale, true);
    return view.variants.map((variant) => ({
      ...card,
      ...cardVariantFields(product, locale, true, () => variant, true),
      id: `${product.id}:${variant.id}`,
      name: variant.name,
      // The product name's styling doesn't describe a variant's own name.
      nameRich: undefined,
      variantSummary: null,
      variantQuery: variantQuery(view, variant) || null,
    }));
  }).slice(0, limit);
}

export async function ProductGridRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const cards = await loadCards(data, locale);
  const columns = data.columns ?? 4;

  return (
    <div>
      {data.heading ? <h2 className="mb-3 font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
      {data.description ? <p className="measure-ar mb-8 max-w-2xl text-ink/60"><StyledText text={data.description} rich={richOf(data, "description")} /></p> : null}
      <ProductGridFilterable
        cards={cards}
        locale={locale}
        columns={columns}
        showCategoryFilter={data.showCategoryFilter ?? false}
        filterAllLabel={data.filterAllLabel ?? ""}
        promo={data.promo}
        cardOptions={{
          imageFit: data.imageFit,
          imagePosition: data.imagePosition,
          hoverEffect: data.hoverEffect,
          showSpecs: data.showSpecs,
          showCta: data.showCta,
          ctaLabel: data.ctaLabel,
        }}
      />
    </div>
  );
}

export async function ProductCarouselRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const cards = await loadCards(data, locale);

  return (
    <div>
      {data.heading ? <h2 className="mb-3 font-display text-h2"><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
      {data.description ? <p className="measure-ar mb-8 max-w-2xl text-ink/60"><StyledText text={data.description} rich={richOf(data, "description")} /></p> : null}
      <ProductCarouselTrack
        cards={cards}
        locale={locale}
        imageFit={data.imageFit}
        imagePosition={data.imagePosition}
        hoverEffect={data.hoverEffect}
        showSpecs={data.showSpecs}
        showCta={data.showCta}
        ctaLabel={data.ctaLabel}
      />
    </div>
  );
}
