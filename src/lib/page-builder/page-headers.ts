import { prisma } from "@/lib/prisma";
import type { SectionRow } from "@/components/site/section-renderer";

/**
 * Phase 7: reserved `Page.slug`s for the editable header/intro zone atop otherwise-hardcoded
 * catalog listing pages (Products/Brands/Blog/Solutions index) -- same `__reserved__`-style
 * convention as `HOMEPAGE_SLUG` (`page-builder/homepage.ts`) and Solution's own `__solution__<slug>`
 * pages, so these never collide with a real content slug reachable through the `[...slug]`
 * catch-all. Seeded by `scripts/seed-page-headers.ts`.
 */
export const PAGE_HEADER_SLUGS = {
  products: "__header__products",
  brands: "__header__brands",
  blog: "__header__blog",
  solutionsIndex: "__header__solutions-index",
  // PHASE 8: the FAQ page's editable header (title/intro) -- same convention as the four above.
  faq: "__header__faq",
} as const;

export type PageHeaderKey = keyof typeof PAGE_HEADER_SLUGS;

/** PHASE 8: title + SEO record of a published header page, for the owning route's generateMetadata (null when unpublished/missing). */
export async function loadPageHeaderMeta(key: PageHeaderKey) {
  const page = await prisma.page.findUnique({
    where: { slug: PAGE_HEADER_SLUGS[key] },
    select: { status: true, titleEn: true, titleAr: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  return page && page.status === "PUBLISHED" ? page : null;
}

/**
 * Loads a header page's published sections, or `null` if the reserved page doesn't exist yet /
 * has never been published -- callers fall back to their original hardcoded header in that case
 * (see e.g. `products/page.tsx`), so a page never renders blank just because the one-time seed
 * script hasn't run yet in a given environment.
 */
export async function loadPageHeaderSections(key: PageHeaderKey, draftPreview = false): Promise<SectionRow[] | null> {
  const slug = PAGE_HEADER_SLUGS[key];
  const page = await prisma.page.findUnique({ where: { slug }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) return null;
  // An editor's ?preview=draft (see render-page.ts) shows the saved draft, published or not.
  if (draftPreview) return page.sections as SectionRow[];
  if (page.status !== "PUBLISHED") return null;

  const publishedRevision = await prisma.pageRevision.findFirst({ where: { pageId: page.id, isPublished: true } });
  if (!publishedRevision) return null;

  const snapshot = publishedRevision.snapshot as unknown as { sections: SectionRow[] };
  return snapshot.sections;
}
