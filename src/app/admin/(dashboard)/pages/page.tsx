import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreatePageForm } from "./create-page-form";
import { PageRowActions } from "./page-row-actions";

export const dynamic = "force-dynamic";

export default async function PagesListPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "read");

  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sections: true } } },
  });

  const canCreate = currentUser.permissions.has("pages:create");
  const canDelete = currentUser.permissions.has("pages:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Pages</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreatePageForm />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Sections</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/pages/${page.id}`} className="hover:underline">
                    /{page.slug}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">{page._count.sections}</td>
                <td className="px-4 py-2">{page.status}</td>
                <td className="px-4 py-2 text-neutral-500">{page.updatedAt.toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <PageRowActions pageId={page.id} status={page.status} canDelete={canDelete} />
                </td>
              </tr>
            ))}
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No pages yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
