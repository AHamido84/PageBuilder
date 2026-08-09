import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { EditProductForm } from "./edit-product-form";
import { ProductImageGallery } from "./product-image-gallery";
import { SpecSheetField } from "./spec-sheet-field";
import { updateProductSeoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { select: { id: true, url: true, type: true } },
        specSheet: { select: { url: true } },
        seo: true,
      },
    }),
    prisma.category.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit product</h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditProductForm product={product} categories={categories} brands={brands} /> },
          {
            key: "media",
            label: "Media",
            content: (
              <div className="space-y-6">
                <ProductImageGallery productId={product.id} images={product.images} />
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <h2 className="mb-3 text-sm font-medium">Spec sheet</h2>
                  <SpecSheetField productId={product.id} defaultMediaId={product.specSheetId} defaultUrl={product.specSheet?.url ?? null} />
                </div>
              </div>
            ),
          },
          {
            key: "seo",
            label: "SEO",
            content: (
              <SeoForm action={updateProductSeoAction} idFieldName="productId" entityId={product.id} defaultValues={product.seo ?? {}} />
            ),
          },
        ]}
      />
    </div>
  );
}
