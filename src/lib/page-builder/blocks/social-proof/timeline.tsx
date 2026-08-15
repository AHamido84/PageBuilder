"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField, TextareaField, SelectField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import { ColdChainJourney } from "@/components/site/cold-chain-journey";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { TimelineData } from "../social-proof-blocks";

export function TimelineEdit({ data, onChange, locale }: BlockEditProps<TimelineData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items;
  function setItems(next: TimelineData["items"]) {
    onChange({ ...data, items: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <SelectField
        label="Layout"
        value={data.layout}
        onChange={(layout) => onChange({ ...data, layout })}
        options={[
          { value: "list", label: "List" },
          { value: "journey", label: "Journey (scroll-drawn route)" },
        ]}
      />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Event {i + 1}</p>
            <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
          </div>
          <TextField label="Date (optional)" value={item.date ?? ""} onChange={(date) => setItems(items.map((it, idx) => (idx === i ? { ...it, date } : it)))} />
          <TextField label="Title" value={item.title} onChange={(title) => setItems(items.map((it, idx) => (idx === i ? { ...it, title } : it)))} dir={dir} />
          <TextareaField label="Body" value={item.body} onChange={(body) => setItems(items.map((it, idx) => (idx === i ? { ...it, body } : it)))} dir={dir} rows={2} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { date: "", title: "", body: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add event
      </button>
    </div>
  );
}

export function TimelineRender({ data }: BlockRenderProps<TimelineData>) {
  if (data.layout === "journey") {
    return <ColdChainJourney heading={data.heading} steps={data.items} />;
  }
  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className="space-y-6 border-s-2 border-current/15 ps-6">
        {data.items.map((item, i) => (
          <div key={i} className="relative">
            <span className="absolute -start-[1.9rem] top-1 h-2.5 w-2.5 rounded-full bg-current" />
            {item.date ? <p className="text-xs font-mono uppercase tracking-wide opacity-50">{item.date}</p> : null}
            <p className="mt-1 font-display text-lg">{item.title}</p>
            <p className="mt-1 text-sm opacity-70">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
