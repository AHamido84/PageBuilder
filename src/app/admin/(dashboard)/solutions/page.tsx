import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateSolutionForm } from "./create-solution-form";
import { SolutionList, type SolutionListItem } from "./solution-list";

export const dynamic = "force-dynamic";

export default async function SolutionsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "read");

  const solutions = await prisma.solution.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  const canCreate = currentUser.permissions.has("solutions:create");
  const canDelete = currentUser.permissions.has("solutions:delete");

  const items: SolutionListItem[] = solutions.map((s) => ({
    id: s.id,
    pageId: s.pageId,
    slug: s.slug,
    icon: s.icon,
    sortOrder: s.sortOrder,
    isPublished: s.isPublished,
    nameEn: s.translations.find((t) => t.locale === "EN")?.name ?? s.slug,
    nameAr: s.translations.find((t) => t.locale === "AR")?.name ?? s.slug,
  }));

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold">Solutions</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Manage the /solutions industry pages. Index-card details (name, icon, order, published) are edited here — open a
        solution in the Page Builder to edit its hero and content sections.
      </p>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateSolutionForm />
        </div>
      ) : null}

      <SolutionList items={items} canDelete={canDelete} />
    </div>
  );
}
