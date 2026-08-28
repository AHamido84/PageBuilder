import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { EditSolutionForm } from "./edit-solution-form";
import { updatePageSeoAction } from "../../pages/actions";

export const dynamic = "force-dynamic";

export default async function EditSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "solutions", "update");

  const solution = await prisma.solution.findUnique({
    where: { id },
    include: { translations: true, page: { include: { seo: true } } },
  });

  if (!solution) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit solution</h1>
        <Link
          href={`/admin/pages/${solution.pageId}/builder`}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900"
        >
          Open in Page Builder →
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Fields here control the /solutions index card. The hero, images, and content sections are edited in the Page
        Builder.
      </p>
      <Tabs
        items={[
          { key: "details", label: "Details", content: <EditSolutionForm solution={solution} /> },
          {
            key: "seo",
            label: "SEO",
            content: (
              <SeoForm action={updatePageSeoAction} idFieldName="pageId" entityId={solution.pageId} defaultValues={solution.page.seo ?? {}} />
            ),
          },
        ]}
      />
    </div>
  );
}
