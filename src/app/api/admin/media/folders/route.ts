import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { listFoldersWithCounts, parseFolderName, MEDIA_FOLDER_NAME_MAX } from "@/lib/media-library";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await listFoldersWithCounts());
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "media", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = parseFolderName(body?.name);
  if (!name) {
    return NextResponse.json({ error: `Folder name must be 1-${MEDIA_FOLDER_NAME_MAX} characters.` }, { status: 400 });
  }

  const clash = await prisma.mediaFolder.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (clash) {
    return NextResponse.json({ error: "A folder with that name already exists." }, { status: 409 });
  }

  const last = await prisma.mediaFolder.aggregate({ _max: { sortOrder: true } });
  const folder = await prisma.mediaFolder.create({
    data: { name, sortOrder: (last._max.sortOrder ?? 0) + 10 },
    select: { id: true, name: true },
  });
  await logActivity({ userId: user.id, action: "mediaFolder.create", entityType: "MediaFolder", entityId: folder.id });

  return NextResponse.json({ folder });
}
