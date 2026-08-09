"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateBlogPostAction } from "./actions";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { deleteBlogPostAction } from "./actions";
import { useAdminToast } from "@/components/admin/ui/toast";

export function PostRowActions({ postId, canDelete }: { postId: string; canDelete: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useAdminToast();

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateBlogPostAction(postId);
            if (result.error) toast.push({ title: "Couldn't duplicate", description: result.error, tone: "error" });
            else {
              toast.push({ title: "Post duplicated", tone: "success" });
              router.refresh();
            }
          })
        }
        className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
      >
        Duplicate
      </button>
      {canDelete ? <DeleteButton onDelete={() => deleteBlogPostAction(postId)} itemLabel="this post" /> : null}
    </div>
  );
}
