import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { SectionRenderer, type SectionRow } from "@/components/site/section-renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";

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
    fallbackTitle: t("home"),
  });
}

export default async function HomePage() {
  const locale = await getLocale();

  const page = await prisma.page.findUnique({
    where: { slug: HOMEPAGE_SLUG },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  // The homepage Page row is a required setup step (see scripts/seed-homepage.ts
  // in HANDOFF.md) -- if it's ever missing, fail loudly instead of rendering a
  // blank page that looks like a real (empty) homepage.
  if (!page) notFound();

  if (page.status !== "PUBLISHED") {
    const user = await getCurrentUser();
    if (!user || !can(user, "pages", "read")) notFound();
    return <SectionRenderer sections={page.sections as SectionRow[]} locale={locale} />;
  }

  const publishedRevision = await prisma.pageRevision.findFirst({ where: { pageId: page.id, isPublished: true } });
  if (!publishedRevision) notFound();

  const snapshot = publishedRevision.snapshot as unknown as { sections: SectionRow[] };
  return <SectionRenderer sections={snapshot.sections} locale={locale} />;
}
