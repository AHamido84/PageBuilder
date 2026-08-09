"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  return <DeleteButton onDelete={() => deleteProductAction(productId)} itemLabel="this product" />;
}
