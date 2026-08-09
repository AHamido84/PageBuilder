"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";
import { BLOCK_TYPES } from "./block-types";
import { buildSectionData } from "./section-data";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

const blockTypeSchema = z.enum(BLOCK_TYPES.map((b) => b.value) as [string, ...string[]]);

export async function createSectionAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const pageId = String(formData.get("pageId"));
  const typeParsed = blockTypeSchema.safeParse(formData.get("type"));
  if (!typeParsed.success) return { error: "Select a block type." };
  const type = typeParsed.data as Parameters<typeof buildSectionData>[0];

  const { dataEn, dataAr } = buildSectionData(type, formData);
  const count = await prisma.pageSection.count({ where: { pageId } });

  const section = await prisma.pageSection.create({
    data: { pageId, type, order: count, dataEn: dataEn as Prisma.InputJsonValue, dataAr: dataAr as Prisma.InputJsonValue, isVisible: true },
  });

  await logActivity({ userId: currentUser.id, action: "pageSection.create", entityType: "PageSection", entityId: section.id });
  revalidatePath(`/admin/pages/${pageId}`);
  return { success: true };
}

export async function updateSectionAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const sectionId = String(formData.get("sectionId"));
  const pageId = String(formData.get("pageId"));
  const typeParsed = blockTypeSchema.safeParse(formData.get("type"));
  if (!typeParsed.success) return { error: "Invalid block type." };
  const type = typeParsed.data as Parameters<typeof buildSectionData>[0];

  const { dataEn, dataAr } = buildSectionData(type, formData);

  await prisma.pageSection.update({
    where: { id: sectionId },
    data: { dataEn: dataEn as Prisma.InputJsonValue, dataAr: dataAr as Prisma.InputJsonValue, isVisible: formData.has("isVisible") },
  });

  await logActivity({ userId: currentUser.id, action: "pageSection.update", entityType: "PageSection", entityId: sectionId });
  revalidatePath(`/admin/pages/${pageId}`);
  return { success: true };
}

export async function deleteSectionAction(sectionId: string, pageId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  await prisma.pageSection.delete({ where: { id: sectionId } });
  await logActivity({ userId: currentUser.id, action: "pageSection.delete", entityType: "PageSection", entityId: sectionId });
  revalidatePath(`/admin/pages/${pageId}`);
  return {};
}

export async function reorderSectionsAction(pageId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  await prisma.$transaction(orderedIds.map((id, index) => prisma.pageSection.update({ where: { id }, data: { order: index } })));
  await logActivity({ userId: currentUser.id, action: "pageSection.reorder", entityType: "PageSection" });
  revalidatePath(`/admin/pages/${pageId}`);
  return {};
}
