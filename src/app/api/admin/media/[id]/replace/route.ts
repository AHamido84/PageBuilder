import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { saveUploadedFile, deleteUploadedFile, MediaUploadError } from "@/lib/media-upload";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const saved = await saveUploadedFile(file);

    const media = await prisma.media.update({
      where: { id },
      data: {
        fileName: saved.fileName,
        originalName: file.name.slice(0, 255),
        mimeType: saved.mimeType,
        type: saved.type,
        sizeBytes: saved.sizeBytes,
        url: saved.url,
      },
    });

    await deleteUploadedFile(existing.url);
    await logActivity({ userId: user.id, action: "media.replace", entityType: "Media", entityId: id });

    return NextResponse.json({ media });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Media replace failed", error);
    return NextResponse.json({ error: "Replace failed." }, { status: 500 });
  }
}
