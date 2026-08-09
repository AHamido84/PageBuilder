"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { TextField, TextareaField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";

export interface AccordionItem {
  title: string;
  body: string;
}
export interface AccordionLikeData {
  heading?: string;
  items: AccordionItem[];
}

/**
 * NOT a factory called from server code -- this file is "use client", and
 * invoking an exported function from a server module (like a block-registry
 * array) breaks the RSC boundary. Each specific editor below (Accordion/FAQ/
 * Tabs/Feature Cards) is instead a real, directly-exported component that
 * closes over its own itemLabel, so it's safe to reference from server code.
 */
function ItemListEditImpl<T extends AccordionLikeData>({ itemLabel, data, onChange, locale }: BlockEditProps<T> & { itemLabel: string }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items ?? [];
  function setItems(next: AccordionItem[]) {
    onChange({ ...data, items: next } as T);
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading (optional)" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading } as T)} dir={dir} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-500">
                {itemLabel} {i + 1}
              </p>
              <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
            </div>
            <TextField label="Title / Question" value={item.title} onChange={(title) => setItems(items.map((it, idx) => (idx === i ? { ...it, title } : it)))} dir={dir} />
            <TextareaField label="Body / Answer" value={item.body} onChange={(body) => setItems(items.map((it, idx) => (idx === i ? { ...it, body } : it)))} dir={dir} rows={2} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, { title: "", body: "" }])}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
        >
          <Plus size={14} /> Add {itemLabel.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

export function AccordionItemsEdit<T extends AccordionLikeData>(props: BlockEditProps<T>) {
  return <ItemListEditImpl itemLabel="Item" {...props} />;
}
export function FaqItemsEdit<T extends AccordionLikeData>(props: BlockEditProps<T>) {
  return <ItemListEditImpl itemLabel="Question" {...props} />;
}
export function TabsItemsEdit<T extends AccordionLikeData>(props: BlockEditProps<T>) {
  return <ItemListEditImpl itemLabel="Tab" {...props} />;
}
export function CardItemsEdit<T extends AccordionLikeData>(props: BlockEditProps<T>) {
  return <ItemListEditImpl itemLabel="Card" {...props} />;
}

export function AccordionListRender({ data, interactive }: BlockRenderProps<AccordionLikeData>) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = data.items ?? [];
  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="divide-y divide-current/10 border-y border-current/10">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={i}>
              <button
                type="button"
                data-pb-interactive="true"
                onClick={() => interactive && setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
              >
                <span>{item.title}</span>
                <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? <p className="pb-4 text-sm opacity-70">{item.body}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
