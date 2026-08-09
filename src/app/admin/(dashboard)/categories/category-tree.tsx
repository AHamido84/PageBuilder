"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderCategoriesAction } from "./actions";
import { DeleteCategoryButton } from "./delete-category-button";

export interface CategoryTreeNode {
  id: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  nameEn: string;
  nameAr: string;
  productCount: number;
  parentId: string | null;
}

function buildTree(items: CategoryTreeNode[]): Map<string | null, CategoryTreeNode[]> {
  const map = new Map<string | null, CategoryTreeNode[]>();
  for (const item of items) {
    const list = map.get(item.parentId) ?? [];
    list.push(item);
    map.set(item.parentId, list);
  }
  return map;
}

export function CategoryTree({ items, canDelete }: { items: CategoryTreeNode[]; canDelete: boolean }) {
  const tree = buildTree(items);
  const roots = tree.get(null) ?? [];
  const router = useRouter();
  const [, startTransition] = useTransition();

  function moveWithinSiblings(node: CategoryTreeNode, direction: -1 | 1) {
    const siblings = tree.get(node.parentId) ?? [];
    const index = siblings.findIndex((s) => s.id === node.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderCategoriesAction(reordered.map((c) => c.id));
      router.refresh();
    });
  }

  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    const nodes = tree.get(parentId) ?? [];
    return nodes.map((node, i) => (
      <div key={node.id}>
        <div className="flex items-center gap-2 border-t border-neutral-800 px-4 py-2 text-sm" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex flex-col">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => moveWithinSiblings(node, -1)}
              className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={i === nodes.length - 1}
              onClick={() => moveWithinSiblings(node, 1)}
              className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
              aria-label="Move down"
            >
              ▼
            </button>
          </div>
          {node.icon ? <span>{node.icon}</span> : null}
          <Link href={`/admin/categories/${node.id}`} className="flex-1 hover:underline">
            {node.nameEn}
          </Link>
          <span className="w-32 text-neutral-400" dir="rtl">
            {node.nameAr}
          </span>
          <span className="w-24 text-neutral-500">{node.slug}</span>
          <span className="w-16 text-neutral-500">{node.productCount} SKUs</span>
          <span className="w-20 text-neutral-500">{node.isActive ? "Active" : "Inactive"}</span>
          {canDelete ? <DeleteCategoryButton categoryId={node.id} /> : null}
        </div>
        {renderLevel(node.id, depth + 1)}
      </div>
    ));
  }

  if (roots.length === 0) {
    return <div className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">No categories yet.</div>;
  }

  return <div className="overflow-hidden rounded-lg border border-neutral-800">{renderLevel(null, 0)}</div>;
}
