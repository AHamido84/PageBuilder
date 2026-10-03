import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { logActivity } from "@/lib/activity-log";

const moveSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  /** null moves the files to "Unfiled". */
  folderId: z.string().min(1).nullable(),
});

/** Bulk "Move to folder" for the Media Library's multi-select. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = moveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { ids, folderId } = parsed.data;

  if (folderId && !(await prisma.mediaFolder.findUnique({ where: { id: folderId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Folder not found." }, { status: 400 });
  }

  const { count } = await prisma.media.updateMany({ where: { id: { in: ids } }, data: { folderId } });
  await logActivity({ userId: user.id, action: "media.move", entityType: "Media", metadata: { count, folderId } });

  return NextResponse.json({ moved: count });
}
