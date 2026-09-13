import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { SectionRenderer, type SectionRow } from "@/components/site/section-renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { isReservedPageSlug } from "@/lib/page-builder/reserved-slugs";

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
  const fallbackTitle = fullSlug
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

export default async function CmsPage({ params }: { params: Promise<{ slug: string[] }> }) {
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
