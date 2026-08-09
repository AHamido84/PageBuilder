"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/admin/ui/drawer";
import { useConfirm } from "@/components/admin/ui/confirm-dialog";
import { reorderSectionsAction, deleteSectionAction } from "../section-actions";
import { SectionForm } from "../section-form";
import { blockTypeLabel, type BlockType } from "../block-types";

export interface SectionItem {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  dataEn: Record<string, unknown>;
  dataAr: Record<string, unknown>;
}

function sectionSummary(section: SectionItem): string {
  const heading = (section.dataEn.headline ?? section.dataEn.heading ?? section.dataEn.body) as string | undefined;
  return heading ? String(heading).slice(0, 60) : "(no content yet)";
}

export function SectionList({
  pageId,
  sections,
  categories,
}: {
  pageId: string;
  sections: SectionItem[];
  categories: { id: string; label: string }[];
}) {
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; section?: SectionItem } | null>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function move(section: SectionItem, direction: -1 | 1) {
    const index = sorted.findIndex((s) => s.id === section.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(async () => {
      await reorderSectionsAction(pageId, reordered.map((s) => s.id));
      router.refresh();
    });
  }

  async function handleDelete(section: SectionItem) {
    const ok = await confirm({ title: "Remove this section?", confirmLabel: "Remove", danger: true });
    if (!ok) return;
    startTransition(async () => {
      await deleteSectionAction(section.id, pageId);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={() => setDrawer({ mode: "create" })} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900">
          Add section
        </button>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((section, i) => (
            <div key={section.id} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(section, -1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▲</button>
                <button type="button" disabled={i === sorted.length - 1} onClick={() => move(section, 1)} className="text-xs leading-none text-neutral-500 hover:text-neutral-200 disabled:opacity-30">▼</button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{blockTypeLabel(section.type)}</p>
                <p className="text-xs text-neutral-500">{sectionSummary(section)}</p>
              </div>
              {!section.isVisible ? <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">Hidden</span> : null}
              <button type="button" onClick={() => setDrawer({ mode: "edit", section })} className="text-sm text-neutral-400 hover:text-neutral-100">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(section)} className="text-sm text-red-400 hover:text-red-300">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
          No sections yet. Add one to start building this page.
        </div>
      )}

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.mode === "edit" ? "Edit section" : "Add section"} widthClassName="w-full max-w-lg">
        {drawer ? (
          <SectionForm
            mode={drawer.mode}
            pageId={pageId}
            sectionId={drawer.section?.id}
            categories={categories}
            defaultType={drawer.section?.type as BlockType | undefined}
            defaultDataEn={drawer.section?.dataEn}
            defaultDataAr={drawer.section?.dataAr}
            defaultVisible={drawer.section?.isVisible}
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
