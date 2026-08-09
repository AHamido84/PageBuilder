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

const brandSchema = z.object({
  slug: slugSchema,
  website: z.string().max(300).optional().or(z.literal("")),
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(2000).optional().or(z.literal("")),
  descriptionAr: z.string().max(2000).optional().or(z.literal("")),
  logoId: z.string().optional().or(z.literal("")),
  bannerId: z.string().optional().or(z.literal("")),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createBrandAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "create");

  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const existing = await prisma.brand.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: "A brand with that slug already exists." };

  const brand = await prisma.brand.create({
    data: {
      slug: data.slug,
      website: data.website || null,
      logoId: data.logoId || null,
      bannerId: data.bannerId || null,
      translations: {
        create: [
          { locale: "EN", name: data.nameEn, description: data.descriptionEn || null },
          { locale: "AR", name: data.nameAr, description: data.descriptionAr || null },
        ],
      },
    },
  });

  await logActivity({ userId: currentUser.id, action: "brand.create", entityType: "Brand", entityId: brand.id });
  revalidatePath("/admin/brands");
  return { success: true, id: brand.id };
}

const updateBrandSchema = brandSchema.extend({ id: z.string().min(1) });

export async function updateBrandAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "update");

  const parsed = updateBrandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const duplicate = await prisma.brand.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) return { error: "A brand with that slug already exists." };

  await prisma.$transaction([
    prisma.brand.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        website: data.website || null,
        logoId: data.logoId || null,
        bannerId: data.bannerId || null,
        isActive: formData.has("isActive"),
      },
    }),
    prisma.brandTranslation.upsert({
      where: { brandId_locale: { brandId: data.id, locale: "EN" } },
      create: { brandId: data.id, locale: "EN", name: data.nameEn, description: data.descriptionEn || null },
      update: { name: data.nameEn, description: data.descriptionEn || null },
    }),
    prisma.brandTranslation.upsert({
      where: { brandId_locale: { brandId: data.id, locale: "AR" } },
      create: { brandId: data.id, locale: "AR", name: data.nameAr, description: data.descriptionAr || null },
      update: { name: data.nameAr, description: data.descriptionAr || null },
    }),
  ]);

  await logActivity({ userId: currentUser.id, action: "brand.update", entityType: "Brand", entityId: data.id });
  revalidatePath("/admin/brands");
  revalidatePath(`/admin/brands/${data.id}`);
  return { success: true, id: data.id };
}

export async function deleteBrandAction(brandId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "delete");

  const productCount = await prisma.product.count({ where: { brandId } });
  if (productCount > 0) {
    return { error: `Cannot delete: ${productCount} product(s) still use this brand.` };
  }

  await prisma.brand.delete({ where: { id: brandId } });
  await logActivity({ userId: currentUser.id, action: "brand.delete", entityType: "Brand", entityId: brandId });
  revalidatePath("/admin/brands");
  return {};
}

const seoSchema = z.object({
  brandId: z.string().min(1),
  titleEn: z.string().max(200).optional().or(z.literal("")),
  titleAr: z.string().max(200).optional().or(z.literal("")),
  descriptionEn: z.string().max(400).optional().or(z.literal("")),
  descriptionAr: z.string().max(400).optional().or(z.literal("")),
  canonicalUrl: z.string().max(300).optional().or(z.literal("")),
});

export async function updateBrandSeoAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "update");

  const parsed = seoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;
  const noIndex = formData.has("noIndex");

  await prisma.sEO.upsert({
    where: { brandId: data.brandId },
    create: {
      brandId: data.brandId,
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

  await logActivity({ userId: currentUser.id, action: "brand.seo.update", entityType: "Brand", entityId: data.brandId });
  revalidatePath(`/admin/brands/${data.brandId}`);
  return { success: true };
}
