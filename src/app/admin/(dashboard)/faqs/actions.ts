"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const faqSchema = z.object({
  questionEn: z.string().min(1).max(300),
  questionAr: z.string().min(1).max(300),
  answerEn: z.string().min(1).max(3000),
  answerAr: z.string().min(1).max(3000),
  category: z.string().max(80).optional().or(z.literal("")),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createFaqAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "faqs", "create");

  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const count = await prisma.faq.count();
  const faq = await prisma.faq.create({
    data: { ...data, category: data.category || null, order: count },
  });

  await logActivity({ userId: currentUser.id, action: "faq.create", entityType: "Faq", entityId: faq.id });
  revalidatePath("/admin/faqs");
  return { success: true, id: faq.id };
}

const updateFaqSchema = faqSchema.extend({ id: z.string().min(1) });

export async function updateFaqAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "faqs", "update");

  const parsed = updateFaqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.faq.update({
    where: { id: data.id },
    data: {
      questionEn: data.questionEn,
      questionAr: data.questionAr,
      answerEn: data.answerEn,
      answerAr: data.answerAr,
      category: data.category || null,
      isPublished: formData.has("isPublished"),
    },
  });

  await logActivity({ userId: currentUser.id, action: "faq.update", entityType: "Faq", entityId: data.id });
  revalidatePath("/admin/faqs");
  revalidatePath(`/admin/faqs/${data.id}`);
  return { success: true, id: data.id };
}

export async function deleteFaqAction(faqId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "faqs", "delete");

  await prisma.faq.delete({ where: { id: faqId } });
  await logActivity({ userId: currentUser.id, action: "faq.delete", entityType: "Faq", entityId: faqId });
  revalidatePath("/admin/faqs");
  return {};
}

export async function reorderFaqsAction(orderedIds: string[]): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "faqs", "update");

  await prisma.$transaction(orderedIds.map((id, index) => prisma.faq.update({ where: { id }, data: { order: index } })));
  revalidatePath("/admin/faqs");
  return {};
}
