import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { CreateCertificationForm } from "./create-certification-form";
import { DeleteCertificationButton } from "./delete-certification-button";

export const dynamic = "force-dynamic";

export default async function CertificationsPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "read");

  const certifications = await prisma.certification.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const canCreate = currentUser.permissions.has("certifications:create");
  const canDelete = currentUser.permissions.has("certifications:delete");

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

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Name (EN)</th>
              <th className="px-4 py-2">Issuer</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {certifications.map((cert) => (
              <tr key={cert.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/certifications/${cert.id}`} className="hover:underline">
                    {cert.nameEn}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">{cert.issuer ?? "—"}</td>
                <td className="px-4 py-2">{cert._count.products}</td>
                <td className="px-4 py-2">{cert.isPublished ? "Published" : "Draft"}</td>
                <td className="px-4 py-2 text-right">{canDelete ? <DeleteCertificationButton certificationId={cert.id} /> : null}</td>
              </tr>
            ))}
            {certifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No certifications yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
