import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { SectionRenderer, type SectionRow } from "@/components/site/section-renderer";

export const dynamic = "force-dynamic";

export default async function CmsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const fullSlug = slug.join("/");

  const page = await prisma.page.findUnique({
    where: { slug: fullSlug },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!page) notFound();

  if (page.status !== "PUBLISHED") {
    // Draft/archived pages: only a logged-in admin with pages:read may preview them,
    // and they always see the live working draft (never a revision snapshot).
    const user = await getCurrentUser();
    if (!user || !can(user, "pages", "read")) notFound();
    return <SectionRenderer sections={page.sections as SectionRow[]} locale={locale} />;
  }

  // Published: anonymous visitors AND logged-in admins both see the published
  // snapshot, not live edits -- editing a published page's sections does not
  // change the live site until an explicit Publish.
  const publishedRevision = await prisma.pageRevision.findFirst({ where: { pageId: page.id, isPublished: true } });
  if (!publishedRevision) notFound();

  const snapshot = publishedRevision.snapshot as unknown as { sections: SectionRow[] };
  return <SectionRenderer sections={snapshot.sections} locale={locale} />;
}
