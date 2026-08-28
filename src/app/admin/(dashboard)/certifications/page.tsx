import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateCertificationForm } from "./create-certification-form";
import { CertificationList, type CertificationListItem } from "./certification-list";

export const dynamic = "force-dynamic";

export default async function CertificationsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "read");

  const certifications = await prisma.certification.findMany({
    orderBy: [{ order: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  const canCreate = currentUser.permissions.has("certifications:create");
  const canDelete = currentUser.permissions.has("certifications:delete");

  const items: CertificationListItem[] = certifications.map((cert) => ({
    id: cert.id,
    nameEn: cert.nameEn,
    issuer: cert.issuer,
    productCount: cert._count.products,
    isPublished: cert.isPublished,
  }));

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold">Certifications</h1>
      <p className="mb-6 text-sm text-neutral-500">
        No certifications are pre-populated — add only ones you can verify for this business.
      </p>

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <CreateCertificationForm />
        </div>
      ) : null}

      <CertificationList items={items} canDelete={canDelete} />
    </div>
  );
}
