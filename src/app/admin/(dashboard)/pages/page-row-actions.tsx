"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPageStatusAction, duplicatePageAction, deletePageAction } from "./actions";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { useAdminToast } from "@/components/admin/ui/toast";

export function PageRowActions({ pageId, status, canDelete }: { pageId: string; status: string; canDelete: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useAdminToast();

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      {status !== "PUBLISHED" ? (
        <button type="button" disabled={pending} onClick={() => startTransition(async () => { await setPageStatusAction(pageId, "PUBLISHED"); router.refresh(); })} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-60">
          Publish
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => startTransition(async () => { await setPageStatusAction(pageId, "DRAFT"); router.refresh(); })} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60">
          Unpublish
        </button>
      )}
      {status !== "ARCHIVED" ? (
        <button type="button" disabled={pending} onClick={() => startTransition(async () => { await setPageStatusAction(pageId, "ARCHIVED"); router.refresh(); })} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60">
          Archive
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicatePageAction(pageId);
            if (result.error) toast.push({ title: "Couldn't duplicate", description: result.error, tone: "error" });
            else {
              toast.push({ title: "Page duplicated", tone: "success" });
              router.refresh();
            }
          })
        }
        className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
      >
        Duplicate
      </button>
      {canDelete ? <DeleteButton onDelete={() => deletePageAction(pageId)} itemLabel="this page" /> : null}
    </div>
  );
}
