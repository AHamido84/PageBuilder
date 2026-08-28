"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderBrandsAction } from "./actions";
import { DeleteBrandButton } from "./delete-brand-button";

export interface BrandListItem {
  id: string;
  slug: string;
  nameEn: string;
  productCount: number;
  isActive: boolean;
  isFeatured: boolean;
}

export function BrandList({ items, canDelete }: { items: BrandListItem[]; canDelete: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderBrandsAction(reordered.map((b) => b.id));
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
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Products</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((brand, i) => (
            <tr key={brand.id} className="border-t border-neutral-800">
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
                <Link href={`/admin/brands/${brand.id}`} className="hover:underline">
                  {brand.nameEn}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-400">{brand.slug}</td>
              <td className="px-4 py-2">{brand.productCount}</td>
              <td className="px-4 py-2">
                <span className={brand.isActive ? "" : "text-neutral-500"}>{brand.isActive ? "Active" : "Inactive"}</span>
                {brand.isFeatured ? (
                  <span className="ml-2 rounded-full bg-wheat/20 px-2 py-0.5 text-[10px] font-medium text-wheat">Featured</span>
                ) : null}
              </td>
              <td className="px-4 py-2 text-right">{canDelete ? <DeleteBrandButton brandId={brand.id} /> : null}</td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                No brands yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
