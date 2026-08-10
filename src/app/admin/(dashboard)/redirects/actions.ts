"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

const pathSchema = z
  .string()
  .min(1)
  .max(500)
  .refine((v) => v.startsWith("/") && !v.startsWith("//"), "Must be a path starting with / (not an external URL).")
  .refine((v) => !v.startsWith("/admin") && !v.startsWith("/api"), "Cannot redirect admin or API paths.");

const targetSchema = z
  .string()
  .min(1)
  .max(500)
  .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Must be a path starting with / or an https:// URL.");

const redirectSchema = z.object({
  fromPath: pathSchema,
  toPath: targetSchema,
  statusCode: z.enum(["MOVED_PERMANENTLY", "FOUND"]),
});

export async function createRedirectAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "redirects", "create");

  const parsed = redirectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.redirect.findUnique({ where: { fromPath: data.fromPath } });
  if (existing) return { error: "A redirect from this path already exists." };

  const redirect = await prisma.redirect.create({ data });
  await logActivity({ userId: currentUser.id, action: "redirect.create", entityType: "Redirect", entityId: redirect.id });
  revalidatePath("/admin/redirects");
  return { success: true };
}

export async function toggleRedirectAction(id: string, isActive: boolean): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "redirects", "update");

  await prisma.redirect.update({ where: { id }, data: { isActive } });
  await logActivity({ userId: currentUser.id, action: "redirect.toggle", entityType: "Redirect", entityId: id, metadata: { isActive } });
  revalidatePath("/admin/redirects");
  return {};
}

export async function deleteRedirectAction(id: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "redirects", "delete");

  await prisma.redirect.delete({ where: { id } });
  await logActivity({ userId: currentUser.id, action: "redirect.delete", entityType: "Redirect", entityId: id });
  revalidatePath("/admin/redirects");
  return {};
}
