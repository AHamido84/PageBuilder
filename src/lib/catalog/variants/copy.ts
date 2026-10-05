import type { Prisma } from "@prisma/client";

/**
 * Copies a product's option/variant graph onto another product (Duplicate). Variant SKUs are left
 * empty -- they are unique. Returns nothing; sets the copy's type and default variant.
 */
export async function copyVariantGraph(tx: Prisma.TransactionClient, sourceId: string, targetId: string): Promise<void> {
  const source = await tx.product.findUnique({
    where: { id: sourceId },
    select: {
      type: true,
      defaultVariantId: true,
      options: { include: { values: true } },
      variants: { include: { optionValues: true, images: true, specs: true } },
    },
  });
  if (!source || source.variants.length === 0) return;

  const valueMap = new Map<string, string>();
  for (const option of source.options) {
    const created = await tx.productOption.create({ data: { productId: targetId, optionTypeId: option.optionTypeId, sortOrder: option.sortOrder } });
    for (const v of option.values) {
      const value = await tx.productOptionValue.create({
        data: { productOptionId: created.id, key: v.key, valueAr: v.valueAr, valueEn: v.valueEn, swatchHex: v.swatchHex, imageUrl: v.imageUrl, sortOrder: v.sortOrder },
      });
      valueMap.set(v.id, value.id);
    }
  }

  let defaultVariantId: string | null = null;
  for (const v of source.variants) {
    const created = await tx.productVariant.create({
      data: {
        productId: targetId,
        sku: null,
        nameAr: v.nameAr,
        nameEn: v.nameEn,
        weightAr: v.weightAr,
        weightEn: v.weightEn,
        packagingAr: v.packagingAr,
        packagingEn: v.packagingEn,
        storageAr: v.storageAr,
        storageEn: v.storageEn,
        available: v.available,
        sortOrder: v.sortOrder,
        optionValues: { create: v.optionValues.map((ov) => ({ optionValueId: valueMap.get(ov.optionValueId)! })) },
        images: { create: v.images.map(({ url, mediaId, altAr, altEn, sortOrder }) => ({ url, mediaId, altAr, altEn, sortOrder })) },
        specs: { create: v.specs.map(({ labelAr, labelEn, valueAr, valueEn, sortOrder }) => ({ labelAr, labelEn, valueAr, valueEn, sortOrder })) },
      },
    });
    if (v.id === source.defaultVariantId) defaultVariantId = created.id;
  }
  await tx.product.update({ where: { id: targetId }, data: { type: source.type, defaultVariantId } });
}
