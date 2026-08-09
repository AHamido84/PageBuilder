import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import type { Prisma } from "@prisma/client";
import { MediaFilterBar } from "./filter-bar";
import { MediaCard } from "./media-card";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "media", "read");
  const params = await searchParams;

  const where: Prisma.MediaWhereInput = {};
  if (params.type === "IMAGE" || params.type === "DOCUMENT" || params.type === "VIDEO") {
    where.type = params.type;
  }
  if (params.q) {
    where.originalName = { contains: params.q, mode: "insensitive" };
  }

  const media = await prisma.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Media Library</h1>
      <MediaFilterBar />
      {media.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={{
                id: item.id,
                url: item.url,
                originalName: item.originalName,
                type: item.type,
                mimeType: item.mimeType,
                sizeBytes: item.sizeBytes,
                altTextEn: item.altTextEn,
                altTextAr: item.altTextAr,
                createdAt: item.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 py-16 text-center text-sm text-neutral-500">
          No files yet. Upload some to get started.
        </div>
      )}
    </div>
  );
}
