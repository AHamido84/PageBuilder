import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import type { BuilderSection } from "@/lib/page-builder/types";
import { PageBuilderShell } from "./page-builder-shell";
import type { RevisionListItem } from "./revision-history-panel";

export const dynamic = "force-dynamic";

export default async function PageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const [page, categories, brands, blogCategories] = await Promise.all([
    prisma.page.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { order: "asc" } },
        revisions: { orderBy: { createdAt: "desc" }, take: 20, include: { author: { select: { name: true } } } },
      },
    }),
    prisma.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
    prisma.brand.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
    prisma.blogCategory.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  if (!page) notFound();

  const sections: BuilderSection[] = page.sections.map((s) => ({
    id: s.id,
    type: s.type,
    order: s.order,
    dataEn: s.dataEn,
    dataAr: s.dataAr,
    settings: s.settings as unknown as BuilderSection["settings"],
    isVisible: s.isVisible,
  }));

  const revisions: RevisionListItem[] = page.revisions.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    note: r.note,
    isPublished: r.isPublished,
    authorName: r.author?.name ?? null,
  }));

  const referenceData = {
    categories: categories.map((c) => ({ id: c.id, label: c.translations.find((t) => t.locale === "EN")?.name ?? c.slug })),
    brands: brands.map((b) => ({ id: b.id, label: b.translations.find((t) => t.locale === "EN")?.name ?? b.slug })),
    blogCategories: blogCategories.map((c) => ({ id: c.id, label: c.nameEn })),
  };

  return (
    <PageBuilderShell
      pageId={page.id}
      slug={page.slug}
      initialStatus={page.status}
      initialSections={sections}
      initialRevisions={revisions}
      referenceData={referenceData}
    />
  );
}
