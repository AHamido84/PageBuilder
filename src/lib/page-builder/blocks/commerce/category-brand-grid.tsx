"use client";

import { TextField } from "@/components/admin/ui/field";
import { CheckboxField } from "@/components/admin/ui/field";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

export function CategoryGridEdit({ data, onChange, locale }: BlockEditProps<CategoryGridData>) {
  const { categories } = useReferenceData();
  const selected = new Set(data.categoryIds ?? []);
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <p className="text-xs text-neutral-500">Leave all unchecked to show every category.</p>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
        {categories.map((c) => (
          <CheckboxField
            key={c.id}
            label={c.label}
            checked={selected.has(c.id)}
            onChange={(checked) => {
              const next = new Set(selected);
              if (checked) next.add(c.id);
              else next.delete(c.id);
              onChange({ ...data, categoryIds: Array.from(next) });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryGridPreview({ data }: { data: CategoryGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Category Grid — {data.categoryIds?.length ? `${data.categoryIds.length} selected` : "all categories"}.
    </div>
  );
}

export function BrandGridEdit({ data, onChange, locale }: BlockEditProps<BrandGridData>) {
  const { brands } = useReferenceData();
  const selected = new Set(data.brandIds ?? []);
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />
      <p className="text-xs text-neutral-500">Leave all unchecked to show every brand.</p>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
        {brands.map((b) => (
          <CheckboxField
            key={b.id}
            label={b.label}
            checked={selected.has(b.id)}
            onChange={(checked) => {
              const next = new Set(selected);
              if (checked) next.add(b.id);
              else next.delete(b.id);
              onChange({ ...data, brandIds: Array.from(next) });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function BrandGridPreview({ data }: { data: BrandGridData }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      Live Brand Grid — {data.brandIds?.length ? `${data.brandIds.length} selected` : "all brands"}.
    </div>
  );
}
