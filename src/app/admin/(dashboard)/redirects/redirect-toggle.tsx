"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRedirectAction } from "./actions";

export function RedirectToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleRedirectAction(id, !isActive);
          router.refresh();
        })
      }
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}
    >
      {isActive ? "Active" : "Disabled"}
    </button>
  );
}
