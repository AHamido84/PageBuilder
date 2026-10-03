import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import type { SectionRow } from "@/components/site/section-renderer";

/** `?preview=draft` on any Page Builder route shows the unpublished draft -- to signed-in editors only. */
export const DRAFT_PREVIEW_PARAM = "preview";
export const DRAFT_PREVIEW_VALUE = "draft";

type SearchParamsLike = Record<string, string | string[] | undefined> | undefined;

/** True only when the URL asks for the draft AND the visitor may read pages; everyone else gets the published page. */
export async function isDraftPreviewRequest(searchParams: SearchParamsLike): Promise<boolean> {
  if (searchParams?.[DRAFT_PREVIEW_PARAM] !== DRAFT_PREVIEW_VALUE) return false;
  const user = await getCurrentUser();
  return can(user, "pages", "read");
}

interface PageForRender {
  id: string;
  status: string;
  sections: unknown[];
}

/**
 * Which sections a Page Builder page renders: the published snapshot for everyone, unless
 *  - the page has never been published (editors see the draft, everyone else gets null -> 404), or
 *  - an editor explicitly asked for the draft preview.
 * The draft rows (PageSection) are what the builder saves; the snapshot (PageRevision with
 * isPublished) only changes on Publish -- so saving never alters what visitors see.
 */
export async function resolveSectionsToRender(page: PageForRender, draftPreview: boolean): Promise<{ sections: SectionRow[]; draft: boolean } | null> {
  if (page.status !== "PUBLISHED") {
    const user = await getCurrentUser();
    if (!can(user, "pages", "read")) return null;
    return { sections: page.sections as SectionRow[], draft: true };
  }
  if (draftPreview) return { sections: page.sections as SectionRow[], draft: true };

  const publishedRevision = await prisma.pageRevision.findFirst({ where: { pageId: page.id, isPublished: true } });
  if (!publishedRevision) return null;
  const snapshot = publishedRevision.snapshot as unknown as { sections: SectionRow[] };
  return { sections: snapshot.sections, draft: false };
}
