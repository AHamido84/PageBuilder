"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderCertificationsAction } from "./actions";
import { DeleteCertificationButton } from "./delete-certification-button";

export interface CertificationListItem {
  id: string;
  nameEn: string;
  issuer: string | null;
  productCount: number;
  isPublished: boolean;
}

export function CertificationList({ items, canDelete }: { items: CertificationListItem[]; canDelete: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderCertificationsAction(reordered.map((c) => c.id));
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-900 text-left text-neutral-400">
          <tr>
            <th className="px-4 py-2" />
            <th className="px-4 py-2">Name (EN)</th>
            <th className="px-4 py-2">Issuer</th>
            <th className="px-4 py-2">Products</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((cert, i) => (
            <tr key={cert.id} className="border-t border-neutral-800">
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <button type="button" disabled={i === 0 || pending} onClick={() => move(i, -1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30" aria-label="Move up">
                    ▲
                  </button>
                  <button type="button" disabled={i === items.length - 1 || pending} onClick={() => move(i, 1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30" aria-label="Move down">
                    ▼
                  </button>
                </div>
              </td>
              <td className="px-4 py-2">
                <Link href={`/admin/certifications/${cert.id}`} className="hover:underline">
                  {cert.nameEn}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-400">{cert.issuer ?? "—"}</td>
              <td className="px-4 py-2">{cert.productCount}</td>
              <td className="px-4 py-2">{cert.isPublished ? "Published" : "Draft"}</td>
              <td className="px-4 py-2 text-right">{canDelete ? <DeleteCertificationButton certificationId={cert.id} /> : null}</td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                No certifications yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
