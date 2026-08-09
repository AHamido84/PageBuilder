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

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

// ---------------------------------------------------------------------------
// Blog categories & tags (lightweight taxonomy management)
// ---------------------------------------------------------------------------

const taxonomySchema = z.object({ slug: slugSchema, nameEn: z.string().min(1).max(120), nameAr: z.string().min(1).max(120) });

export async function createBlogCategoryAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "create");

  const parsed = taxonomySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.blogCategory.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A blog category with that slug already exists." };

  await prisma.blogCategory.create({ data: { slug: parsed.data.slug, nameEn: parsed.data.nameEn, nameAr: parsed.data.nameAr } });
  revalidatePath("/admin/blog");
  return { success: true };
}

export async function deleteBlogCategoryAction(id: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "delete");
  await prisma.blogCategory.delete({ where: { id } });
  revalidatePath("/admin/blog");
  return {};
}

export async function createTagAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "create");

  const parsed = taxonomySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.tag.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A tag with that slug already exists." };

  await prisma.tag.create({ data: { slug: parsed.data.slug, nameEn: parsed.data.nameEn, nameAr: parsed.data.nameAr } });
  revalidatePath("/admin/blog");
  return { success: true };
}

export async function deleteTagAction(id: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "delete");
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/blog");
  return {};
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

const postSchema = z.object({
  slug: slugSchema,
  titleEn: z.string().min(1).max(200),
  titleAr: z.string().min(1).max(200),
  excerptEn: z.string().max(400).optional().or(z.literal("")),
  excerptAr: z.string().max(400).optional().or(z.literal("")),
  contentEn: z.string().min(1),
  contentAr: z.string().min(1),
  categoryId: z.string().optional().or(z.literal("")),
  coverImageId: z.string().optional().or(z.literal("")),
  authorId: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().optional().or(z.literal("")),
});

function parseTagIds(formData: FormData): string[] {
  return formData.getAll("tagIds").map(String).filter(Boolean);
}

export async function createBlogPostAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "create");

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: "A post with that slug already exists." };

  const post = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      excerptEn: data.excerptEn || null,
      excerptAr: data.excerptAr || null,
      contentEn: data.contentEn,
      contentAr: data.contentAr,
      categoryId: data.categoryId || null,
      coverImageId: data.coverImageId || null,
      authorId: data.authorId || currentUser.id,
      status: data.status,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : data.status === "PUBLISHED" ? new Date() : null,
      tags: { connect: parseTagIds(formData).map((id) => ({ id })) },
    },
  });

  await logActivity({ userId: currentUser.id, action: "blogPost.create", entityType: "BlogPost", entityId: post.id });
  revalidatePath("/admin/blog");
  return { success: true, id: post.id };
}

const updatePostSchema = postSchema.extend({ id: z.string().min(1) });

export async function updateBlogPostAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "update");

  const parsed = updatePostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const duplicate = await prisma.blogPost.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) return { error: "A post with that slug already exists." };

  await prisma.blogPost.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      excerptEn: data.excerptEn || null,
      excerptAr: data.excerptAr || null,
      contentEn: data.contentEn,
      contentAr: data.contentAr,
      categoryId: data.categoryId || null,
      coverImageId: data.coverImageId || null,
      authorId: data.authorId || null,
      status: data.status,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : data.status === "PUBLISHED" ? new Date() : null,
      tags: { set: parseTagIds(formData).map((id) => ({ id })) },
    },
  });

  await logActivity({ userId: currentUser.id, action: "blogPost.update", entityType: "BlogPost", entityId: data.id });
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${data.id}`);
  return { success: true, id: data.id };
}

export async function deleteBlogPostAction(id: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "delete");

  await prisma.blogPost.delete({ where: { id } });
  await logActivity({ userId: currentUser.id, action: "blogPost.delete", entityType: "BlogPost", entityId: id });
  revalidatePath("/admin/blog");
  return {};
}

export async function duplicateBlogPostAction(id: string): Promise<{ error?: string; id?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "create");

  const source = await prisma.blogPost.findUnique({ where: { id }, include: { tags: { select: { id: true } } } });
  if (!source) return { error: "Post not found." };

  let suffix = 2;
  let newSlug = `${source.slug}-copy`;
  while (await prisma.blogPost.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${source.slug}-copy-${suffix}`;
    suffix += 1;
  }

  const copy = await prisma.blogPost.create({
    data: {
      slug: newSlug,
      titleEn: `${source.titleEn} (copy)`,
      titleAr: `${source.titleAr} (نسخة)`,
      excerptEn: source.excerptEn,
      excerptAr: source.excerptAr,
      contentEn: source.contentEn,
      contentAr: source.contentAr,
      categoryId: source.categoryId,
      coverImageId: source.coverImageId,
      authorId: source.authorId,
      status: "DRAFT",
      tags: { connect: source.tags.map((t) => ({ id: t.id })) },
    },
  });

  await logActivity({ userId: currentUser.id, action: "blogPost.duplicate", entityType: "BlogPost", entityId: copy.id });
  revalidatePath("/admin/blog");
  return { id: copy.id };
}

const seoSchema = z.object({
  blogPostId: z.string().min(1),
  titleEn: z.string().max(200).optional().or(z.literal("")),
  titleAr: z.string().max(200).optional().or(z.literal("")),
  descriptionEn: z.string().max(400).optional().or(z.literal("")),
  descriptionAr: z.string().max(400).optional().or(z.literal("")),
  canonicalUrl: z.string().max(300).optional().or(z.literal("")),
});

export async function updateBlogPostSeoAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "update");

  const parsed = seoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const noIndex = formData.has("noIndex");

  await prisma.sEO.upsert({
    where: { blogPostId: data.blogPostId },
    create: {
      blogPostId: data.blogPostId,
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

  await logActivity({ userId: currentUser.id, action: "blogPost.seo.update", entityType: "BlogPost", entityId: data.blogPostId });
  revalidatePath(`/admin/blog/${data.blogPostId}`);
  return { success: true };
}
