"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";
import { issuesToFieldErrors, saveVariantsInput } from "@/lib/catalog/variants/schema";

export interface VariantSaveResult {
  ok: boolean;
  /** General (non-field) error, Arabic. */
  error?: string;
  /** Field errors keyed by the editor's path, e.g. "variants.2.images". */
  fieldErrors?: Record<string, string>;
}

/** Public pages are rendered per request, but revalidate anyway so a cached render can never lag a save. */
function revalidateCatalog(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/products", "page");
  revalidatePath("/[locale]/products/[slug]", "page");
  revalidatePath("/[locale]/brands/[slug]", "page");
  revalidatePath("/[locale]/[...slug]", "page");
}

/**
 * Saves a product's whole option/variant graph in ONE transaction: the product type and default
 * variant, its options + values (updated in place by id, so variant links survive renames), and its
 * variants (updated in place by id; images/specs/option links replaced). Rows the editor no longer
 * sends are deleted -- the editor only drops a variant after an explicit confirmation.
 */
export async function saveProductVariantsAction(raw: unknown): Promise<VariantSaveResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const parsed = saveVariantsInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "راجع الحقول المظللة", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const data = parsed.data;
  // «نشر» (publish: true) / «حفظ كمسودة» (publish: false) change the status; omitted = keep it.
  if (data.publish !== undefined) assertCan(currentUser, "products", "publish");
  const status = data.publish === undefined ? {} : { isPublished: data.publish };

  const product = await prisma.product.findUnique({ where: { id: data.productId }, select: { id: true, slug: true } });
  if (!product) return { ok: false, error: "المنتج غير موجود" };

  // Option types must exist and match the keys the variants use.
  const types = await prisma.optionType.findMany({ where: { id: { in: data.options.map((o) => o.optionTypeId) } } });
  const fieldErrors: Record<string, string> = {};
  data.options.forEach((o, i) => {
    const type = types.find((t) => t.id === o.optionTypeId);
    if (!type || type.key !== o.key) fieldErrors[`options.${i}`] = "نوع الخيار غير موجود — أعد اختياره من المكتبة";
  });

  // SKUs unique across all OTHER products' variants (the DB unique index is the final guard).
  const skus = data.variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
  if (skus.length) {
    const taken = await prisma.productVariant.findMany({ where: { sku: { in: skus }, NOT: { productId: data.productId } }, select: { sku: true } });
    const takenSet = new Set(taken.map((t) => t.sku));
    data.variants.forEach((v, i) => {
      if (v.sku && takenSet.has(v.sku)) fieldErrors[`variants.${i}.sku`] = "رمز SKU مستخدم في منتج آخر";
    });
  }
  if (Object.keys(fieldErrors).length) return { ok: false, error: "راجع الحقول المظللة", fieldErrors };

  try {
    await prisma.$transaction(
      async (tx) => {
        if (data.type === "SIMPLE") {
          // Back to a simple product: it renders from the product's own fields again. The variant
          // graph is removed (the editor confirmed this before sending).
          await tx.productVariant.deleteMany({ where: { productId: data.productId } });
          await tx.productOption.deleteMany({ where: { productId: data.productId } });
          await tx.product.update({
            where: { id: data.productId },
            data: { type: "SIMPLE", defaultVariantId: null, ...status },
          });
          return;
        }

        // ---- options + values ----
        const existingOptions = await tx.productOption.findMany({ where: { productId: data.productId }, include: { values: true } });
        const keepTypeIds = new Set(data.options.map((o) => o.optionTypeId));
        const removedOptionIds = existingOptions.filter((o) => !keepTypeIds.has(o.optionTypeId)).map((o) => o.id);
        if (removedOptionIds.length) await tx.productOption.deleteMany({ where: { id: { in: removedOptionIds } } });

        /** optionKey -> valueKey -> ProductOptionValue.id */
        const valueIds = new Map<string, Map<string, string>>();
        for (const [i, option] of data.options.entries()) {
          const row = await tx.productOption.upsert({
            where: { productId_optionTypeId: { productId: data.productId, optionTypeId: option.optionTypeId } },
            create: { productId: data.productId, optionTypeId: option.optionTypeId, sortOrder: i },
            update: { sortOrder: i },
          });
          const existingValues = existingOptions.find((o) => o.id === row.id)?.values ?? [];
          const sentIds = new Set(option.values.map((v) => v.id).filter(Boolean));
          const dropped = existingValues.filter((v) => !sentIds.has(v.id)).map((v) => v.id);
          if (dropped.length) await tx.productOptionValue.deleteMany({ where: { id: { in: dropped } } });
          // Two passes so swapping keys between values can't trip the (option, key) unique index.
          for (const v of option.values) {
            if (v.id && existingValues.some((e) => e.id === v.id)) {
              await tx.productOptionValue.update({ where: { id: v.id }, data: { key: `__tmp_${v.id}` } });
            }
          }
          const map = new Map<string, string>();
          for (const [j, v] of option.values.entries()) {
            const fields = { key: v.key, valueAr: v.valueAr, valueEn: v.valueEn, swatchHex: v.swatchHex, imageUrl: v.imageUrl, sortOrder: j };
            const saved =
              v.id && existingValues.some((e) => e.id === v.id)
                ? await tx.productOptionValue.update({ where: { id: v.id }, data: fields })
                : await tx.productOptionValue.create({ data: { ...fields, productOptionId: row.id } });
            map.set(v.key, saved.id);
          }
          valueIds.set(option.key, map);
        }

        // ---- variants ----
        const existingVariantIds = new Set(
          (await tx.productVariant.findMany({ where: { productId: data.productId }, select: { id: true } })).map((v) => v.id)
        );
        const sentVariantIds = new Set(data.variants.map((v) => v.id).filter((id): id is string => Boolean(id && existingVariantIds.has(id))));
        const removedVariants = [...existingVariantIds].filter((id) => !sentVariantIds.has(id));
        if (removedVariants.length) await tx.productVariant.deleteMany({ where: { id: { in: removedVariants } } });
        // Free SKUs first so moving a SKU from one row to another can't hit the unique index.
        if (sentVariantIds.size) await tx.productVariant.updateMany({ where: { id: { in: [...sentVariantIds] } }, data: { sku: null } });

        const realIdByClientId = new Map<string, string>();
        for (const [i, v] of data.variants.entries()) {
          const fields = {
            sku: v.sku,
            nameAr: v.nameAr,
            nameEn: v.nameEn,
            weightAr: v.weightAr,
            weightEn: v.weightEn,
            packagingAr: v.packagingAr,
            packagingEn: v.packagingEn,
            storageAr: v.storageAr,
            storageEn: v.storageEn,
            available: v.available,
            sortOrder: i,
          };
          const row =
            v.id && sentVariantIds.has(v.id)
              ? await tx.productVariant.update({ where: { id: v.id }, data: fields })
              : await tx.productVariant.create({ data: { ...fields, productId: data.productId } });
          realIdByClientId.set(v.clientId, row.id);

          await tx.variantOptionValue.deleteMany({ where: { variantId: row.id } });
          await tx.variantImage.deleteMany({ where: { variantId: row.id } });
          await tx.variantSpec.deleteMany({ where: { variantId: row.id } });
          const links = Object.entries(v.options).map(([optionKey, valueKey]) => valueIds.get(optionKey)?.get(valueKey));
          if (links.some((id) => !id)) throw new Error("variant references an unknown option value");
          await tx.variantOptionValue.createMany({ data: links.map((optionValueId) => ({ variantId: row.id, optionValueId: optionValueId! })) });
          if (v.images.length) {
            await tx.variantImage.createMany({ data: v.images.map((img, k) => ({ variantId: row.id, url: img.url, mediaId: img.mediaId, altAr: img.altAr, altEn: img.altEn, sortOrder: k })) });
          }
          if (v.specs.length) {
            await tx.variantSpec.createMany({ data: v.specs.map((s, k) => ({ variantId: row.id, ...s, sortOrder: k })) });
          }
        }

        await tx.product.update({
          where: { id: data.productId },
          data: {
            type: "VARIANT",
            defaultVariantId: realIdByClientId.get(data.defaultVariantClientId!) ?? null,
            ...status,
          },
        });
      },
      { timeout: 30_000, maxWait: 10_000 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "قيمة مكررة (SKU أو مفتاح قيمة) — راجع البيانات" };
    }
    console.error("saveProductVariantsAction failed", error);
    return { ok: false, error: "تعذر الحفظ — لم يتم تغيير أي شيء" };
  }

  await logActivity({ userId: currentUser.id, action: "product.variants.update", entityType: "Product", entityId: data.productId });
  revalidateCatalog(data.productId);
  return { ok: true };
}

/** «تحويل لمنتج بأنواع»: the product's current image/weight/packaging/storage become its first variant. */
export async function convertToVariantProductAction(productId: string): Promise<VariantSaveResult> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const product = await prisma.product.findUnique({
    where: { id: String(productId) },
    include: {
      translations: true,
      mainImage: { select: { id: true, url: true, altTextAr: true, altTextEn: true } },
      images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, altTextAr: true, altTextEn: true } },
      _count: { select: { variants: true } },
    },
  });
  if (!product) return { ok: false, error: "المنتج غير موجود" };
  if (product.type === "VARIANT") return { ok: true };

  const ar = product.translations.find((t) => t.locale === "AR");
  const en = product.translations.find((t) => t.locale === "EN");
  const gallery = product.mainImage ? [product.mainImage, ...product.images.filter((i) => i.id !== product.mainImage!.id)] : product.images;

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: product.id } });
    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        weightAr: product.weight,
        weightEn: product.weight,
        packagingAr: ar?.packagingInfo ?? null,
        packagingEn: en?.packagingInfo ?? null,
        storageAr: ar?.storageInfo ?? null,
        storageEn: en?.storageInfo ?? null,
        images: { create: gallery.map((img, i) => ({ url: img.url, mediaId: img.id, altAr: img.altTextAr, altEn: img.altTextEn, sortOrder: i })) },
      },
    });
    await tx.product.update({ where: { id: product.id }, data: { type: "VARIANT", defaultVariantId: variant.id } });
  });

  await logActivity({ userId: currentUser.id, action: "product.variants.convert", entityType: "Product", entityId: product.id });
  revalidateCatalog(product.id);
  return { ok: true };
}
