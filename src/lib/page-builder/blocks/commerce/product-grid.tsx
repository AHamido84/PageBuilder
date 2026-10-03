"use client";

import { SelectField, TextField, TextareaField, NumberField, CheckboxField } from "@/components/admin/ui/field";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { ProductGridData } from "../commerce-blocks";

export function ProductGridEdit({ data, onChange, locale }: BlockEditProps<ProductGridData>) {
  const { categories, products } = useReferenceData();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const mode = data.mode ?? "latest";
  const picked = data.productIds ?? [];
  const promo = { enabled: false, eyebrow: "", title: "", body: "", ctaLabel: "", ctaUrl: "", position: 4, ...data.promo };
  const setPromo = (patch: Partial<typeof promo>) => onChange({ ...data, promo: { ...promo, ...patch } });
  const move = (index: number, delta: number) => {
    const next = [...picked];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange({ ...data, productIds: next });
  };
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextareaField label="Description (optional)" value={data.description ?? ""} onChange={(description) => onChange({ ...data, description })} dir={dir} rows={2} />
      <SelectField
        label="Products to show"
        value={mode}
        onChange={(v) => onChange({ ...data, mode: v as typeof mode })}
        options={[
          { value: "latest", label: "Automatic — latest products" },
          { value: "featured", label: "Featured products" },
          { value: "category", label: "From one category" },
          { value: "manual", label: "Manual — pick products" },
        ]}
      />
      {mode !== "manual" ? (
        <SelectField
          label={mode === "category" ? "Category" : "Limit to category (optional)"}
          value={data.categoryId ?? ""}
          onChange={(categoryId) => onChange({ ...data, categoryId })}
          options={[{ value: "", label: mode === "category" ? "Choose a category..." : "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.label }))]}
        />
      ) : (
        <div>
          <p className="mb-1 text-xs text-neutral-400">Selected products (shown in this order)</p>
          {picked.length === 0 ? <p className="mb-2 text-xs text-amber-400">Nothing selected yet — the section stays hidden until you pick products.</p> : null}
          <ol className="mb-2 space-y-1">
            {picked.map((id, i) => (
              <li key={id} className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-xs text-neutral-300">
                <span className="min-w-0 flex-1 truncate">{products.find((p) => p.id === id)?.label ?? "(unavailable product)"}</span>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30" aria-label="Move up">↑</button>
                <button type="button" disabled={i === picked.length - 1} onClick={() => move(i, 1)} className="px-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30" aria-label="Move down">↓</button>
                <button type="button" onClick={() => onChange({ ...data, productIds: picked.filter((p) => p !== id) })} className="px-1 text-neutral-500 hover:text-red-400" aria-label="Remove">✕</button>
              </li>
            ))}
          </ol>
          <SelectField
            label="Add a product"
            value=""
            onChange={(id) => id && onChange({ ...data, productIds: [...picked, id] })}
            options={[{ value: "", label: "Choose..." }, ...products.filter((p) => !picked.includes(p.id)).map((p) => ({ value: p.id, label: p.label }))]}
          />
        </div>
      )}
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

      <div className="space-y-2 border-t border-neutral-800 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Category filter chips</p>
        <CheckboxField label={"Show \"All / category\" filter chips above the grid"} checked={data.showCategoryFilter ?? false} onChange={(showCategoryFilter) => onChange({ ...data, showCategoryFilter })} />
        {data.showCategoryFilter ? (
          <TextField label={"\"All\" chip label (optional)"} value={data.filterAllLabel ?? ""} onChange={(filterAllLabel) => onChange({ ...data, filterAllLabel })} dir={dir} placeholder={locale === "ar" ? "الكل" : "All"} />
        ) : null}
      </div>

      <div className="space-y-2 border-t border-neutral-800 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Promo card inside the grid</p>
        <CheckboxField label="Show a promo card" checked={promo.enabled} onChange={(enabled) => setPromo({ enabled })} />
        {promo.enabled ? (
          <>
            <TextField label="Eyebrow" value={promo.eyebrow} onChange={(eyebrow) => setPromo({ eyebrow })} dir={dir} />
            <TextField label="Title" value={promo.title} onChange={(title) => setPromo({ title })} dir={dir} />
            <TextareaField label="Text" value={promo.body} onChange={(body) => setPromo({ body })} dir={dir} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Button label" value={promo.ctaLabel} onChange={(ctaLabel) => setPromo({ ctaLabel })} dir={dir} />
              <TextField label="Button link" value={promo.ctaUrl} onChange={(ctaUrl) => setPromo({ ctaUrl })} placeholder="/contact" />
            </div>
            <NumberField label="Position in grid" value={promo.position} min={1} max={24} onChange={(position) => setPromo({ position })} />
          </>
        ) : null}
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
      Live Product Grid — {data.mode === "manual" ? `${data.productIds?.length ?? 0} hand-picked` : data.mode === "featured" ? "featured products" : data.categoryId ? "one category" : "latest products"}, up to {data.limit} items
      {data.showCategoryFilter ? ", with category filter chips" : ""}
      {data.promo?.enabled ? ", with a promo card" : ""}.
      <br />
      Renders on the published page with real product data.
    </div>
  );
}
