"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "./confirm-dialog";
import { useAdminToast } from "./toast";

interface DeleteButtonProps {
  onDelete: () => Promise<{ error?: string } | void>;
  itemLabel?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  className?: string;
  children?: React.ReactNode;
}

export function DeleteButton({
  onDelete,
  itemLabel = "this item",
  confirmTitle,
  confirmDescription,
  className,
  children,
}: DeleteButtonProps) {
  const confirm = useConfirm();
  const toast = useAdminToast();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        const ok = await confirm({
          title: confirmTitle ?? `Delete ${itemLabel}?`,
          description: confirmDescription ?? "This cannot be undone.",
          confirmLabel: "Delete",
          danger: true,
        });
        if (!ok) return;
        startTransition(async () => {
          const result = await onDelete();
          if (result && "error" in result && result.error) {
            toast.push({ title: "Couldn't delete", description: result.error, tone: "error" });
          } else {
            toast.push({ title: "Deleted", tone: "success" });
            router.refresh();
          }
        });
      }}
      className={className ?? "text-sm text-red-400 hover:text-red-300 disabled:opacity-60"}
    >
      {children ?? "Delete"}
    </button>
  );
}
