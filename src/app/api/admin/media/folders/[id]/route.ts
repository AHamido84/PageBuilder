import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { parseFolderName, MEDIA_FOLDER_NAME_MAX } from "@/lib/media-library";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = parseFolderName(body?.name);
  if (!name) {
    return NextResponse.json({ error: `Folder name must be 1-${MEDIA_FOLDER_NAME_MAX} characters.` }, { status: 400 });
  }

  const clash = await prisma.mediaFolder.findFirst({ where: { name: { equals: name, mode: "insensitive" }, NOT: { id } } });
  if (clash) {
    return NextResponse.json({ error: "A folder with that name already exists." }, { status: 409 });
  }

  const folder = await prisma.mediaFolder.update({ where: { id }, data: { name }, select: { id: true, name: true } }).catch(() => null);
  if (!folder) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await logActivity({ userId: user.id, action: "mediaFolder.rename", entityType: "MediaFolder", entityId: id });

  return NextResponse.json({ folder });
}

/** Deleting a folder never deletes files: its media move to "Unfiled" (the relation is onDelete: SetNull). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folder = await prisma.mediaFolder.findUnique({ where: { id }, select: { id: true, _count: { select: { media: true } } } });
  if (!folder) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.mediaFolder.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: "mediaFolder.delete",
    entityType: "MediaFolder",
    entityId: id,
    metadata: { filesMovedToUnfiled: folder._count.media },
  });

  return NextResponse.json({ ok: true, filesMovedToUnfiled: folder._count.media });
}
