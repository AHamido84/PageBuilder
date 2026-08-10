import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { EditCertificationForm } from "./edit-certification-form";

export const dynamic = "force-dynamic";

export default async function EditCertificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "certifications", "update");

  const certification = await prisma.certification.findUnique({ where: { id }, include: { image: { select: { url: true } } } });
  if (!certification) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit certification</h1>
      <EditCertificationForm certification={certification} />
    </div>
  );
}
