import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, can } from "@/lib/rbac/current-user";
import { SectionRenderer } from "@/components/site/section-renderer";

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
    const user = await getCurrentUser();
    if (!user || !can(user, "pages", "read")) notFound();
  }

  return <SectionRenderer sections={page.sections} locale={locale} />;
}
