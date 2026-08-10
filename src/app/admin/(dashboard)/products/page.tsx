import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { buildCategoryOptions } from "@/lib/category-options";
import { Pagination } from "@/components/admin/ui/pagination";
import { CreateProductForm } from "./create-product-form";
import { ProductRowActions } from "./product-row-actions";
import { ProductListFilters } from "./product-list-filters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface ProductsPageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; status?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "read");

  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (params.q) {
    where.OR = [{ sku: { contains: params.q, mode: "insensitive" } }, { translations: { some: { name: { contains: params.q, mode: "insensitive" } } } }];
  }
  if (params.category) where.categoryId = params.category;
  if (params.brand) where.brandId = params.brand;
  if (params.status === "published") where.isPublished = true;
  else if (params.status === "draft") where.isPublished = false;

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { translations: true, category: { include: { translations: true } } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ select: { id: true, slug: true, parentId: true, translations: true }, orderBy: { order: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  const canCreate = currentUser.permissions.has("products:create");
  const canDelete = currentUser.permissions.has("products:delete");
  const categoryOptions = buildCategoryOptions(categories);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.brand) sp.set("brand", params.brand);
    if (params.status) sp.set("status", params.status);
    sp.set("page", String(p));
    return `/admin/products?${sp.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Products</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateProductForm categories={categoryOptions} brands={brands} />
        </div>
      ) : null}

      <ProductListFilters categories={categoryOptions} brands={brands} />
      <p className="mb-2 mt-3 text-xs text-neutral-500">{total} product{total === 1 ? "" : "s"}</p>

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
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No products match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}
