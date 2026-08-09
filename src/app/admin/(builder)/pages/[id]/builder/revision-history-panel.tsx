"use client";

import { useTransition } from "react";
import { Drawer } from "@/components/admin/ui/drawer";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/ui/toast";
import { restoreRevisionAction } from "./actions";

export interface RevisionListItem {
  id: string;
  createdAt: string;
  note: string | null;
  isPublished: boolean;
  authorName: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pageId: string;
  revisions: RevisionListItem[];
  onRestored: () => void;
}

export function RevisionHistoryPanel({ open, onClose, pageId, revisions, onRestored }: Props) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const toast = useAdminToast();

  async function handleRestore(revisionId: string) {
    const ok = await confirm({
      title: "Restore this revision?",
      description: "The current working draft will be replaced with this revision's content. A safety copy of your current draft is kept, and this does not immediately republish the live site.",
      confirmLabel: "Restore",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await restoreRevisionAction(pageId, revisionId);
      if (result.error) {
        toast.push({ title: result.error, tone: "error" });
      } else {
        toast.push({ title: "Draft restored — remember to Publish to make it live.", tone: "success" });
        onRestored();
        onClose();
      }
    });
  }

  return (
    <Drawer open={open} onClose={onClose} title="Revision history" widthClassName="w-full max-w-md">
      <div className="space-y-2">
        {revisions.length === 0 ? (
          <p className="text-sm text-neutral-500">No revisions yet — publish the page to create one.</p>
        ) : (
          revisions.map((rev) => (
            <div key={rev.id} className="rounded-md border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-200">{new Date(rev.createdAt).toLocaleString()}</p>
                {rev.isPublished ? <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">LIVE</span> : null}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {rev.note ?? "Published snapshot"} {rev.authorName ? `· ${rev.authorName}` : ""}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRestore(rev.id)}
                className="mt-2 rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}
