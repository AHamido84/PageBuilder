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

/** Reserved internal slug for the Page linked to a Solution -- never publicly reachable
 * (the [...slug] catch-all is bypassed entirely by the dedicated /solutions/[slug] route),
 * same convention as HOMEPAGE_SLUG in src/lib/page-builder/homepage.ts. */
function solutionPageSlug(slug: string): string {
  return `__solution__${slug}`;
}

const solutionSchema = z.object({
  slug: slugSchema,
  icon: z.string().max(40).optional().or(z.literal("")),
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  shortDescriptionEn: z.string().max(400).optional().or(z.literal("")),
  shortDescriptionAr: z.string().max(400).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createSolutionAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "create");

  const parsed = solutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.solution.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: "A solution with that slug already exists." };

  const pageSlug = solutionPageSlug(data.slug);
  const solution = await prisma.$transaction(async (tx) => {
    const page = await tx.page.create({ data: { slug: pageSlug, status: "DRAFT" } });
    return tx.solution.create({
      data: {
        slug: data.slug,
        icon: data.icon || null,
        sortOrder: data.sortOrder,
        isPublished: false,
        pageId: page.id,
        translations: {
          create: [
            { locale: "EN", name: data.nameEn, shortDescription: data.shortDescriptionEn || null },
            { locale: "AR", name: data.nameAr, shortDescription: data.shortDescriptionAr || null },
          ],
        },
      },
    });
  });

  await logActivity({ userId: currentUser.id, action: "solution.create", entityType: "Solution", entityId: solution.id });
  revalidatePath("/admin/solutions");
  return { success: true, id: solution.id };
}

const updateSolutionSchema = solutionSchema.extend({ id: z.string().min(1), isPublished: z.string().optional() });

export async function updateSolutionAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "update");

  const parsed = updateSolutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const duplicate = await prisma.solution.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) return { error: "A solution with that slug already exists." };

  await prisma.$transaction([
    prisma.solution.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        icon: data.icon || null,
        sortOrder: data.sortOrder,
        isPublished: formData.has("isPublished"),
      },
    }),
    prisma.solutionTranslation.upsert({
      where: { solutionId_locale: { solutionId: data.id, locale: "EN" } },
      create: { solutionId: data.id, locale: "EN", name: data.nameEn, shortDescription: data.shortDescriptionEn || null },
      update: { name: data.nameEn, shortDescription: data.shortDescriptionEn || null },
    }),
    prisma.solutionTranslation.upsert({
      where: { solutionId_locale: { solutionId: data.id, locale: "AR" } },
      create: { solutionId: data.id, locale: "AR", name: data.nameAr, shortDescription: data.shortDescriptionAr || null },
      update: { name: data.nameAr, shortDescription: data.shortDescriptionAr || null },
    }),
  ]);

  await logActivity({ userId: currentUser.id, action: "solution.update", entityType: "Solution", entityId: data.id });
  revalidatePath("/admin/solutions");
  revalidatePath(`/admin/solutions/${data.id}`);
  return { success: true };
}

export async function setSolutionPublishedAction(solutionId: string, isPublished: boolean): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "publish");

  await prisma.solution.update({ where: { id: solutionId }, data: { isPublished } });
  await logActivity({ userId: currentUser.id, action: isPublished ? "solution.publish" : "solution.unpublish", entityType: "Solution", entityId: solutionId });
  revalidatePath("/admin/solutions");
  revalidatePath(`/admin/solutions/${solutionId}`);
  return {};
}

export async function deleteSolutionAction(solutionId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "delete");

  const solution = await prisma.solution.findUnique({ where: { id: solutionId }, select: { pageId: true } });
  if (!solution) return { error: "Solution not found." };

  // Deleting the linked Page cascades to delete the Solution row too (Solution.pageId's FK is
  // ON DELETE CASCADE), plus the Page's own sections/revisions/SEO -- one operation, no orphans.
  await prisma.page.delete({ where: { id: solution.pageId } });
  await logActivity({ userId: currentUser.id, action: "solution.delete", entityType: "Solution", entityId: solutionId });
  revalidatePath("/admin/solutions");
  return {};
}

export async function duplicateSolutionAction(solutionId: string): Promise<{ error?: string; id?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "create");

  const source = await prisma.solution.findUnique({
    where: { id: solutionId },
    include: { translations: true, page: { include: { sections: true } } },
  });
  if (!source) return { error: "Solution not found." };

  let suffix = 2;
  let newSlug = `${source.slug}-copy`;
  while (await prisma.solution.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${source.slug}-copy-${suffix}`;
    suffix += 1;
  }

  const copy = await prisma.$transaction(async (tx) => {
    const page = await tx.page.create({
      data: {
        slug: solutionPageSlug(newSlug),
        status: "DRAFT",
        sections: {
          create: source.page.sections.map((s) => ({
            type: s.type,
            order: s.order,
            dataEn: s.dataEn as object,
            dataAr: s.dataAr as object,
            settings: s.settings as object,
            isVisible: s.isVisible,
          })),
        },
      },
    });
    return tx.solution.create({
      data: {
        slug: newSlug,
        icon: source.icon,
        sortOrder: source.sortOrder,
        isPublished: false,
        pageId: page.id,
        translations: {
          create: source.translations.map((t) => ({ locale: t.locale, name: t.name, shortDescription: t.shortDescription })),
        },
      },
    });
  });

  await logActivity({ userId: currentUser.id, action: "solution.duplicate", entityType: "Solution", entityId: copy.id });
  revalidatePath("/admin/solutions");
  return { id: copy.id };
}

export async function reorderSolutionsAction(orderedIds: string[]): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "update");

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.solution.update({ where: { id }, data: { sortOrder: index } }))
  );

  await logActivity({ userId: currentUser.id, action: "solution.reorder", entityType: "Solution" });
  revalidatePath("/admin/solutions");
  return {};
}
