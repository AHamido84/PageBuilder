"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { StatisticsData } from "../social-proof-blocks";

export function StatisticsEdit({ data, onChange, locale }: BlockEditProps<StatisticsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items;
  function setItems(next: StatisticsData["items"]) {
    onChange({ ...data, items: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      {items.map((item, i) => (
        <div key={i} className="flex items-end gap-2 rounded-md border border-neutral-800 p-2">
          <TextField label="Value" value={item.value} onChange={(value) => setItems(items.map((it, idx) => (idx === i ? { ...it, value } : it)))} className="flex-1" />
          <TextField label="Label" value={item.label} onChange={(label) => setItems(items.map((it, idx) => (idx === i ? { ...it, label } : it)))} dir={dir} className="flex-[2]" />
          <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { value: "", label: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add stat
      </button>
    </div>
  );
}

export function StatisticsRender({ data, settings }: BlockRenderProps<StatisticsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className={`grid gap-8 text-center ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => (
          <div key={i}>
            <p className="font-display text-4xl">{item.value}</p>
            <p className="mt-1 text-sm opacity-60">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
