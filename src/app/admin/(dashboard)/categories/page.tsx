import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateCategoryForm } from "./create-category-form";
import { DeleteCategoryButton } from "./delete-category-button";

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

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Categories</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateCategoryForm categories={categories.map((c) => ({ id: c.id, slug: c.slug }))} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name (EN)</th>
              <th className="px-4 py-2">الاسم (AR)</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const nameEn = category.translations.find((t) => t.locale === "EN")?.name ?? "—";
              const nameAr = category.translations.find((t) => t.locale === "AR")?.name ?? "—";
              return (
                <tr key={category.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">
                    <Link href={`/admin/categories/${category.id}`} className="hover:underline">
                      {nameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-2" dir="rtl">
                    {nameAr}
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{category.slug}</td>
                  <td className="px-4 py-2">{category._count.products}</td>
                  <td className="px-4 py-2">{category.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-2 text-right">{canDelete ? <DeleteCategoryButton categoryId={category.id} /> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
