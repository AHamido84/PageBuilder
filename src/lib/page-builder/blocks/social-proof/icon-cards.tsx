"use client";

import {
  Award, Boxes, Clock, Globe, Handshake, Leaf, Package, Phone, Plus,
  Shield, Snowflake, Star, Thermometer, Trash2, Truck, Users,
  type LucideIcon,
} from "lucide-react";
import { TextField, TextareaField, SelectField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { IconCardsData } from "../social-proof-blocks";

export const ICON_OPTIONS: Record<string, LucideIcon> = {
  award: Award, boxes: Boxes, clock: Clock, globe: Globe, handshake: Handshake,
  leaf: Leaf, package: Package, phone: Phone, shield: Shield, snowflake: Snowflake,
  star: Star, thermometer: Thermometer, truck: Truck, users: Users,
};

export function IconCardsEdit({ data, onChange, locale }: BlockEditProps<IconCardsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const items = data.items;
  function setItems(next: IconCardsData["items"]) {
    onChange({ ...data, items: next });
  }
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Card {i + 1}</p>
            <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
          </div>
          <SelectField
            label="Icon"
            value={item.icon}
            onChange={(icon) => setItems(items.map((it, idx) => (idx === i ? { ...it, icon } : it)))}
            options={Object.keys(ICON_OPTIONS).map((k) => ({ value: k, label: k }))}
          />
          <TextField label="Title" value={item.title} onChange={(title) => setItems(items.map((it, idx) => (idx === i ? { ...it, title } : it)))} dir={dir} />
          <TextareaField label="Body" value={item.body} onChange={(body) => setItems(items.map((it, idx) => (idx === i ? { ...it, body } : it)))} dir={dir} rows={2} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { icon: "star", title: "", body: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add card
      </button>
    </div>
  );
}

export function IconCardsRender({ data, settings }: BlockRenderProps<IconCardsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className={`grid gap-6 ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => {
          const Icon = ICON_OPTIONS[item.icon] ?? Star;
          return (
            <div key={i} className="rounded-[var(--radius-md)] border border-current/10 p-6">
              <Icon size={24} className="opacity-70" />
              <p className="mt-3 font-display text-lg">{item.title}</p>
              <p className="mt-1 text-sm opacity-65">{item.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
