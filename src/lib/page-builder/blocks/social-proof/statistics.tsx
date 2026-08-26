"use client";

import { Plus, Trash2, Globe, Truck, Package, ShieldCheck, Snowflake, Users, MapPin, Award, Clock, Leaf, type LucideIcon } from "lucide-react";
import { TextField, SelectField } from "@/components/admin/ui/field";
import { IconButton } from "@/components/admin/ui/icon-button";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { StatisticsData, StatIcon } from "../social-proof-blocks";

const STAT_ICONS: Record<Exclude<StatIcon, "none">, LucideIcon> = {
  globe: Globe,
  truck: Truck,
  package: Package,
  "shield-check": ShieldCheck,
  snowflake: Snowflake,
  users: Users,
  "map-pin": MapPin,
  award: Award,
  clock: Clock,
  leaf: Leaf,
};

const ICON_OPTIONS: { value: StatIcon; label: string }[] = [
  { value: "none", label: "None" },
  { value: "globe", label: "Globe (reach)" },
  { value: "truck", label: "Truck (distribution)" },
  { value: "package", label: "Package (products)" },
  { value: "shield-check", label: "Shield (quality)" },
  { value: "snowflake", label: "Snowflake (cold chain)" },
  { value: "users", label: "Users (partners)" },
  { value: "map-pin", label: "Map pin (coverage)" },
  { value: "award", label: "Award (experience)" },
  { value: "clock", label: "Clock (years)" },
  { value: "leaf", label: "Leaf (freshness)" },
];

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
        <div key={i} className="space-y-2 rounded-md border border-neutral-800 p-2">
          <div className="flex items-end gap-2">
            <TextField label="Value" value={item.value} onChange={(value) => setItems(items.map((it, idx) => (idx === i ? { ...it, value } : it)))} className="flex-1" />
            <TextField label="Label" value={item.label} onChange={(label) => setItems(items.map((it, idx) => (idx === i ? { ...it, label } : it)))} dir={dir} className="flex-[2]" />
            <IconButton icon={Trash2} label="Remove" danger onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
          </div>
          <SelectField
            label="Icon"
            value={item.icon}
            onChange={(icon) => setItems(items.map((it, idx) => (idx === i ? { ...it, icon } : it)))}
            options={ICON_OPTIONS}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { value: "", label: "", icon: "none" }])}
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
      <div className={`grid gap-x-8 gap-y-10 text-center divide-ink/10 sm:divide-x rtl:sm:divide-x-reverse ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => {
          const Icon = item.icon && item.icon !== "none" ? STAT_ICONS[item.icon] : null;
          return (
            <div key={i} className="px-2">
              {Icon ? <Icon className="mx-auto mb-3 h-6 w-6 text-wheat" strokeWidth={1.5} aria-hidden /> : null}
              <p className="font-display text-4xl text-wheat-strong">{item.value}</p>
              <p className="mt-1 text-sm opacity-60">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
