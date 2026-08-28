import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateBrandForm } from "./create-brand-form";
import { BrandList, type BrandListItem } from "./brand-list";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "read");

  const brands = await prisma.brand.findMany({
    orderBy: [{ order: "asc" }, { slug: "asc" }],
    include: { translations: true, _count: { select: { products: true } } },
  });

  const canCreate = currentUser.permissions.has("brands:create");
  const canDelete = currentUser.permissions.has("brands:delete");

  const items: BrandListItem[] = brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    nameEn: brand.translations.find((t) => t.locale === "EN")?.name ?? brand.slug,
    productCount: brand._count.products,
    isActive: brand.isActive,
    isFeatured: brand.isFeatured,
  }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Brands</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateBrandForm />
        </div>
      ) : null}

      <BrandList items={items} canDelete={canDelete} />
    </div>
  );
}
