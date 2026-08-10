import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { CreateRedirectForm } from "./create-redirect-form";
import { RedirectToggle } from "./redirect-toggle";
import { deleteRedirectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "redirects", "read");

  const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  const canCreate = currentUser.permissions.has("redirects:create");
  const canDelete = currentUser.permissions.has("redirects:delete");

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold">Redirects</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Applies to CMS page URLs (the catch-all route). Doesn&apos;t cover built-in routes like /products or /blog.
      </p>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateRedirectForm />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">To</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 font-mono text-xs">{r.fromPath}</td>
                <td className="px-4 py-2 font-mono text-xs text-neutral-400">{r.toPath}</td>
                <td className="px-4 py-2 text-neutral-400">{r.statusCode === "MOVED_PERMANENTLY" ? "301" : "302"}</td>
                <td className="px-4 py-2">
                  <RedirectToggle id={r.id} isActive={r.isActive} />
                </td>
                <td className="px-4 py-2 text-right">{canDelete ? <DeleteButton onDelete={deleteRedirectAction.bind(null, r.id)} itemLabel="this redirect" /> : null}</td>
              </tr>
            ))}
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No redirects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
