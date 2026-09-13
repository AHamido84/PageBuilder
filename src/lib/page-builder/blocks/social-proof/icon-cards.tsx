"use client";

import Link from "next/link";
import {
  Award, Boxes, Clock, Globe, Handshake, Leaf, Package, Phone, Plus,
  Shield, Snowflake, Star, Thermometer, Trash2, Truck, Users,
  type LucideIcon,
} from "lucide-react";
import { TextField, TextareaField, SelectField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import { resolveHref } from "../../href";
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
          <TextField label="Link (optional)" value={item.link ?? ""} onChange={(link) => setItems(items.map((it, idx) => (idx === i ? { ...it, link } : it)))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { icon: "star", title: "", body: "", link: "" }])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <Plus size={14} /> Add card
      </button>
    </div>
  );
}

export function IconCardsRender({ data, settings, locale }: BlockRenderProps<IconCardsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-10 font-display text-h2">{data.heading}</h2> : null}
      <div className={`grid gap-[var(--card-gap,1.5rem)] lg:gap-[calc(var(--card-gap,1.5rem)*1.333)] ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => {
          const Icon = ICON_OPTIONS[item.icon] ?? Star;
          const cardContent = (
            <>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-harbor-soft">
                <Icon size={26} strokeWidth={1.5} className="text-harbor" />
              </span>
              <p className="mt-5 font-display text-h4">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{item.body}</p>
            </>
          );
          const cardClasses = "hover-lift rounded-[var(--radius-lg)] border border-current/10 p-8";
          // Phase 10: reveals in place on scroll -- `as` picks Link or a plain div per item, same
          // element as before (no extra wrapper), so the grid's column/gap sizing is untouched.
          return item.link ? (
            <ScrollReveal key={i} as={Link} href={resolveHref(item.link, locale)} variant="fade-up" className={`${cardClasses} block`}>
              {cardContent}
            </ScrollReveal>
          ) : (
            <ScrollReveal key={i} variant="fade-up" className={cardClasses}>
              {cardContent}
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
