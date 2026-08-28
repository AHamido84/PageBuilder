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

const certificationSchema = z.object({
  slug: slugSchema,
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  issuer: z.string().max(200).optional().or(z.literal("")),
  validFrom: z.string().max(20).optional().or(z.literal("")),
  validUntil: z.string().max(20).optional().or(z.literal("")),
  imageId: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().default(0),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createCertificationAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "create");

  const parsed = certificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.certification.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: "A certification with that slug already exists." };

  const certification = await prisma.certification.create({
    data: {
      slug: data.slug,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      issuer: data.issuer || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      imageId: data.imageId || null,
      order: data.order,
    },
  });

  await logActivity({ userId: currentUser.id, action: "certification.create", entityType: "Certification", entityId: certification.id });
  revalidatePath("/admin/certifications");
  return { success: true, id: certification.id };
}

const updateCertificationSchema = certificationSchema.extend({ id: z.string().min(1) });

export async function updateCertificationAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "update");

  const parsed = updateCertificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const duplicate = await prisma.certification.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) return { error: "A certification with that slug already exists." };

  await prisma.certification.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      issuer: data.issuer || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      imageId: data.imageId || null,
      order: data.order,
      isPublished: formData.has("isPublished"),
    },
  });

  await logActivity({ userId: currentUser.id, action: "certification.update", entityType: "Certification", entityId: data.id });
  revalidatePath("/admin/certifications");
  revalidatePath(`/admin/certifications/${data.id}`);
  return { success: true, id: data.id };
}

export async function reorderCertificationsAction(orderedIds: string[]): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "update");

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.certification.update({ where: { id }, data: { order: index } }))
  );

  await logActivity({ userId: currentUser.id, action: "certification.reorder", entityType: "Certification" });
  revalidatePath("/admin/certifications");
  return {};
}

export async function deleteCertificationAction(certificationId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "delete");

  await prisma.certification.delete({ where: { id: certificationId } });
  await logActivity({ userId: currentUser.id, action: "certification.delete", entityType: "Certification", entityId: certificationId });
  revalidatePath("/admin/certifications");
  return {};
}
