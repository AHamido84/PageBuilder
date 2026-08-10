"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderFaqsAction, deleteFaqAction } from "./actions";
import { DeleteButton } from "@/components/admin/ui/delete-button";

export interface FaqListItem {
  id: string;
  questionEn: string;
  category: string | null;
  isPublished: boolean;
}

export function FaqList({ items, canDelete }: { items: FaqListItem[]; canDelete: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderFaqsAction(reordered.map((f) => f.id));
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-900 text-left text-neutral-400">
          <tr>
            <th className="px-4 py-2" />
            <th className="px-4 py-2">Question (EN)</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((faq, i) => (
            <tr key={faq.id} className="border-t border-neutral-800">
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▲</button>
                  <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▼</button>
                </div>
              </td>
              <td className="px-4 py-2">
                <Link href={`/admin/faqs/${faq.id}`} className="hover:underline">
                  {faq.questionEn}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-400">{faq.category ?? "—"}</td>
              <td className="px-4 py-2">{faq.isPublished ? "Published" : "Draft"}</td>
              <td className="px-4 py-2 text-right">{canDelete ? <DeleteButton onDelete={() => deleteFaqAction(faq.id)} itemLabel="this FAQ" /> : null}</td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                No FAQs yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
