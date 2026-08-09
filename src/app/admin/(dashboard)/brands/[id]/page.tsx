import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { EditBrandForm } from "./edit-brand-form";
import { updateBrandSeoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "brands", "update");

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      translations: true,
      logo: { select: { url: true } },
      banner: { select: { url: true } },
      seo: true,
      products: { include: { translations: { where: { locale: "EN" } } }, take: 50 },
    },
  });

  if (!brand) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit brand</h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditBrandForm brand={brand} /> },
          {
            key: "seo",
            label: "SEO",
            content: (
              <SeoForm
                action={updateBrandSeoAction}
                idFieldName="brandId"
                entityId={brand.id}
                defaultValues={brand.seo ?? {}}
              />
            ),
          },
          {
            key: "products",
            label: `Products (${brand.products.length})`,
            content: (
              <ul className="space-y-2">
                {brand.products.map((product) => (
                  <li key={product.id}>
                    <Link href={`/admin/products/${product.id}`} className="text-sm text-neutral-300 hover:underline">
                      {product.translations[0]?.name ?? product.sku}
                    </Link>
                  </li>
                ))}
                {brand.products.length === 0 ? <p className="text-sm text-neutral-500">No products assigned to this brand yet.</p> : null}
              </ul>
            ),
          },
        ]}
      />
    </div>
  );
}
