"use client";

import { SelectField, TextField } from "@/components/admin/ui/field";
import type { BlockEditProps } from "../../types";
import type { MarqueeData } from "../misc-blocks";

export function MarqueeEdit({ data, onChange, locale }: BlockEditProps<MarqueeData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading (optional)" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <SelectField
        label="Source"
        value={data.source}
        onChange={(source) => onChange({ ...data, source })}
        options={[
          { value: "brands", label: "Brands" },
          { value: "categories", label: "Categories" },
        ]}
      />
    </div>
  );
}

export function MarqueePreview({ data }: { data: MarqueeData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Marquee — real {data.source} names, looping.
    </div>
  );
}
