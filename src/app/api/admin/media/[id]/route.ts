import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { deleteUploadedFile } from "@/lib/media-upload";
import { logActivity } from "@/lib/activity-log";

const updateSchema = z.object({
  originalName: z.string().min(1).max(255).optional(),
  altTextEn: z.string().max(300).optional(),
  altTextAr: z.string().max(300).optional(),
});

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

  const media = await prisma.media.update({ where: { id }, data: parsed.data });
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

  try {
    await prisma.media.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "This file is still in use elsewhere and can't be deleted." }, { status: 409 });
  }

  await deleteUploadedFile(media.url);
  await logActivity({ userId: user.id, action: "media.delete", entityType: "Media", entityId: id });

  return NextResponse.json({ ok: true });
}
