import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateProductForm } from "./create-product-form";
import { ProductRowActions } from "./product-row-actions";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "read");

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { translations: true, category: { include: { translations: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  const canCreate = currentUser.permissions.has("products:create");
  const canDelete = currentUser.permissions.has("products:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Products</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateProductForm categories={categories} brands={brands} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name (EN)</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Class</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const nameEn = product.translations.find((t) => t.locale === "EN")?.name ?? "—";
              const categoryNameEn = product.category.translations.find((t) => t.locale === "EN")?.name ?? product.category.slug;
              return (
                <tr key={product.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                      {nameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{product.sku}</td>
                  <td className="px-4 py-2">{categoryNameEn}</td>
                  <td className="px-4 py-2">{product.temperatureClass}</td>
                  <td className="px-4 py-2">{product.isPublished ? "Published" : "Draft"}</td>
                  <td className="px-4 py-2 text-right">
                    <ProductRowActions
                      productId={product.id}
                      isPublished={product.isPublished}
                      isFeatured={product.isFeatured}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
