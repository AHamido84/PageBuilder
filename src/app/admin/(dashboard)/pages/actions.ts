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
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9-]+)*$/, "Slug must be lowercase letters, numbers, hyphens, and slashes only.");

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createPageAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "create");

  const parsed = slugSchema.safeParse(formData.get("slug"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid slug." };

  const existing = await prisma.page.findUnique({ where: { slug: parsed.data } });
  if (existing) return { error: "A page with that slug already exists." };

  const page = await prisma.page.create({ data: { slug: parsed.data, status: "DRAFT" } });
  await logActivity({ userId: currentUser.id, action: "page.create", entityType: "Page", entityId: page.id });
  revalidatePath("/admin/pages");
  return { success: true, id: page.id };
}

export async function updatePageSlugAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const id = String(formData.get("id"));
  const parsed = slugSchema.safeParse(formData.get("slug"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid slug." };

  const duplicate = await prisma.page.findFirst({ where: { slug: parsed.data, NOT: { id } } });
  if (duplicate) return { error: "A page with that slug already exists." };

  await prisma.page.update({ where: { id }, data: { slug: parsed.data } });
  await logActivity({ userId: currentUser.id, action: "page.update", entityType: "Page", entityId: id });
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
  return { success: true };
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setPageStatusAction(pageId: string, status: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", status === "PUBLISHED" ? "publish" : "update");

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status." };

  await prisma.page.update({
    where: { id: pageId },
    data: {
      status: parsed.data,
      publishedAt: parsed.data === "PUBLISHED" ? new Date() : undefined,
    },
  });

  await logActivity({
    userId: currentUser.id,
    action: `page.${parsed.data.toLowerCase()}`,
    entityType: "Page",
    entityId: pageId,
  });
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  return {};
}

export async function deletePageAction(pageId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "delete");

  await prisma.page.delete({ where: { id: pageId } });
  await logActivity({ userId: currentUser.id, action: "page.delete", entityType: "Page", entityId: pageId });
  revalidatePath("/admin/pages");
  return {};
}

export async function duplicatePageAction(pageId: string): Promise<{ error?: string; id?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "create");

  const source = await prisma.page.findUnique({ where: { id: pageId }, include: { sections: true } });
  if (!source) return { error: "Page not found." };

  let suffix = 2;
  let newSlug = `${source.slug}-copy`;
  while (await prisma.page.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${source.slug}-copy-${suffix}`;
    suffix += 1;
  }

  const copy = await prisma.page.create({
    data: {
      slug: newSlug,
      status: "DRAFT",
      sections: {
        create: source.sections.map((s) => ({
          type: s.type,
          order: s.order,
          dataEn: s.dataEn as object,
          dataAr: s.dataAr as object,
          isVisible: s.isVisible,
        })),
      },
    },
  });

  await logActivity({ userId: currentUser.id, action: "page.duplicate", entityType: "Page", entityId: copy.id });
  revalidatePath("/admin/pages");
  return { id: copy.id };
}

const seoSchema = z.object({
  pageId: z.string().min(1),
  titleEn: z.string().max(200).optional().or(z.literal("")),
  titleAr: z.string().max(200).optional().or(z.literal("")),
  descriptionEn: z.string().max(400).optional().or(z.literal("")),
  descriptionAr: z.string().max(400).optional().or(z.literal("")),
  canonicalUrl: z.string().max(300).optional().or(z.literal("")),
});

export async function updatePageSeoAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const parsed = seoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const noIndex = formData.has("noIndex");

  await prisma.sEO.upsert({
    where: { pageId: data.pageId },
    create: {
      pageId: data.pageId,
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

  await logActivity({ userId: currentUser.id, action: "page.seo.update", entityType: "Page", entityId: data.pageId });
  revalidatePath(`/admin/pages/${data.pageId}`);
  return { success: true };
}
