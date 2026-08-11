import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import type { BlockRenderProps } from "../../types";
import type { ProductGridData } from "../commerce-blocks";

export async function ProductGridRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const limit = Number(data.limit) || 8;
  const products = await prisma.product.findMany({
    where: { isPublished: true, ...(data.categoryId ? { categoryId: data.categoryId } : {}) },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  const cards: ProductCardData[] = products.map((product) => ({
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

  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {cards.map((card) => (
          <ProductCard key={card.id} product={card} locale={locale} />
        ))}
      </div>
    </div>
  );
}

export async function ProductCarouselRender({ data, locale }: BlockRenderProps<ProductGridData>) {
  const limit = Number(data.limit) || 8;
  const products = await prisma.product.findMany({
    where: { isPublished: true, ...(data.categoryId ? { categoryId: data.categoryId } : {}) },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { translations: true, category: { include: { translations: true } }, images: { take: 1, select: { url: true } } },
  });

  const cards: ProductCardData[] = products.map((product) => ({
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

  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card) => (
          <div key={card.id} className="w-56 shrink-0 snap-start sm:w-64">
            <ProductCard product={card} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}
