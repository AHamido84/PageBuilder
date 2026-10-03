import { getCurrentUser, assertCan, can } from "@/lib/rbac/current-user";
import { MediaBrowser } from "@/components/admin/media/media-browser";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "media", "read");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Media Library</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every image, video and document on the site. Drag files anywhere onto the grid to upload. Files in use can&apos;t be deleted.
        </p>
      </div>
      <MediaBrowser
        mode="manage"
        permissions={{
          create: can(currentUser, "media", "create"),
          update: can(currentUser, "media", "update"),
          delete: can(currentUser, "media", "delete"),
        }}
      />
    </div>
  );
}
