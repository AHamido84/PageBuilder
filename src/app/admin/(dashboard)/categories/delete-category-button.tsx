"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this category?")) return;
        startTransition(async () => {
          const result = await deleteCategoryAction(categoryId);
          if (result.error) alert(result.error);
          else router.refresh();
        });
      }}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
    >
      Delete
    </button>
  );
}
