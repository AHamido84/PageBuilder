import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateCategoryForm } from "./create-category-form";
import { CategoryTree, type CategoryTreeNode } from "./category-tree";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "read");

  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { slug: "asc" }],
    include: {
      translations: true,
      _count: { select: { products: true } },
    },
  });

  const canCreate = currentUser.permissions.has("categories:create");
  const canDelete = currentUser.permissions.has("categories:delete");

  const nodes: CategoryTreeNode[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    icon: category.icon,
    isActive: category.isActive,
    isFeatured: category.isFeatured,
    featuredOrder: category.featuredOrder,
    nameEn: category.translations.find((t) => t.locale === "EN")?.name ?? category.slug,
    nameAr: category.translations.find((t) => t.locale === "AR")?.name ?? category.slug,
    productCount: category._count.products,
    parentId: category.parentId,
  }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Categories</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateCategoryForm categories={categories.map((c) => ({ id: c.id, slug: c.slug }))} />
        </div>
      ) : null}

      <CategoryTree items={nodes} canDelete={canDelete} />
    </div>
  );
}
