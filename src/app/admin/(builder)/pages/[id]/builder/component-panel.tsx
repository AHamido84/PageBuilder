"use client";

import { useState } from "react";
import { Eye, EyeOff, Layers, Search, SquarePlus } from "lucide-react";
import { BLOCK_CATEGORIES, BLOCK_REGISTRY, getBlock } from "@/lib/page-builder/registry";
import type { BuilderSection } from "@/lib/page-builder/types";

interface Props {
  sections: BuilderSection[];
  selectedId: string | null;
  onAdd: (type: string) => void;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
}

export function ComponentPanel({ sections, selectedId, onAdd, onSelect, onToggleVisible }: Props) {
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
          {sections.length === 0 ? (
            <p className="p-2 text-xs text-neutral-500">No sections yet.</p>
          ) : (
            <ol className="space-y-1">
              {sections.map((section, i) => {
                const block = getBlock(section.type);
                return (
                  <li key={section.id}>
                    <div
                      className={`group flex items-center gap-2 rounded-md border px-2 py-2 text-xs ${
                        section.id === selectedId ? "border-blue-500 bg-blue-500/10 text-neutral-100" : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      <button type="button" onClick={() => onSelect(section.id)} className="flex flex-1 items-center gap-2 text-start">
                        <span className="text-[10px] tabular-nums text-neutral-600">{i + 1}</span>
                        {block?.icon ? <block.icon size={13} className="shrink-0 text-neutral-500" /> : null}
                        <span className={`truncate ${section.isVisible ? "" : "opacity-50"}`}>{block?.label ?? section.type}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleVisible(section.id)}
                        className="shrink-0 text-neutral-600 hover:text-neutral-200"
                        title={section.isVisible ? "Hide" : "Show"}
                      >
                        {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
