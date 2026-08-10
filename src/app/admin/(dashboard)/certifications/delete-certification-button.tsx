"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteCertificationAction } from "./actions";

export function DeleteCertificationButton({ certificationId }: { certificationId: string }) {
  return <DeleteButton onDelete={() => deleteCertificationAction(certificationId)} itemLabel="this certification" />;
}
