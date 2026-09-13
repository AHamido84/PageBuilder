"use client";

import { SelectField, TextField, TextareaField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { ProductGridData } from "../commerce-blocks";

export function ProductGridEdit({ data, onChange, locale }: BlockEditProps<ProductGridData>) {
  const { categories } = useReferenceData();
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Description (optional)" value={data.description ?? ""} onChange={(description) => onChange({ ...data, description })} dir={dir} rows={2} />
      <SelectField
        label="Category filter"
        value={data.categoryId ?? ""}
        onChange={(categoryId) => onChange({ ...data, categoryId })}
        options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.label }))]}
      />
      <NumberField label="Number displayed" value={data.limit} min={1} max={24} onChange={(limit) => onChange({ ...data, limit })} />
      <NumberField
        label="Grid columns (desktop, doesn't apply to Carousel)"
        value={data.columns ?? 4}
        min={2}
        max={6}
        onChange={(columns) => onChange({ ...data, columns })}
      />

      <div className="border-t border-neutral-800 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Image control</p>
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Fit"
            value={data.imageFit ?? "cover"}
            onChange={(imageFit) => onChange({ ...data, imageFit })}
            options={[
              { value: "cover", label: "Cover (crop to fill)" },
              { value: "contain", label: "Contain (show whole image)" },
              { value: "natural", label: "Natural (original ratio)" },
            ]}
          />
          <SelectField
            label="Position"
            value={data.imagePosition ?? "center"}
            onChange={(imagePosition) => onChange({ ...data, imagePosition })}
            options={[
              { value: "center", label: "Center" },
              { value: "top", label: "Top" },
              { value: "bottom", label: "Bottom" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
          />
        </div>
        <SelectField
          className="mt-2"
          label="Hover effect"
          value={data.hoverEffect ?? "zoom"}
          onChange={(hoverEffect) => onChange({ ...data, hoverEffect })}
          options={[
            { value: "zoom", label: "Zoom" },
            { value: "lift", label: "Lift" },
            { value: "none", label: "None" },
          ]}
        />
      </div>

      <div className="space-y-1.5 border-t border-neutral-800 pt-3">
        <CheckboxField label="Show specifications (weight/dimensions, when set)" checked={data.showSpecs ?? true} onChange={(showSpecs) => onChange({ ...data, showSpecs })} />
        <CheckboxField label="Show CTA" checked={data.showCta ?? true} onChange={(showCta) => onChange({ ...data, showCta })} />
        {data.showCta ? (
          <TextField label="CTA label (optional)" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} placeholder="View product" />
        ) : null}
      </div>
    </div>
  );
}

export function ProductGridPreview({ data }: { data: ProductGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Product Grid — {data.categoryId ? "filtered category" : "all categories"}, up to {data.limit} items.
      <br />
      Renders on the published page with real product data.
    </div>
  );
}
