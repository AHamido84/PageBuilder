"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { designTokensSchema, DESIGN_TOKENS_VERSION, pruneTokens, type DesignTokens } from "@/lib/design-tokens/schema";
import { logActivity } from "@/lib/activity-log";

export async function saveThemeAction(input: unknown): Promise<{ ok: true; tokens: DesignTokens } | { ok: false; error: string }> {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "settings", "update");

  const parsed = designTokensSchema.safeParse(pruneTokens(input));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid theme settings." };
  }
  const tokens: DesignTokens = { ...parsed.data, version: DESIGN_TOKENS_VERSION };

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", siteNameEn: "Seven Eleven Trading", siteNameAr: "سفن إليفن للتجارة", designTokens: tokens },
    update: { designTokens: tokens },
  });
  await logActivity({ userId: currentUser.id, action: "settings.appearance.update", entityType: "SiteSetting", entityId: "singleton" });

  revalidatePath("/admin/appearance");
  revalidatePath("/", "layout");
  return { ok: true, tokens };
}
