import { prisma } from "@/lib/prisma";
import type { SectionRow } from "@/components/site/section-renderer";
import { isProductsPageBuilderEnabled } from "./products-flag";

/**
 * Sections of a system page (system-pages.ts) for its built-in route, or null -> the route renders
 * its built-in page. Visitors: only while the products-page switch is on AND the page is published
 * (its published snapshot). Editors with ?preview=draft: the saved draft, switch on or off, so the
 * page can be built and checked before it goes live.
 */
export async function loadSystemPageSections(slug: string, draftPreview: boolean): Promise<{ sections: SectionRow[]; draft: boolean } | null> {
  if (!draftPreview && !(await isProductsPageBuilderEnabled())) return null;
  const page = await prisma.page.findUnique({ where: { slug }, select: { id: true, status: true, sections: { orderBy: { order: "asc" } } } });
  if (!page) return null;
  if (draftPreview) return { sections: page.sections as SectionRow[], draft: true };
  if (page.status !== "PUBLISHED") return null;
  const published = await prisma.pageRevision.findFirst({ where: { pageId: page.id, isPublished: true }, select: { snapshot: true } });
  if (!published) return null;
  return { sections: (published.snapshot as unknown as { sections: SectionRow[] }).sections, draft: false };
}

/** Title + SEO of a published system page (for generateMetadata), or null. */
export async function loadSystemPageMeta(slug: string) {
  if (!(await isProductsPageBuilderEnabled())) return null;
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { status: true, titleEn: true, titleAr: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  return page && page.status === "PUBLISHED" ? page : null;
}
