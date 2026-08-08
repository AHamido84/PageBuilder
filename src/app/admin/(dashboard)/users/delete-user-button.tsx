"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAction } from "./actions";

export function DeleteUserButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this user? This cannot be undone.")) return;
        startTransition(async () => {
          const result = await deleteUserAction(userId);
          if (result.error) {
            alert(result.error);
          } else {
            router.refresh();
          }
        });
      }}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
    >
      Delete
    </button>
  );
}
