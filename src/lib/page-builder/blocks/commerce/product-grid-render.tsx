import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { ProductCarouselTrack } from "@/components/site/product-carousel-track";
import type { BlockRenderProps } from "../../types";
import type { ProductGridData } from "../commerce-blocks";

async function loadCards(data: ProductGridData, locale: string): Promise<ProductCardData[]> {
  const limit = Number(data.limit) || 8;
  const products = await prisma.product.findMany({
    where: { isPublished: true, ...(data.categoryId ? { categoryId: data.categoryId } : {}) },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      translations: true,
      category: { include: { translations: true } },
      images: { take: 1, select: { url: true, width: true, height: true } },
    },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    temperatureClass: product.temperatureClass,
    name: product.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.sku,
    categoryName: product.category.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? product.category.slug,
    imageUrl: product.images[0]?.url ?? null,
    imageWidth: product.images[0]?.width ?? null,
    imageHeight: product.images[0]?.height ?? null,
    shortDescription: product.translations.find((t) => t.locale === locale.toUpperCase())?.shortDescription ?? null,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    weight: product.weight,
    dimensions: product.dimensions,
  }));
}

export async function ProductGridRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const cards = await loadCards(data, locale);
  const columns = data.columns ?? 4;

  return (
    <div>
      {data.heading ? <h2 className="mb-3 font-display text-h2">{data.heading}</h2> : null}
      {data.description ? <p className="measure-ar mb-8 max-w-2xl text-ink/60">{data.description}</p> : null}
      <div
        className="grid grid-cols-2 gap-[var(--grid-gap,1.25rem)] sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": columns } as React.CSSProperties}
      >
        {cards.map((card) => (
          <ProductCard
            key={card.id}
            product={card}
            locale={locale}
            imageFit={data.imageFit}
            imagePosition={data.imagePosition}
            hoverEffect={data.hoverEffect}
            showSpecs={data.showSpecs}
            showCta={data.showCta}
            ctaLabel={data.ctaLabel}
          />
        ))}
      </div>
    </div>
  );
}

export async function ProductCarouselRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const cards = await loadCards(data, locale);

  return (
    <div>
      {data.heading ? <h2 className="mb-3 font-display text-h2">{data.heading}</h2> : null}
      {data.description ? <p className="measure-ar mb-8 max-w-2xl text-ink/60">{data.description}</p> : null}
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
