import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { PageDetailsForm } from "./page-details-form";
import { SectionList, type SectionItem } from "./section-list";
import { PageRowActions } from "../page-row-actions";
import { updatePageSeoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const [page, categories] = await Promise.all([
    prisma.page.findUnique({ where: { id }, include: { sections: true, seo: true } }),
    prisma.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!page) notFound();

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.translations.find((t) => t.locale === "EN")?.name ?? c.slug }));
  const sections: SectionItem[] = page.sections.map((s) => ({
    id: s.id,
    type: s.type,
    order: s.order,
    isVisible: s.isVisible,
    dataEn: s.dataEn as Record<string, unknown>,
    dataAr: s.dataAr as Record<string, unknown>,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">/{page.slug}</h1>
          <p className="text-sm text-neutral-500">{page.status}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/en/${page.slug}`} target="_blank" className="text-sm text-neutral-400 hover:text-neutral-100">
            Preview →
          </Link>
          <PageRowActions pageId={page.id} status={page.status} canDelete={currentUser.permissions.has("pages:delete")} />
        </div>
      </div>

      <Tabs
        items={[
          { key: "details", label: "Details", content: <PageDetailsForm pageId={page.id} slug={page.slug} /> },
          { key: "sections", label: `Sections (${sections.length})`, content: <SectionList pageId={page.id} sections={sections} categories={categoryOptions} /> },
          {
            key: "seo",
            label: "SEO",
            content: <SeoForm action={updatePageSeoAction} idFieldName="pageId" entityId={page.id} defaultValues={page.seo ?? {}} />,
          },
        ]}
      />
    </div>
  );
}
