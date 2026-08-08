import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { saveUploadedFile, MediaUploadError } from "@/lib/media-upload";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const saved = await saveUploadedFile(file);

    const media = await prisma.media.create({
      data: {
        fileName: saved.fileName,
        originalName: file.name.slice(0, 255),
        mimeType: saved.mimeType,
        type: saved.type,
        sizeBytes: saved.sizeBytes,
        url: saved.url,
        uploadedById: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      action: "media.upload",
      entityType: "Media",
      entityId: media.id,
    });

    return NextResponse.json({ id: media.id, url: media.url });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Media upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
