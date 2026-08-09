"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { BLOCK_CATEGORIES, BLOCK_REGISTRY } from "@/lib/page-builder/registry";

export function ComponentPanel({ onAdd }: { onAdd: (type: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <div className="flex h-full flex-col border-e border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 p-3">
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
    </div>
  );
}
