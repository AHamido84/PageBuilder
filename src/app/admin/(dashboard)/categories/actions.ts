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

const categorySchema = z.object({
  slug: slugSchema,
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(2000).optional().or(z.literal("")),
  descriptionAr: z.string().max(2000).optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  imageId: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
}

export async function createCategoryAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "create");

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { error: "A category with that slug already exists." };
  }

  const category = await prisma.category.create({
    data: {
      slug: data.slug,
      order: data.order,
      parentId: data.parentId || null,
      imageId: data.imageId || null,
      translations: {
        create: [
          { locale: "EN", name: data.nameEn, description: data.descriptionEn || null },
          { locale: "AR", name: data.nameAr, description: data.descriptionAr || null },
        ],
      },
    },
  });

  await logActivity({ userId: currentUser.id, action: "category.create", entityType: "Category", entityId: category.id });
  revalidatePath("/admin/categories");
  return { success: true };
}

const updateCategorySchema = categorySchema.extend({ id: z.string().min(1), isActive: z.string().optional() });

export async function updateCategoryAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "update");

  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const duplicate = await prisma.category.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) {
    return { error: "A category with that slug already exists." };
  }

  await prisma.$transaction([
    prisma.category.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        order: data.order,
        parentId: data.parentId || null,
        imageId: data.imageId || null,
        isActive: formData.has("isActive"),
      },
    }),
    prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: data.id, locale: "EN" } },
      create: { categoryId: data.id, locale: "EN", name: data.nameEn, description: data.descriptionEn || null },
      update: { name: data.nameEn, description: data.descriptionEn || null },
    }),
    prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: data.id, locale: "AR" } },
      create: { categoryId: data.id, locale: "AR", name: data.nameAr, description: data.descriptionAr || null },
      update: { name: data.nameAr, description: data.descriptionAr || null },
    }),
  ]);

  await logActivity({ userId: currentUser.id, action: "category.update", entityType: "Category", entityId: data.id });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "delete");

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return { error: `Cannot delete: ${productCount} product(s) still use this category.` };
  }

  await prisma.category.delete({ where: { id: categoryId } });
  await logActivity({ userId: currentUser.id, action: "category.delete", entityType: "Category", entityId: categoryId });
  revalidatePath("/admin/categories");
  return {};
}
