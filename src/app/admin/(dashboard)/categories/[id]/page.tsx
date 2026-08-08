import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { EditCategoryForm } from "./edit-category-form";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "update");

  const [category, categories] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      include: { translations: true, image: { select: { url: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit category</h1>
      <EditCategoryForm category={category} categories={categories} />
    </div>
  );
}
