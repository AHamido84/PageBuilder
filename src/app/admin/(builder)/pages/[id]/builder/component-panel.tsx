"use client";

import { useState } from "react";
import { Layers, Search, SquarePlus } from "lucide-react";
import { BLOCK_CATEGORIES, BLOCK_REGISTRY, getBlock } from "@/lib/page-builder/registry";
import { SECTION_TYPES } from "@/lib/page-builder/section-types";
import type { BuilderSection, EditorLocale } from "@/lib/page-builder/types";
import { LayersList } from "./layers-list";

interface Props {
  sections: BuilderSection[];
  selectedId: string | null;
  onAdd: (type: string, preset?: Record<string, unknown>) => void;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  /** PHASE 10: the Layers tab is a full section navigator (drag to reorder, duplicate, delete). */
  locale: EditorLocale;
  onReorder: (nextOrderIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ComponentPanel({ sections, selectedId, onAdd, onSelect, onToggleVisible, locale, onReorder, onDuplicate, onDelete }: Props) {
  const [tab, setTab] = useState<"add" | "layers">("add");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    // `overflow-hidden` here (not `visible`, the default) is load-bearing, not decorative: this div
    // is a direct CSS Grid item (row shared with Canvas and SettingsPanel, see page-builder-shell.tsx)
    // whose default min-height would otherwise be its content's full natural height, silently
    // inflating the shared row past the viewport -- see the longer explanation in settings-panel.tsx,
    // which had the same bug. The actual scrolling happens on the `flex-1 overflow-y-auto` list below;
    // this outer `overflow-hidden` only exists to give the grid track a correct (0) minimum size while
    // keeping the header UI (search / tab switcher) visually pinned above the scrollable list.
    <div className="flex h-full flex-col overflow-hidden border-e border-neutral-800 bg-neutral-950">
      <div className="flex shrink-0 gap-1 border-b border-neutral-800 p-1.5">
        <button
          type="button"
          onClick={() => setTab("add")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${tab === "add" ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          <SquarePlus size={13} /> Add
        </button>
        <button
          type="button"
          onClick={() => setTab("layers")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${tab === "layers" ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          <Layers size={13} /> Layers ({sections.length})
        </button>
      </div>

      {tab === "add" ? (
        <>
          <div className="shrink-0 border-b border-neutral-800 p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-1.5 ps-8 pe-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {(() => {
              // The named homepage section types (Hero, Slideshow, Logo Marquee, ...) -- shortcuts onto
              // the blocks below, some with a preset. See src/lib/page-builder/section-types.ts.
              const types = SECTION_TYPES.filter((t) => !q || `${t.label} ${t.keywords ?? ""}`.toLowerCase().includes(q));
              if (types.length === 0) return null;
              return (
                <div className="mb-4">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Section types</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {types.map((t) => {
                      const Icon = getBlock(t.type)?.icon;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => onAdd(t.type, t.preset)}
                          className="flex flex-col items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-3 text-center text-[11px] text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100"
                        >
                          {Icon ? <Icon size={16} /> : null}
                          <span className="leading-tight">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {BLOCK_CATEGORIES.map((cat) => {
              const blocks = Object.values(BLOCK_REGISTRY).filter((b) => b.category === cat.key && (!q || b.label.toLowerCase().includes(q)));
              if (blocks.length === 0) return null;
              return (
                <div key={cat.key} className="mb-4">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">{cat.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {blocks.map((block) => (
                      <button
                        key={block.type}
                        type="button"
                        onClick={() => onAdd(block.type)}
                        className="flex flex-col items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-3 text-center text-[11px] text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100"
                      >
                        <block.icon size={16} />
                        <span className="leading-tight">{block.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        // The page's structure, top to bottom -- lets an admin jump straight to any section
        // (Contact, Footer-adjacent CTAs, etc.) without needing to physically scroll the canvas
        // there first. Selecting an item here scrolls the canvas to it (see the `useEffect` in
        // canvas.tsx keyed off `selectedId`) and opens its settings, same as clicking it directly.
        <div className="flex-1 overflow-y-auto p-2">
          <LayersList
            sections={sections}
            selectedId={selectedId}
            locale={locale}
            onSelect={onSelect}
            onToggleVisible={onToggleVisible}
            onReorder={onReorder}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
