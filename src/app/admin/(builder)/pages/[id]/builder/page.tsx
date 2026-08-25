import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { getBlock } from "@/lib/page-builder/registry";
import type { BuilderSection } from "@/lib/page-builder/types";
import { normalizeLocaleSettings } from "@/lib/page-builder/types";
import { PageBuilderShell } from "./page-builder-shell";
import type { RevisionListItem } from "./revision-history-panel";

/** Mirrors SectionRenderer's resolution step (see src/components/site/section-renderer.tsx) so a
 * fresh builder load shows real media too, not just data touched during the current edit session. */
async function resolveSectionData(type: string, data: unknown, locale: string): Promise<unknown> {
  const block = getBlock(type);
  if (!block?.resolveData) return data;
  const parsed = block.dataSchema.safeParse(data);
  if (!parsed.success) return data;
  return block.resolveData(parsed.data, locale);
}

export const dynamic = "force-dynamic";

export default async function PageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const [page, categories, brands, blogCategories, products] = await Promise.all([
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
    prisma.product.findMany({ select: { id: true, sku: true, translations: { where: { locale: "EN" }, select: { name: true } } }, orderBy: { sku: "asc" } }),
  ]);

  if (!page) notFound();

  const sections: BuilderSection[] = await Promise.all(
    page.sections.map(async (s) => ({
      id: s.id,
      type: s.type,
      order: s.order,
      dataEn: await resolveSectionData(s.type, s.dataEn, "en"),
      dataAr: await resolveSectionData(s.type, s.dataAr, "ar"),
      settings: normalizeLocaleSettings(s.settings),
      isVisible: s.isVisible,
    }))
  );

  const revisions: RevisionListItem[] = page.revisions.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    note: r.note,
    isPublished: r.isPublished,
    authorName: r.author?.name ?? null,
  }));

  const referenceData = {
    categories: categories.map((c) => ({ id: c.id, label: c.translations.find((t) => t.locale === "EN")?.name ?? c.slug })),
    brands: brands.map((b) => ({
      id: b.id,
      label: b.translations.find((t) => t.locale === "EN")?.name ?? b.slug,
      hasLogo: Boolean(b.logoId),
      isActive: b.isActive,
    })),
    blogCategories: blogCategories.map((c) => ({ id: c.id, label: c.nameEn })),
    products: products.map((p) => ({ id: p.id, label: `${p.translations[0]?.name ?? p.sku} (${p.sku})` })),
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
