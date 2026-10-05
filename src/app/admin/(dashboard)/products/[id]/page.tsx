import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { variantGraphInclude } from "@/lib/catalog/variants/load";
import arMessages from "../../../../../../messages/ar.json";
import { VariantsEditor } from "./variants/variants-editor";
import type { EditorState, LegacyFields } from "./variants/editor-state";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { buildCategoryOptions } from "@/lib/category-options";
import { EditProductForm, ProductSpecsForm } from "./edit-product-form";
import { ProductMediaCollection } from "./product-media-collection";
import { ProductRelationsPicker } from "./product-relations-picker";
import { ProductKeyImages } from "./product-key-images";
import {
  updateProductSeoAction,
  addProductImageAction,
  removeProductImageAction,
  setProductKeyImageAction,
  setProductMainImageAction,
  addProductVideoAction,
  removeProductVideoAction,
  addProductDocumentAction,
  removeProductDocumentAction,
} from "../actions";

export const dynamic = "force-dynamic";

type ProductWithGraph = Prisma.ProductGetPayload<{ include: typeof variantGraphInclude }>;

/** DB variant graph -> editor state (keys, both languages, stable ids). */
function toEditorState(product: ProductWithGraph): EditorState {
  const keyByOptionId = new Map(product.options.map((o) => [o.id, o.optionType.key]));
  const valueById = new Map(product.options.flatMap((o) => o.values.map((v) => [v.id, v] as const)));
  return {
    type: product.type,
    defaultClientId: product.defaultVariantId,
    options: product.options.map((o) => ({
      optionTypeId: o.optionTypeId,
      key: o.optionType.key,
      labelAr: o.optionType.labelAr,
      labelEn: o.optionType.labelEn,
      display: o.optionType.display,
      values: o.values.map((v) => ({ uid: v.id, id: v.id, key: v.key, keyTouched: true, valueAr: v.valueAr, valueEn: v.valueEn, swatchHex: v.swatchHex ?? "", imageUrl: v.imageUrl ?? "" })),
    })),
    variants: product.variants.map((v) => ({
      clientId: v.id,
      id: v.id,
      options: Object.fromEntries(
        v.optionValues
          .map((ov) => valueById.get(ov.optionValueId))
          .filter((val): val is NonNullable<typeof val> => Boolean(val))
          .map((val) => [keyByOptionId.get(val.productOptionId)!, val.key])
      ),
      sku: v.sku ?? "",
      nameAr: v.nameAr ?? "",
      nameEn: v.nameEn ?? "",
      shortDescriptionAr: v.shortDescriptionAr ?? "",
      shortDescriptionEn: v.shortDescriptionEn ?? "",
      descriptionAr: v.descriptionAr ?? "",
      descriptionEn: v.descriptionEn ?? "",
      weightAr: v.weightAr ?? "",
      weightEn: v.weightEn ?? "",
      packagingAr: v.packagingAr ?? "",
      packagingEn: v.packagingEn ?? "",
      storageAr: v.storageAr ?? "",
      storageEn: v.storageEn ?? "",
      available: v.available,
      images: v.images.map((img) => ({ uid: img.id, url: img.url, mediaId: img.mediaId, altAr: img.altAr ?? "", altEn: img.altEn ?? "" })),
      specs: v.specs.map((s) => ({ uid: s.id, labelAr: s.labelAr, labelEn: s.labelEn, valueAr: s.valueAr, valueEn: s.valueEn })),
    })),
  };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const [product, categories, brands, otherProductsRaw, certificationsRaw, optionTypes] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, originalName: true } },
        mainImage: { select: { id: true, url: true } },
        mobileImage: { select: { id: true, url: true } },
        videos: { select: { id: true, url: true, originalName: true } },
        documents: { select: { id: true, url: true, originalName: true } },
        certifications: { select: { id: true } },
        seo: { include: { ogImage: { select: { url: true } } } },
        category: { select: { slug: true, translations: { where: { locale: "AR" }, select: { name: true } } } },
        ...variantGraphInclude,
      },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, parentId: true, translations: true }, orderBy: { order: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.product.findMany({ where: { NOT: { id } }, select: { id: true, sku: true, translations: { where: { locale: "EN" }, select: { name: true } } }, orderBy: { sku: "asc" } }),
    prisma.certification.findMany({ where: { isPublished: true }, select: { id: true, nameEn: true }, orderBy: { nameEn: "asc" } }),
    prisma.optionType.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  if (!product) notFound();

  const ar = product.translations.find((t) => t.locale === "AR");
  const en = product.translations.find((t) => t.locale === "EN");
  const legacyGallery = product.mainImage ? [product.mainImage, ...product.images.filter((i) => i.id !== product.mainImage!.id)] : product.images;
  const legacy: LegacyFields = {
    images: legacyGallery.map((i) => ({ url: i.url, mediaId: i.id })),
    weight: product.weight ?? "",
    packagingAr: ar?.packagingInfo ?? "",
    packagingEn: en?.packagingInfo ?? "",
    storageAr: ar?.storageInfo ?? "",
    storageEn: en?.storageInfo ?? "",
  };
  const variantState = toEditorState(product);
  const canPublish = currentUser.permissions.has("products:publish");

  const categoryOptions = buildCategoryOptions(categories);
  const otherProducts = otherProductsRaw.map((p) => ({ id: p.id, label: `${p.translations[0]?.name ?? p.sku} (${p.sku})` }));
  const certificationOptions = certificationsRaw.map((c) => ({ id: c.id, label: c.nameEn }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">
        Edit product <span className="font-normal text-neutral-500">· {ar?.name ?? product.sku}</span>
      </h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditProductForm product={product} categories={categoryOptions} brands={brands} /> },
          {
            key: "variants",
            label: `الأنواع / Variants${product.type === "VARIANT" ? ` (${product.variants.length})` : ""}`,
            content: (
              <VariantsEditor
                // Remount with fresh DB ids after every save (router.refresh -> new updatedAt).
                key={product.updatedAt.toISOString()}
                product={{
                  id: product.id,
                  slug: product.slug,
                  sku: product.sku,
                  temperatureClass: product.temperatureClass,
                  nameAr: ar?.name ?? product.sku,
                  categoryNameAr: product.category.translations[0]?.name ?? product.category.slug,
                  isPublished: product.isPublished,
                  isFeatured: product.isFeatured,
                }}
                initial={variantState}
                legacy={legacy}
                library={optionTypes.map((t) => ({ id: t.id, key: t.key, labelAr: t.labelAr, labelEn: t.labelEn, display: t.display }))}
                canPublish={canPublish}
                previewMessages={{ productCard: arMessages.productCard }}
              />
            ),
          },
          { key: "specs", label: "Specifications", content: <ProductSpecsForm product={product} /> },
          {
            key: "media",
            label: "Media",
            content: (
              <div className="space-y-6">
                <ProductKeyImages
                  productId={product.id}
                  mainImage={product.mainImage}
                  mobileImage={product.mobileImage}
                  fallbackUrl={product.images[0]?.url ?? null}
                  setAction={setProductKeyImageAction}
                />
                <ProductMediaCollection
                  productId={product.id}
                  label="Gallery (images)"
                  items={product.images}
                  accept="IMAGE"
                  addAction={addProductImageAction}
                  removeAction={removeProductImageAction}
                  mainId={product.mainImageId}
                  setMainAction={setProductMainImageAction}
                />
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
