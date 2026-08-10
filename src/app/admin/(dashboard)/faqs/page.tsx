import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateFaqForm } from "./create-faq-form";
import { FaqList } from "./faq-list";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "faqs", "read");

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  const canCreate = currentUser.permissions.has("faqs:create");
  const canDelete = currentUser.permissions.has("faqs:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">FAQs</h1>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateFaqForm />
        </div>
      ) : null}

      <FaqList items={faqs} canDelete={canDelete} />
    </div>
  );
}
