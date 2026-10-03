import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { saveUploadedFile, MediaUploadError } from "@/lib/media-upload";
import { buildMediaWhere, mediaListSelect } from "@/lib/media-library";
import { logActivity } from "@/lib/activity-log";

const PAGE_SIZE = 60;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildMediaWhere({
    q: searchParams.get("q"),
    type: searchParams.get("type"),
    folder: searchParams.get("folder"),
    tag: searchParams.get("tag"),
  });
  const skip = Math.max(0, Number(searchParams.get("skip")) || 0);

  const rows = await prisma.media.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: PAGE_SIZE + 1,
    select: mediaListSelect,
  });

  return NextResponse.json({ media: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // A body cut off by a platform size limit fails to parse -- report that instead of crashing with a 500.
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "The upload was too large or was interrupted. Try a smaller file." }, { status: 413 });
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Optional destination folder; an unknown id is ignored (file lands in Unfiled) rather than failing the upload.
  const folderParam = formData.get("folderId");
  const folderId =
    typeof folderParam === "string" && folderParam
      ? (await prisma.mediaFolder.findUnique({ where: { id: folderParam }, select: { id: true } }))?.id ?? null
      : null;

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
        width: saved.width,
        height: saved.height,
        folderId,
        uploadedById: user.id,
      },
      select: mediaListSelect,
    });

    await logActivity({
      userId: user.id,
      action: "media.upload",
      entityType: "Media",
      entityId: media.id,
    });

    return NextResponse.json({ id: media.id, url: media.url, media });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Media upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
