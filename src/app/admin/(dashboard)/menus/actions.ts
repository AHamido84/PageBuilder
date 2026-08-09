"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const linkTypeSchema = z.enum(["PAGE", "CATEGORY", "PRODUCT", "URL"]);

const menuItemSchema = z.object({
  menuLocation: z.enum(["HEADER", "FOOTER"]),
  labelEn: z.string().min(1).max(100),
  labelAr: z.string().min(1).max(100),
  linkType: linkTypeSchema,
  targetId: z.string().optional().or(z.literal("")),
  url: z.string().max(300).optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
}

async function ensureMenu(location: "HEADER" | "FOOTER") {
  return prisma.menu.upsert({ where: { location }, create: { location }, update: {} });
}

function targetFields(linkType: z.infer<typeof linkTypeSchema>, targetId: string, url: string) {
  return {
    pageId: linkType === "PAGE" ? targetId || null : null,
    categoryId: linkType === "CATEGORY" ? targetId || null : null,
    productId: linkType === "PRODUCT" ? targetId || null : null,
    url: linkType === "URL" ? url || null : null,
  };
}

export async function createMenuItemAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "menus", "create");

  const parsed = menuItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  if (data.linkType !== "URL" && !data.targetId) {
    return { error: "Select a target for this link type." };
  }
  if (data.linkType === "URL" && !data.url) {
    return { error: "Enter a URL." };
  }

  const menu = await ensureMenu(data.menuLocation);
  const siblingCount = await prisma.menuItem.count({ where: { menuId: menu.id, parentId: data.parentId || null } });

  const item = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      labelEn: data.labelEn,
      labelAr: data.labelAr,
      parentId: data.parentId || null,
      order: siblingCount,
      ...targetFields(data.linkType, data.targetId ?? "", data.url ?? ""),
    },
  });

  await logActivity({ userId: currentUser.id, action: "menuItem.create", entityType: "MenuItem", entityId: item.id });
  revalidatePath("/admin/menus");
  return { success: true };
}

const updateMenuItemSchema = menuItemSchema.extend({ id: z.string().min(1) });

export async function updateMenuItemAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "menus", "update");

  const parsed = updateMenuItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  if (data.parentId === data.id) {
    return { error: "A menu item can't be its own parent." };
  }

  await prisma.menuItem.update({
    where: { id: data.id },
    data: {
      labelEn: data.labelEn,
      labelAr: data.labelAr,
      parentId: data.parentId || null,
      ...targetFields(data.linkType, data.targetId ?? "", data.url ?? ""),
    },
  });

  await logActivity({ userId: currentUser.id, action: "menuItem.update", entityType: "MenuItem", entityId: data.id });
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteMenuItemAction(itemId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "menus", "delete");

  await prisma.menuItem.delete({ where: { id: itemId } });
  await logActivity({ userId: currentUser.id, action: "menuItem.delete", entityType: "MenuItem", entityId: itemId });
  revalidatePath("/admin/menus");
  return {};
}

export async function reorderMenuItemsAction(orderedIds: string[]): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "menus", "update");

  await prisma.$transaction(orderedIds.map((id, index) => prisma.menuItem.update({ where: { id }, data: { order: index } })));
  await logActivity({ userId: currentUser.id, action: "menuItem.reorder", entityType: "MenuItem" });
  revalidatePath("/admin/menus");
  return {};
}
