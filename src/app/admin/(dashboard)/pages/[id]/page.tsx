import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { PageDetailsForm } from "./page-details-form";
import { PageRowActions } from "../page-row-actions";
import { updatePageSeoAction } from "../actions";
import { HOMEPAGE_SLUG } from "@/lib/page-builder/homepage";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "pages", "update");

  const page = await prisma.page.findUnique({ where: { id }, include: { sections: true, seo: true } });

  if (!page) notFound();

  const isHomepage = page.slug === HOMEPAGE_SLUG;
  const publicPath = isHomepage ? "" : `/${page.slug}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{isHomepage ? "Homepage (/)" : `/${page.slug}`}</h1>
          <p className="text-sm text-neutral-500">
            {page.status} · {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/en${publicPath}`} target="_blank" className="text-sm text-neutral-400 hover:text-neutral-100">
            Preview →
          </Link>
          <Link href={`/admin/pages/${page.id}/builder`} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white">
            Open Page Builder →
          </Link>
          <PageRowActions pageId={page.id} status={page.status} canDelete={currentUser.permissions.has("pages:delete")} />
        </div>
      </div>

      <Tabs
        items={[
          { key: "details", label: "Details", content: <PageDetailsForm pageId={page.id} slug={page.slug} /> },
          {
            key: "seo",
            label: "SEO",
            content: <SeoForm action={updatePageSeoAction} idFieldName="pageId" entityId={page.id} defaultValues={page.seo ?? {}} />,
          },
        ]}
      />
    </div>
  );
}
