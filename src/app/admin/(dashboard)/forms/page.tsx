import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateFormForm } from "./create-form-form";
import { DeleteFormButton } from "./delete-form-button";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "forms", "read");

  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  const canCreate = currentUser.permissions.has("forms:create");
  const canDelete = currentUser.permissions.has("forms:delete");

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold">Forms</h1>
      <p className="mb-6 text-sm text-neutral-500">
        The public quote-request form writes directly to Leads. Custom forms defined here collect submissions
        separately — useful for things like newsletter signups or a dedicated careers form in a later phase.
      </p>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateFormForm />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name (EN)</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Submissions</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/forms/${form.id}`} className="hover:underline">
                    {form.nameEn}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">{form.slug}</td>
                <td className="px-4 py-2">{form._count.submissions}</td>
                <td className="px-4 py-2">{form.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-2 text-right">{canDelete ? <DeleteFormButton formId={form.id} /> : null}</td>
              </tr>
            ))}
            {forms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No custom forms yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
