import type { Prisma } from "@prisma/client";

/**
 * Redesign PHASE 7 -- the one place that decides which image represents a product.
 *
 * Main image = `Product.mainImage` when an admin picked one, otherwise the oldest gallery image.
 * The gallery is an implicit many-to-many with no order column, so the fallback is pinned to
 * `Media.createdAt` (upload order) -- before PHASE 7 every call site used `images: { take: 1 }`
 * with no orderBy, which let Postgres return any gallery image.
 */
export const productCardImageInclude = {
  mainImage: { select: { url: true, width: true, height: true } },
  mobileImage: { select: { url: true } },
  images: { take: 1, orderBy: { createdAt: "asc" }, select: { url: true, width: true, height: true } },
} satisfies Prisma.ProductInclude;

type ImageRef = { url: string; width?: number | null; height?: number | null };

export interface ProductImageSource {
  mainImage?: ImageRef | null;
  mobileImage?: { url: string } | null;
  images: ImageRef[];
}

/** Card/listing image fields, shaped for `ProductCardData`. */
export function resolveProductCardImage(product: ProductImageSource) {
  const main = product.mainImage ?? product.images[0] ?? null;
  return {
    imageUrl: main?.url ?? null,
    imageWidth: main?.width ?? null,
    imageHeight: main?.height ?? null,
    mobileImageUrl: product.mobileImage?.url ?? null,
  };
}

/** Full gallery for the product detail page: the main image first, then the rest in upload order, no duplicates. */
export function orderProductGallery<T extends { id: string }>(mainImage: T | null | undefined, gallery: T[]): T[] {
  if (!mainImage) return gallery;
  return [mainImage, ...gallery.filter((img) => img.id !== mainImage.id)];
}
