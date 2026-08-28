import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { SectionRenderer, type SectionRow } from "@/components/site/section-renderer";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

/**
 * Content lives entirely on the Solution's linked Page (hero + unlimited sections, edited in
 * the Page Builder) -- this route just resolves Solution.slug -> Page and renders it exactly
 * like src/app/[locale]/contact/page.tsx does.
 *
 * `Solution.isPublished` is an outer gate on top of the Page's own draft/publish state (not a
 * replacement for it): it controls whether the solution is publicly reachable/listed at all,
 * independent of whether its content page has ever been published in the builder. Both must be
 * true for an anonymous visitor to see the page; a logged-in admin with pages:read can always
 * preview a solution's live draft content regardless of either flag.
 */
async function loadSolution(slug: string) {
  return prisma.solution.findUnique({
    where: { slug },
    include: {
      translations: true,
      page: {
        include: {
          sections: { orderBy: { order: "asc" } },
          seo: { include: { ogImage: { select: { url: true } } } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const solution = await loadSolution(slug);
  if (!solution || !solution.isPublished || solution.page.status !== "PUBLISHED") return {};
  const translation = solution.translations.find((t) => t.locale === locale.toUpperCase());
  return buildMetadata({
    locale,
    path: `/solutions/${slug}`,
    seo: solution.page.seo,
    fallbackTitle: translation?.name ?? solution.slug,
    fallbackDescription: translation?.shortDescription,
  });
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();

  const solution = await loadSolution(slug);
  if (!solution) notFound();

  if (!solution.isPublished || solution.page.status !== "PUBLISHED") {
    const user = await getCurrentUser();
    if (!user || !can(user, "pages", "read")) notFound();
    return <SectionRenderer sections={solution.page.sections as SectionRow[]} locale={locale} />;
  }

  const publishedRevision = await prisma.pageRevision.findFirst({ where: { pageId: solution.pageId, isPublished: true } });
  if (!publishedRevision) notFound();

  const snapshot = publishedRevision.snapshot as unknown as { sections: SectionRow[] };
  return <SectionRenderer sections={snapshot.sections} locale={locale} />;
}
