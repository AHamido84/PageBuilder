"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteFormAction } from "./actions";

export function DeleteFormButton({ formId }: { formId: string }) {
  return <DeleteButton onDelete={() => deleteFormAction(formId)} itemLabel="this form" />;
}
