"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/admin/ui/drawer";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { reorderMenuItemsAction, deleteMenuItemAction } from "./actions";
import { MenuItemForm, type PickerOption } from "./menu-item-form";

export interface MenuItemNode {
  id: string;
  labelEn: string;
  labelAr: string;
  linkType: "PAGE" | "CATEGORY" | "PRODUCT" | "URL";
  targetId: string;
  url: string;
  targetLabel: string;
  parentId: string | null;
}

function buildTree(items: MenuItemNode[]): Map<string | null, MenuItemNode[]> {
  const map = new Map<string | null, MenuItemNode[]>();
  for (const item of items) {
    const list = map.get(item.parentId) ?? [];
    list.push(item);
    map.set(item.parentId, list);
  }
  return map;
}

export function MenuEditor({
  location,
  items,
  pageOptions,
  categoryOptions,
  productOptions,
}: {
  location: "HEADER" | "FOOTER";
  items: MenuItemNode[];
  pageOptions: PickerOption[];
  categoryOptions: PickerOption[];
  productOptions: PickerOption[];
}) {
  const tree = buildTree(items);
  const router = useRouter();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; parentId?: string; item?: MenuItemNode } | null>(null);

  const parentOptions: PickerOption[] = items.map((i) => ({ id: i.id, label: i.labelEn }));

  function moveWithinSiblings(node: MenuItemNode, direction: -1 | 1) {
    const siblings = tree.get(node.parentId) ?? [];
    const index = siblings.findIndex((s) => s.id === node.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderMenuItemsAction(reordered.map((s) => s.id));
      router.refresh();
    });
  }

  async function handleDelete(node: MenuItemNode) {
    const ok = await confirm({ title: `Remove "${node.labelEn}"?`, confirmLabel: "Remove", danger: true });
    if (!ok) return;
    startTransition(async () => {
      await deleteMenuItemAction(node.id);
      router.refresh();
    });
  }

  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    const nodes = tree.get(parentId) ?? [];
    return nodes.map((node, i) => (
      <div key={node.id}>
        <div className="flex items-center gap-2 border-t border-neutral-800 px-3 py-2 text-sm" style={{ paddingLeft: `${12 + depth * 24}px` }}>
          <div className="flex flex-col">
            <button type="button" disabled={i === 0} onClick={() => moveWithinSiblings(node, -1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▲</button>
            <button type="button" disabled={i === nodes.length - 1} onClick={() => moveWithinSiblings(node, 1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▼</button>
          </div>
          <span className="flex-1">{node.labelEn}</span>
          <span className="w-28 text-neutral-500" dir="rtl">{node.labelAr}</span>
          <span className="w-40 truncate text-xs text-neutral-500">{node.linkType}: {node.targetLabel}</span>
          <button type="button" onClick={() => setDrawer({ mode: "edit", item: node })} className="text-neutral-400 hover:text-neutral-100">Edit</button>
          <button type="button" onClick={() => handleDelete(node)} className="text-red-400 hover:text-red-300">Remove</button>
        </div>
        {renderLevel(node.id, depth + 1)}
      </div>
    ));
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setDrawer({ mode: "create" })}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900"
        >
          Add menu item
        </button>
      </div>

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-neutral-800">{renderLevel(null, 0)}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">No items in this menu yet.</div>
      )}

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "edit" ? "Edit menu item" : "Add menu item"}
      >
        {drawer ? (
          <MenuItemForm
            mode={drawer.mode}
            menuLocation={location}
            itemId={drawer.item?.id}
            defaultValues={
              drawer.item
                ? {
                    labelEn: drawer.item.labelEn,
                    labelAr: drawer.item.labelAr,
                    linkType: drawer.item.linkType,
                    targetId: drawer.item.targetId,
                    url: drawer.item.url,
                    parentId: drawer.item.parentId ?? "",
                  }
                : undefined
            }
            parentOptions={parentOptions}
            pageOptions={pageOptions}
            categoryOptions={categoryOptions}
            productOptions={productOptions}
            onDone={() => {
              setDrawer(null);
              router.refresh();
            }}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
