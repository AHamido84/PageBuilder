"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.");

const formSchema = z.object({
  slug: slugSchema,
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  notifyEmail: z.string().email().optional().or(z.literal("")),
});

export async function createFormAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "create");

  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.form.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A form with that slug already exists." };

  const form = await prisma.form.create({
    data: { slug: parsed.data.slug, nameEn: parsed.data.nameEn, nameAr: parsed.data.nameAr, notifyEmail: parsed.data.notifyEmail || null, fields: [] },
  });

  await logActivity({ userId: currentUser.id, action: "form.create", entityType: "Form", entityId: form.id });
  revalidatePath("/admin/forms");
  return { success: true, id: form.id };
}

const updateFormSchema = formSchema.extend({ id: z.string().min(1) });

export async function updateFormAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "update");

  const parsed = updateFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const duplicate = await prisma.form.findFirst({ where: { slug: data.slug, NOT: { id: data.id } } });
  if (duplicate) return { error: "A form with that slug already exists." };

  await prisma.form.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      notifyEmail: data.notifyEmail || null,
      isActive: formData.has("isActive"),
    },
  });

  await logActivity({ userId: currentUser.id, action: "form.update", entityType: "Form", entityId: data.id });
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${data.id}`);
  return { success: true };
}

export async function deleteFormAction(id: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "delete");

  await prisma.form.delete({ where: { id } });
  await logActivity({ userId: currentUser.id, action: "form.delete", entityType: "Form", entityId: id });
  revalidatePath("/admin/forms");
  return {};
}

export async function markSubmissionAction(submissionId: string, status: "NEW" | "REVIEWED" | "SPAM"): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "update");

  await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { status, reviewedById: status === "REVIEWED" ? currentUser.id : undefined },
  });

  await logActivity({ userId: currentUser.id, action: "formSubmission.statusChange", entityType: "FormSubmission", entityId: submissionId, metadata: { status } });
  revalidatePath("/admin/forms");
  return {};
}
