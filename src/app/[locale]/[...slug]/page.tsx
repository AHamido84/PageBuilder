import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolveSectionsToRender, isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { SectionRenderer } from "@/components/site/section-renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { isReservedPageSlug } from "@/lib/page-builder/reserved-slugs";
import { pageTitle } from "@/lib/page-builder/page-title";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string[] }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const fullSlug = slug.join("/");
  // Reserved Pages (homepage, __solution__<slug>, __header__<key>) back another entity/embedded
  // zone and have no independently reachable URL of their own -- see reserved-slugs.ts. Previously
  // only the homepage slug was excluded here, so e.g. /__solution__hotels or /__header__products
  // was directly servable (and would auto-generate a garbled title from the raw slug below).
  if (isReservedPageSlug(fullSlug)) return {};
  const page = await prisma.page.findUnique({
    where: { slug: fullSlug },
    include: { seo: { include: { ogImage: { select: { url: true } } } } },
  });
  if (!page || page.status !== "PUBLISHED") return {};
  const fallbackTitle =
    pageTitle(page, locale) ??
    fullSlug
    .split("/")
    .pop()!
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return buildMetadata({
    locale,
    path: `/${fullSlug}`,
    seo: page.seo,
    fallbackTitle,
  });
}

export default async function CmsPage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const fullSlug = slug.join("/");
  if (isReservedPageSlug(fullSlug)) notFound();

  const page = await prisma.page.findUnique({
    where: { slug: fullSlug },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!page) {
    const redirectRule = await prisma.redirect.findUnique({ where: { fromPath: `/${fullSlug}` } });
    if (redirectRule && redirectRule.isActive) {
      redirect(redirectRule.toPath);
    }
    notFound();
  }

  // Published snapshot for visitors; the saved draft only for editors via ?preview=draft (or a never-published page).
  const resolved = await resolveSectionsToRender(page, await isDraftPreviewRequest(await searchParams));
  if (!resolved) notFound();
  return (
    <>
      <SectionRenderer sections={resolved.sections} locale={locale} />
      {resolved.draft ? <DraftPreviewBanner /> : null}
    </>
  );
}
