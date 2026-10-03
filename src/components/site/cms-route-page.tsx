import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolveSectionsToRender, isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { SectionRenderer } from "@/components/site/section-renderer";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";

type SearchParamsLike = Record<string, string | string[] | undefined> | undefined;

/**
 * PHASE 8: lets a route that still has built-in content (e.g. the legal pages) be taken over by a
 * Page Builder page with the same slug. Returns null when no such page exists or nothing is
 * renderable for this visitor (never published and not an editor) -- the route then renders its
 * built-in content exactly as before, so environments without the page (e.g. prod today) are unchanged.
 */
export async function renderCmsRoutePage(slug: string, searchParams: SearchParamsLike): Promise<React.ReactNode | null> {
  const page = await prisma.page.findUnique({ where: { slug }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) return null;
  const resolved = await resolveSectionsToRender(page, await isDraftPreviewRequest(searchParams));
  if (!resolved || resolved.sections.length === 0) return null;
  const locale = await getLocale();
  return (
    <>
      <SectionRenderer sections={resolved.sections} locale={locale} />
      {resolved.draft ? <DraftPreviewBanner /> : null}
    </>
  );
}

/** Title + SEO record of a published Page Builder page, for `generateMetadata` (null when not published). */
export async function loadPublishedPageMeta(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { status: true, titleEn: true, titleAr: true, seo: { include: { ogImage: { select: { url: true } } } } },
  });
  return page && page.status === "PUBLISHED" ? page : null;
}
