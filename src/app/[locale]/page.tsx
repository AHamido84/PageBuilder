import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolveSectionsToRender, isDraftPreviewRequest } from "@/lib/page-builder/render-page";
import { DraftPreviewBanner } from "@/components/site/draft-preview-banner";
import { SectionRenderer } from "@/components/site/section-renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";
import { pageTitle } from "@/lib/page-builder/page-title";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const page = await prisma.page.findUnique({
    where: { slug: HOMEPAGE_SLUG },
    include: { seo: { include: { ogImage: { select: { url: true } } } } },
  });
  if (!page || page.status !== "PUBLISHED") return {};
  const t = await getTranslations({ locale, namespace: "nav" });
  return buildMetadata({
    locale,
    path: "/",
    seo: page.seo,
    fallbackTitle: pageTitle(page, locale) ?? t("home"),
  });
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();

  const page = await prisma.page.findUnique({
    where: { slug: HOMEPAGE_SLUG },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  // The homepage Page row is a required setup step (see scripts/seed-homepage.ts
  // in HANDOFF.md) -- if it's ever missing, fail loudly instead of rendering a
  // blank page that looks like a real (empty) homepage.
  if (!page) notFound();

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
