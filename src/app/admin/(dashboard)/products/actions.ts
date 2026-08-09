"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.");

const productSchema = z.object({
  sku: z.string().min(1).max(64),
  slug: slugSchema,
  categoryId: z.string().min(1, "Category is required."),
  brandId: z.string().optional().or(z.literal("")),
  temperatureClass: z.enum(["FROZEN", "CHILLED", "AMBIENT"]),
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(4000).optional().or(z.literal("")),
  descriptionAr: z.string().max(4000).optional().or(z.literal("")),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createProductAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "create");

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [skuTaken, slugTaken] = await Promise.all([
    prisma.product.findUnique({ where: { sku: data.sku } }),
    prisma.product.findUnique({ where: { slug: data.slug } }),
  ]);
  if (skuTaken) return { error: "A product with that SKU already exists." };
  if (slugTaken) return { error: "A product with that slug already exists." };

  const product = await prisma.product.create({
    data: {
      sku: data.sku,
      slug: data.slug,
      categoryId: data.categoryId,
      brandId: data.brandId || null,
      temperatureClass: data.temperatureClass,
      translations: {
        create: [
          { locale: "EN", name: data.nameEn, description: data.descriptionEn || null },
          { locale: "AR", name: data.nameAr, description: data.descriptionAr || null },
        ],
      },
    },
  });

  await logActivity({ userId: currentUser.id, action: "product.create", entityType: "Product", entityId: product.id });
  revalidatePath("/admin/products");
  return { success: true, id: product.id };
}

const updateProductSchema = productSchema.extend({
  id: z.string().min(1),
  originCountry: z.string().max(120).optional().or(z.literal("")),
  packagingEn: z.string().max(2000).optional().or(z.literal("")),
  packagingAr: z.string().max(2000).optional().or(z.literal("")),
  storageEn: z.string().max(2000).optional().or(z.literal("")),
  storageAr: z.string().max(2000).optional().or(z.literal("")),
});

export async function updateProductAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const parsed = updateProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [skuTaken, slugTaken] = await Promise.all([
    prisma.product.findFirst({ where: { sku: data.sku, NOT: { id: data.id } } }),
    prisma.product.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } }),
  ]);
  if (skuTaken) return { error: "A product with that SKU already exists." };
  if (slugTaken) return { error: "A product with that slug already exists." };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: data.id },
      data: {
        sku: data.sku,
        slug: data.slug,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        temperatureClass: data.temperatureClass,
        isPublished: formData.has("isPublished"),
        isFeatured: formData.has("isFeatured"),
        originCountry: data.originCountry || null,
      },
    }),
    prisma.productTranslation.upsert({
      where: { productId_locale: { productId: data.id, locale: "EN" } },
      create: {
        productId: data.id,
        locale: "EN",
        name: data.nameEn,
        description: data.descriptionEn || null,
        packagingInfo: data.packagingEn || null,
        storageInfo: data.storageEn || null,
      },
      update: {
        name: data.nameEn,
        description: data.descriptionEn || null,
        packagingInfo: data.packagingEn || null,
        storageInfo: data.storageEn || null,
      },
    }),
    prisma.productTranslation.upsert({
      where: { productId_locale: { productId: data.id, locale: "AR" } },
      create: {
        productId: data.id,
        locale: "AR",
        name: data.nameAr,
        description: data.descriptionAr || null,
        packagingInfo: data.packagingAr || null,
        storageInfo: data.storageAr || null,
      },
      update: {
        name: data.nameAr,
        description: data.descriptionAr || null,
        packagingInfo: data.packagingAr || null,
        storageInfo: data.storageAr || null,
      },
    }),
  ]);

  await logActivity({ userId: currentUser.id, action: "product.update", entityType: "Product", entityId: data.id });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${data.id}`);
  return { success: true, id: data.id };
}

export async function deleteProductAction(productId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "delete");

  await prisma.product.delete({ where: { id: productId } });
  await logActivity({ userId: currentUser.id, action: "product.delete", entityType: "Product", entityId: productId });
  revalidatePath("/admin/products");
  return {};
}

export async function addProductImageAction(productId: string, mediaId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  await prisma.product.update({
    where: { id: productId },
    data: { images: { connect: { id: mediaId } } },
  });

  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function removeProductImageAction(productId: string, mediaId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  await prisma.product.update({
    where: { id: productId },
    data: { images: { disconnect: { id: mediaId } } },
  });

  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function setProductSpecSheetAction(productId: string, mediaId: string | null): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  await prisma.product.update({ where: { id: productId }, data: { specSheetId: mediaId } });
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function togglePublishAction(productId: string, isPublished: boolean): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  await prisma.product.update({ where: { id: productId }, data: { isPublished } });
  await logActivity({
    userId: currentUser.id,
    action: isPublished ? "product.publish" : "product.unpublish",
    entityType: "Product",
    entityId: productId,
  });
  revalidatePath("/admin/products");
  return {};
}

export async function toggleFeatureAction(productId: string, isFeatured: boolean): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  await prisma.product.update({ where: { id: productId }, data: { isFeatured } });
  await logActivity({
    userId: currentUser.id,
    action: isFeatured ? "product.feature" : "product.unfeature",
    entityType: "Product",
    entityId: productId,
  });
  revalidatePath("/admin/products");
  return {};
}

const productSeoSchema = z.object({
  productId: z.string().min(1),
  titleEn: z.string().max(200).optional().or(z.literal("")),
  titleAr: z.string().max(200).optional().or(z.literal("")),
  descriptionEn: z.string().max(400).optional().or(z.literal("")),
  descriptionAr: z.string().max(400).optional().or(z.literal("")),
  canonicalUrl: z.string().max(300).optional().or(z.literal("")),
});

export async function updateProductSeoAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const parsed = productSeoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;
  const noIndex = formData.has("noIndex");

  await prisma.sEO.upsert({
    where: { productId: data.productId },
    create: {
      productId: data.productId,
      titleEn: data.titleEn || null,
      titleAr: data.titleAr || null,
      descriptionEn: data.descriptionEn || null,
      descriptionAr: data.descriptionAr || null,
      canonicalUrl: data.canonicalUrl || null,
      noIndex,
    },
    update: {
      titleEn: data.titleEn || null,
      titleAr: data.titleAr || null,
      descriptionEn: data.descriptionEn || null,
      descriptionAr: data.descriptionAr || null,
      canonicalUrl: data.canonicalUrl || null,
      noIndex,
    },
  });

  await logActivity({ userId: currentUser.id, action: "product.seo.update", entityType: "Product", entityId: data.productId });
  revalidatePath(`/admin/products/${data.productId}`);
  return { success: true };
}

export async function duplicateProductAction(productId: string): Promise<{ error?: string; id?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "create");

  const source = await prisma.product.findUnique({
    where: { id: productId },
    include: { translations: true, images: { select: { id: true } } },
  });
  if (!source) return { error: "Product not found." };

  let suffix = 2;
  let newSku = `${source.sku}-COPY`;
  let newSlug = `${source.slug}-copy`;
  while (await prisma.product.findFirst({ where: { OR: [{ sku: newSku }, { slug: newSlug }] } })) {
    newSku = `${source.sku}-COPY-${suffix}`;
    newSlug = `${source.slug}-copy-${suffix}`;
    suffix += 1;
  }

  const copy = await prisma.product.create({
    data: {
      sku: newSku,
      slug: newSlug,
      categoryId: source.categoryId,
      brandId: source.brandId,
      temperatureClass: source.temperatureClass,
      originCountry: source.originCountry,
      specSheetId: source.specSheetId,
      isPublished: false,
      isFeatured: false,
      images: { connect: source.images.map((image) => ({ id: image.id })) },
      translations: {
        create: source.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
          packagingInfo: t.packagingInfo,
          storageInfo: t.storageInfo,
        })),
      },
    },
  });

  await logActivity({ userId: currentUser.id, action: "product.duplicate", entityType: "Product", entityId: copy.id });
  revalidatePath("/admin/products");
  return { id: copy.id };
}
