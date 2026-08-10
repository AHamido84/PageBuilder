"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const statusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"]);

export async function updateLeadStatusAction(leadId: string, status: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "update");

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  await prisma.lead.update({ where: { id: leadId }, data: { status: parsed.data } });
  await logActivity({
    userId: currentUser.id,
    action: "lead.statusChange",
    entityType: "Lead",
    entityId: leadId,
    metadata: { status: parsed.data },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return {};
}

export interface FormActionState {
  error?: string;
  success?: boolean;
}

const noteSchema = z.object({ leadId: z.string().min(1), body: z.string().min(1).max(2000) });

export async function addLeadNoteAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "update");

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.leadNote.create({
    data: { leadId: parsed.data.leadId, body: parsed.data.body, authorId: currentUser.id },
  });

  await logActivity({ userId: currentUser.id, action: "lead.note.add", entityType: "Lead", entityId: parsed.data.leadId });
  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  return { success: true };
}

export async function deleteLeadNoteAction(noteId: string, leadId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "update");

  await prisma.leadNote.delete({ where: { id: noteId } });
  await logActivity({ userId: currentUser.id, action: "lead.note.delete", entityType: "Lead", entityId: leadId });
  revalidatePath(`/admin/leads/${leadId}`);
  return {};
}

const updateLeadSchema = z.object({
  id: z.string().min(1),
  contactName: z.string().min(1).max(200),
  companyName: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(4000).optional().or(z.literal("")),
  status: statusSchema,
  assigneeId: z.string().optional().or(z.literal("")),
});

export async function updateLeadAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "leads", "update");

  const parsed = updateLeadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await prisma.lead.update({
    where: { id: data.id },
    data: {
      contactName: data.contactName,
      companyName: data.companyName || null,
      email: data.email,
      phone: data.phone || null,
      message: data.message || null,
      status: data.status,
      assigneeId: data.assigneeId || null,
    },
  });

  await logActivity({ userId: currentUser.id, action: "lead.update", entityType: "Lead", entityId: data.id });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${data.id}`);
  return { success: true };
}
