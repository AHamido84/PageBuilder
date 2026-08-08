"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().min(1),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  roleId: z.string().min(1),
  password: z.string().min(8).optional().or(z.literal("")),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
}

export async function createUserAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "users", "create");

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      roleId: parsed.data.roleId,
    },
  });

  await logActivity({
    userId: currentUser.id,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "users", "update");

  const raw = Object.fromEntries(formData);
  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    roleId: parsed.data.roleId,
    isActive: formData.has("isActive"),
  };

  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  await prisma.user.update({ where: { id: parsed.data.id }, data });

  await logActivity({
    userId: currentUser.id,
    action: "user.update",
    entityType: "User",
    entityId: parsed.data.id,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<{ error?: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "users", "delete");

  if (currentUser.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  await prisma.user.delete({ where: { id: userId } });

  await logActivity({
    userId: currentUser.id,
    action: "user.delete",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return {};
}
