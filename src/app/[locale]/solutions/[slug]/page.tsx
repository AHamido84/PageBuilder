import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolveSectionsToRender, isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { SectionRenderer } from "@/components/site/section-renderer";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { solutionCopy } from "@/lib/seo/page-copy";

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
    copy: solutionCopy(solution.slug, locale, translation?.name ?? solution.slug),
    fallbackDescription: translation?.shortDescription,
  });
}

export default async function SolutionDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const locale = await getLocale();

  const solution = await loadSolution(slug);
  if (!solution) notFound();

  // An unpublished Solution is treated like an unpublished page: editors see the draft, visitors get a 404.
  const pageForRender = solution.isPublished ? solution.page : { ...solution.page, status: "DRAFT" };
  const resolved = await resolveSectionsToRender(pageForRender, await isDraftPreviewRequest(await searchParams));
  if (!resolved) notFound();
  const tNav = await getTranslations("nav");
  const name = solution.translations.find((t) => t.locale === locale.toUpperCase())?.name ?? solution.slug;
  const breadcrumb = breadcrumbSchema([
    { name: tNav("home"), url: `${SITE_URL}/${locale}` },
    { name: tNav("solutions"), url: `${SITE_URL}/${locale}/solutions` },
    { name, url: `${SITE_URL}/${locale}/solutions/${solution.slug}` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <SectionRenderer sections={resolved.sections} locale={locale} />
      {resolved.draft ? <DraftPreviewBanner /> : null}
    </>
  );
}
