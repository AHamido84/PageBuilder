import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { saveUploadedFile, deleteUploadedFile, MediaUploadError } from "@/lib/media-upload";
import { mediaListSelect, rewriteMediaUrlStatements } from "@/lib/media-library";
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

  // A body cut off by a platform size limit fails to parse -- report that instead of crashing with a 500.
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "The upload was too large or was interrupted. Try a smaller file." }, { status: 413 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  let saved: Awaited<ReturnType<typeof saveUploadedFile>>;
  try {
    saved = await saveUploadedFile(file);
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Media replace failed", error);
    return NextResponse.json({ error: "Replace failed." }, { status: 500 });
  }

  // A different kind of file would leave e.g. a video URL inside an image field.
  if (saved.type !== existing.type) {
    await deleteUploadedFile(saved.url);
    return NextResponse.json({ error: `Replace with the same kind of file (${existing.type.toLowerCase()}).` }, { status: 400 });
  }

  // The Media row keeps its id, display name, alt text, title, tags and folder -- only the file changes.
  // Page Builder JSON holds URL copies, so they're rewritten in the same transaction; the old blob is
  // deleted only after that commits, so a failure can never leave a page pointing at a missing file.
  let media;
  try {
    [media] = await prisma.$transaction([
      prisma.media.update({
        where: { id },
        data: {
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          url: saved.url,
          width: saved.width,
          height: saved.height,
        },
        select: mediaListSelect,
      }),
      ...rewriteMediaUrlStatements(existing.url, saved.url),
    ]);
  } catch (error) {
    await deleteUploadedFile(saved.url);
    console.error("Media replace failed", error);
    return NextResponse.json({ error: "Replace failed." }, { status: 500 });
  }

  await deleteUploadedFile(existing.url);
  await logActivity({
    userId: user.id,
    action: "media.replace",
    entityType: "Media",
    entityId: id,
    metadata: { previousFile: existing.originalName, newFile: file.name.slice(0, 255) },
  });

  return NextResponse.json({ media });
}
