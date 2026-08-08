"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/rbac/current-user";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const ip = await clientIp();
  const { allowed } = rateLimit(`login:${ip}`, 10, 60_000);
  if (!allowed) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true, role: { select: { slug: true } } },
  });

  // Always run a hash comparison, even for a missing user, so response timing
  // doesn't reveal whether the email exists.
  const validHash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const passwordValid = await verifyPassword(password, validHash);

  if (!user || !user.isActive || !passwordValid) {
    await logActivity({
      userId: user?.id ?? null,
      action: "auth.login.failed",
      metadata: { email },
      ipAddress: ip,
    });
    return { error: "Invalid email or password." };
  }

  await createSession({ userId: user.id, roleSlug: user.role.slug });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logActivity({ userId: user.id, action: "auth.login.success", ipAddress: ip });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await logActivity({ userId: user.id, action: "auth.logout" });
  }
  redirect("/admin/login");
}
