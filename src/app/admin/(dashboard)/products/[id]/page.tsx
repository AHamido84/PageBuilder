import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { buildCategoryOptions } from "@/lib/category-options";
import { EditProductForm, ProductSpecsForm } from "./edit-product-form";
import { ProductMediaCollection } from "./product-media-collection";
import { ProductRelationsPicker } from "./product-relations-picker";
import {
  updateProductSeoAction,
  addProductImageAction,
  removeProductImageAction,
  addProductVideoAction,
  removeProductVideoAction,
  addProductDocumentAction,
  removeProductDocumentAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const [product, categories, brands, otherProductsRaw, certificationsRaw] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { select: { id: true, url: true, originalName: true } },
        videos: { select: { id: true, url: true, originalName: true } },
        documents: { select: { id: true, url: true, originalName: true } },
        certifications: { select: { id: true } },
        seo: true,
      },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, parentId: true, translations: true }, orderBy: { order: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.product.findMany({ where: { NOT: { id } }, select: { id: true, sku: true, translations: { where: { locale: "EN" }, select: { name: true } } }, orderBy: { sku: "asc" } }),
    prisma.certification.findMany({ where: { isPublished: true }, select: { id: true, nameEn: true }, orderBy: { nameEn: "asc" } }),
  ]);

  if (!product) notFound();

  const categoryOptions = buildCategoryOptions(categories);
  const otherProducts = otherProductsRaw.map((p) => ({ id: p.id, label: `${p.translations[0]?.name ?? p.sku} (${p.sku})` }));
  const certificationOptions = certificationsRaw.map((c) => ({ id: c.id, label: c.nameEn }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit product</h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditProductForm product={product} categories={categoryOptions} brands={brands} /> },
          { key: "specs", label: "Specifications", content: <ProductSpecsForm product={product} /> },
          {
            key: "media",
            label: "Media",
            content: (
              <div className="space-y-6">
                <ProductMediaCollection productId={product.id} label="Gallery (images)" items={product.images} accept="IMAGE" addAction={addProductImageAction} removeAction={removeProductImageAction} />
                <ProductMediaCollection productId={product.id} label="Videos" items={product.videos} accept="VIDEO" addAction={addProductVideoAction} removeAction={removeProductVideoAction} />
                <ProductMediaCollection productId={product.id} label="Documents" items={product.documents} accept="DOCUMENT" addAction={addProductDocumentAction} removeAction={removeProductDocumentAction} />
              </div>
            ),
          },
          {
            key: "related",
            label: "Related & Certifications",
            content: (
              <ProductRelationsPicker
                productId={product.id}
                otherProducts={otherProducts}
                selectedRelatedIds={product.relatedProductIds}
                certifications={certificationOptions}
                selectedCertificationIds={product.certifications.map((c) => c.id)}
              />
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
