"use client";

import { SelectField, TextField, NumberField } from "@/components/admin/ui/field";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { NewsGridData } from "../commerce-blocks";

export function NewsGridEdit({ data, onChange, locale }: BlockEditProps<NewsGridData>) {
  const { blogCategories } = useReferenceData();
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <SelectField
        label="Category filter"
        value={data.categoryId ?? ""}
        onChange={(categoryId) => onChange({ ...data, categoryId })}
        options={[{ value: "", label: "All categories" }, ...blogCategories.map((c) => ({ value: c.id, label: c.label }))]}
      />
      <NumberField label="Limit" value={data.limit} min={1} max={12} onChange={(limit) => onChange({ ...data, limit })} />
    </div>
  );
}

export function NewsGridPreview({ data }: { data: NewsGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live News Grid — latest posts{data.categoryId ? ", filtered category" : ""}, up to {data.limit} items.
      <br />
      Renders on the published page with real blog data.
    </div>
  );
}
