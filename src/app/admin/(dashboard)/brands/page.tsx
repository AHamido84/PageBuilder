import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateBrandForm } from "./create-brand-form";
import { DeleteBrandButton } from "./delete-brand-button";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "read");

  const brands = await prisma.brand.findMany({
    orderBy: { slug: "asc" },
    include: { translations: true, _count: { select: { products: true } } },
  });

  const canCreate = currentUser.permissions.has("brands:create");
  const canDelete = currentUser.permissions.has("brands:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Brands</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateBrandForm />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name (EN)</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => {
              const nameEn = brand.translations.find((t) => t.locale === "EN")?.name ?? brand.slug;
              return (
                <tr key={brand.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">
                    <Link href={`/admin/brands/${brand.id}`} className="hover:underline">
                      {nameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{brand.slug}</td>
                  <td className="px-4 py-2">{brand._count.products}</td>
                  <td className="px-4 py-2">{brand.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-2 text-right">{canDelete ? <DeleteBrandButton brandId={brand.id} /> : null}</td>
                </tr>
              );
            })}
            {brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No brands yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
