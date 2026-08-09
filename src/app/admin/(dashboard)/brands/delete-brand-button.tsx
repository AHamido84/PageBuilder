"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteBrandAction } from "./actions";

export function DeleteBrandButton({ brandId }: { brandId: string }) {
  return <DeleteButton onDelete={() => deleteBrandAction(brandId)} itemLabel="this brand" />;
}
