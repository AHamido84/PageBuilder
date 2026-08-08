import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { EditProductForm } from "./edit-product-form";
import { ProductImageGallery } from "./product-image-gallery";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "products", "update");

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { translations: true, images: { select: { id: true, url: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.brand.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Edit product</h1>
      <EditProductForm product={product} categories={categories} brands={brands} />
      <ProductImageGallery productId={product.id} images={product.images} />
    </div>
  );
}
