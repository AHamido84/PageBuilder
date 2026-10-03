import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { deleteUploadedFile } from "@/lib/media-upload";
import { findMediaUsage, mediaListSelect, normalizeTags } from "@/lib/media-library";
import { logActivity } from "@/lib/activity-log";

const updateSchema = z.object({
  originalName: z.string().trim().min(1).max(255).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  altTextEn: z.string().max(300).optional(),
  altTextAr: z.string().max(300).optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const media = await prisma.media.findUnique({ where: { id }, select: mediaListSelect });
  if (!media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const usage = await findMediaUsage(media);
  return NextResponse.json({ media, usage });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { tags, title, description, folderId, ...rest } = parsed.data;
  if (folderId && !(await prisma.mediaFolder.findUnique({ where: { id: folderId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Folder not found." }, { status: 400 });
  }

  const media = await prisma.media.update({
    where: { id },
    data: {
      ...rest,
      // Empty strings are stored as null so "cleared" and "never set" look the same.
      ...(title !== undefined ? { title: title.trim() || null } : {}),
      ...(description !== undefined ? { description: description.trim() || null } : {}),
      ...(folderId !== undefined ? { folderId: folderId || null } : {}),
      ...(tags !== undefined ? { tags: normalizeTags(tags) } : {}),
    },
    select: mediaListSelect,
  });
  await logActivity({ userId: user.id, action: "media.update", entityType: "Media", entityId: id });

  return NextResponse.json({ media });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Most relations are onDelete: SetNull and Page Builder JSON isn't a relation at all, so the
  // database alone would let an in-use file be deleted and silently break the site. Refuse instead.
  const usage = await findMediaUsage(media);
  if (usage.length > 0) {
    return NextResponse.json(
      { error: `This file is still in use (${usage.length} place${usage.length === 1 ? "" : "s"}). Remove it there first.`, usage },
      { status: 409 }
    );
  }

  try {
    await prisma.media.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "This file is still in use elsewhere and can't be deleted." }, { status: 409 });
  }

  await deleteUploadedFile(media.url);
  await logActivity({ userId: user.id, action: "media.delete", entityType: "Media", entityId: id });

  return NextResponse.json({ ok: true });
}
