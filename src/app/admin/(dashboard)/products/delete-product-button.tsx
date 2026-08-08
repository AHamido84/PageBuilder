"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this product?")) return;
        startTransition(async () => {
          const result = await deleteProductAction(productId);
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
