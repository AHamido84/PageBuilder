import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { EditCategoryForm } from "./edit-category-form";
import { updateCategorySeoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "categories", "update");

  const [category, categories] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      include: { translations: true, image: { select: { url: true } }, seo: true },
    }),
    prisma.category.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit category</h1>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditCategoryForm category={category} categories={categories} /> },
          {
            key: "seo",
            label: "SEO",
            content: (
              <SeoForm
                action={updateCategorySeoAction}
                idFieldName="categoryId"
                entityId={category.id}
                defaultValues={category.seo ?? {}}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
