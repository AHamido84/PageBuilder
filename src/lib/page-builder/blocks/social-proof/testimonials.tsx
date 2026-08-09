"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { TestimonialsData } from "../social-proof-blocks";

export function TestimonialsEdit({ data, onChange, locale }: BlockEditProps<TestimonialsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items;
  function setItems(next: TestimonialsData["items"]) {
    onChange({ ...data, items: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Testimonial {i + 1}</p>
            <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
          </div>
          <TextareaField label="Quote" value={item.quote} onChange={(quote) => setItems(items.map((it, idx) => (idx === i ? { ...it, quote } : it)))} dir={dir} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Author name" value={item.authorName} onChange={(authorName) => setItems(items.map((it, idx) => (idx === i ? { ...it, authorName } : it)))} dir={dir} />
            <TextField label="Author role" value={item.authorRole ?? ""} onChange={(authorRole) => setItems(items.map((it, idx) => (idx === i ? { ...it, authorRole } : it)))} dir={dir} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { quote: "", authorName: "", authorRole: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add testimonial
      </button>
    </div>
  );
}

export function TestimonialsRender({ data, settings }: BlockRenderProps<TestimonialsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className={`grid gap-6 ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => (
          <figure key={i} className="rounded-[var(--radius-md)] border border-current/10 p-6">
            <blockquote className="text-sm leading-relaxed opacity-80">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 text-sm font-medium">
              {item.authorName}
              {item.authorRole ? <span className="opacity-50"> — {item.authorRole}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
