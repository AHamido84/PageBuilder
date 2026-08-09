"use client";

import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  return <DeleteButton onDelete={() => deleteCategoryAction(categoryId)} itemLabel="this category" />;
}
