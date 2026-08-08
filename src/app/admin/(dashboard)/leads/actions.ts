"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const statusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]);

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
  return {};
}
