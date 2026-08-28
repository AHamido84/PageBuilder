"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderSolutionsAction, setSolutionPublishedAction, duplicateSolutionAction, deleteSolutionAction } from "./actions";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { useAdminToast } from "@/components/admin/ui/toast";

export interface SolutionListItem {
  id: string;
  pageId: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
  nameEn: string;
  nameAr: string;
}

export function SolutionList({ items, canDelete }: { items: SolutionListItem[]; canDelete: boolean }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [pending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderSolutionsAction(reordered.map((s) => s.id));
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <div className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">No solutions yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-900 text-left text-neutral-400">
          <tr>
            <th className="px-4 py-2" />
            <th className="px-4 py-2">Name (EN)</th>
            <th className="px-4 py-2" dir="rtl">
              الاسم (عربي)
            </th>
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className="border-t border-neutral-800">
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={i === 0 || pending}
                    onClick={() => move(i, -1)}
                    className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === items.length - 1 || pending}
                    onClick={() => move(i, 1)}
                    className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
              </td>
              <td className="px-4 py-2">
                <Link href={`/admin/solutions/${item.id}`} className="hover:underline">
                  {item.icon ? `${item.icon} ` : ""}
                  {item.nameEn}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-400" dir="rtl">
                {item.nameAr}
              </td>
              <td className="px-4 py-2 text-neutral-500">/solutions/{item.slug}</td>
              <td className="px-4 py-2">{item.isPublished ? <span className="text-emerald-400">Published</span> : <span className="text-neutral-500">Draft</span>}</td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/admin/pages/${item.pageId}/builder`} className="text-neutral-400 hover:text-neutral-100">
                    Open in Page Builder
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setSolutionPublishedAction(item.id, !item.isPublished);
                        router.refresh();
                      })
                    }
                    className={item.isPublished ? "text-neutral-400 hover:text-neutral-100 disabled:opacity-60" : "text-emerald-400 hover:text-emerald-300 disabled:opacity-60"}
                  >
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await duplicateSolutionAction(item.id);
                        if (result.error) toast.push({ title: "Couldn't duplicate", description: result.error, tone: "error" });
                        else {
                          toast.push({ title: "Solution duplicated", tone: "success" });
                          router.refresh();
                        }
                      })
                    }
                    className="text-neutral-400 hover:text-neutral-100 disabled:opacity-60"
                  >
                    Duplicate
                  </button>
                  {canDelete ? (
                    <DeleteButton
                      onDelete={() => deleteSolutionAction(item.id)}
                      itemLabel="this solution"
                      confirmDescription="This also deletes its content page. This cannot be undone."
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
