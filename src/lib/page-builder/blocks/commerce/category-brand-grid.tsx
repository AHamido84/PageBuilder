"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import { TextField, TextareaField, SelectField, NumberField, styledProps } from "@/components/admin/ui/field";
import { CheckboxField } from "@/components/admin/ui/field";
import { useReferenceData, type ReferenceOption } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

function featuredCount(categories: { isFeatured: boolean }[]): number {
  return categories.filter((c) => c.isFeatured).length;
}

/** Manual-selection reorder list, shared shape for both Category Grid and Brand Grid below --
 * `categoryIds`/`brandIds`' own array order IS the display order (see loadManualCategories in
 * category-brand-grid-render.tsx), so this is the only place that order can actually be set. */
function OrderedSelectionList({ ids, options, onChange }: { ids: string[]; options: ReferenceOption[]; onChange: (next: string[]) => void }) {
  if (ids.length === 0) return null;
  const move = (index: number, dir: -1 | 1) => {
    const next = [...ids];
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onChange(next);
  };
  return (
    <div className="space-y-1">
      <label className="mb-1 block text-xs text-neutral-400">Display order</label>
      {ids.map((id, i) => {
        const label = options.find((o) => o.id === id)?.label ?? id;
        return (
          <div key={id} className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/50 px-2 py-1 text-sm text-neutral-300">
            <span className="flex-1 truncate">{label}</span>
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 hover:bg-neutral-800 disabled:opacity-25" aria-label="Move up">
              <ChevronUp size={14} />
            </button>
            <button type="button" disabled={i === ids.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 hover:bg-neutral-800 disabled:opacity-25" aria-label="Move down">
              <ChevronDown size={14} />
            </button>
            <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="rounded p-0.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300" aria-label="Remove">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryGridEdit({ data, onChange, locale }: BlockEditProps<CategoryGridData>) {
  const { categories } = useReferenceData();
  const selected = new Set(data.categoryIds ?? []);
  const mode = data.mode ?? "dynamic";
  const layout = data.layout ?? "bento";
  const featured = featuredCount(categories);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <TextareaField label="Description (optional)" {...styledProps(data, "description", onChange)} dir={dir} rows={2} />

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Category source</label>
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`category-grid-mode-${locale}`}
              checked={mode === "dynamic"}
              onChange={() => onChange({ ...data, mode: "dynamic" })}
              className="mt-0.5"
            />
            <span>
              Dynamic — categories marked Featured
              <span className="block text-xs text-neutral-500">Managed from Category Management. Updates automatically as Featured status/order change.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`category-grid-mode-${locale}`}
              checked={mode === "manual"}
              onChange={() => onChange({ ...data, mode: "manual" })}
              className="mt-0.5"
            />
            <span>
              Manual — hand-pick categories for this section
              <span className="block text-xs text-neutral-500">Leave all unchecked to show every active category.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`category-grid-mode-${locale}`}
              checked={mode === "all"}
              onChange={() => onChange({ ...data, mode: "all" })}
              className="mt-0.5"
            />
            <span>
              All — every active top-level category
              <span className="block text-xs text-neutral-500">Automatic, in Category Management order. Use the limit to cap it.</span>
            </span>
          </label>
        </div>
      </div>

      {mode === "dynamic" || mode === "all" ? (
        <div className="space-y-2">
          <TextField
            label="Number displayed (optional)"
            value={data.limit != null ? String(data.limit) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
              onChange({ ...data, limit: n });
            }}
          />
          {mode === "all" ? (
            <p className="text-xs text-neutral-500">Shows every active item automatically{data.limit ? `, up to ${data.limit}` : ""}.</p>
          ) : featured === 0 ? (
            <p className="rounded-md border border-amber-900/50 bg-amber-950/30 px-2 py-1.5 text-xs text-amber-400">
              No categories are currently marked Featured yet — this section won&apos;t show anything on the live site until you mark some as Featured in Category
              Management.
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              {featured} categor{featured === 1 ? "y" : "ies"} currently marked Featured{data.limit ? `, showing up to ${data.limit}` : ""}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <CheckboxField
                  label={c.label}
                  checked={selected.has(c.id)}
                  onChange={(checked) => {
                    const current = data.categoryIds ?? [];
                    const next = checked ? [...current, c.id] : current.filter((id) => id !== c.id);
                    onChange({ ...data, categoryIds: next });
                  }}
                />
                {c.isFeatured ? <span className="shrink-0 rounded-full bg-wheat/20 px-2 py-0.5 text-[10px] font-medium text-wheat">Featured</span> : null}
              </div>
            ))}
          </div>
          <OrderedSelectionList ids={data.categoryIds ?? []} options={categories} onChange={(categoryIds) => onChange({ ...data, categoryIds })} />
          <TextField
            label="Number displayed (optional cap)"
            value={data.limit != null ? String(data.limit) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
              onChange({ ...data, limit: n });
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-neutral-800 pt-3">
        <SelectField
          label="Layout"
          value={layout}
          onChange={(v) => onChange({ ...data, layout: v })}
          options={[
            { value: "bento", label: "Bento (featured hero + grid)" },
            { value: "grid", label: "Uniform grid" },
            { value: "chips", label: "Chips (compact links, no images)" },
          ]}
        />
        <NumberField label="Grid columns (desktop)" value={data.columns ?? 4} min={2} max={6} onChange={(columns) => onChange({ ...data, columns })} />
      </div>

      <div className="space-y-1.5 border-t border-neutral-800 pt-3">
        <CheckboxField label="Show product count" checked={data.showProductCount ?? false} onChange={(showProductCount) => onChange({ ...data, showProductCount })} />
        <CheckboxField label="Show description on cards" checked={data.showDescription ?? false} onChange={(showDescription) => onChange({ ...data, showDescription })} />
        <CheckboxField label="Show CTA" checked={data.showCta ?? true} onChange={(showCta) => onChange({ ...data, showCta })} />
        {data.showCta ? (
          <TextField label="CTA label (optional)" value={data.ctaLabel ?? ""} onChange={(ctaLabel) => onChange({ ...data, ctaLabel })} dir={dir} placeholder="Shop now" />
        ) : null}
      </div>
    </div>
  );
}

export function CategoryGridPreview({ data }: { data: CategoryGridData }) {
  const { categories } = useReferenceData();
  const mode = data.mode ?? "dynamic";
  const featured = featuredCount(categories);
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      {mode === "dynamic" ? (
        featured === 0 ? (
          <span className="text-amber-400">No featured categories selected yet.</span>
        ) : (
          <>
            Live Category Grid — {featured} featured categor{featured === 1 ? "y" : "ies"}
            {data.limit ? `, up to ${data.limit}` : ""}.
          </>
        )
      ) : (
        <>Live Category Grid — {mode === "all" || !data.categoryIds?.length ? "all categories" : `${data.categoryIds.length} selected`}.</>
      )}
    </div>
  );
}

export function BrandGridEdit({ data, onChange, locale }: BlockEditProps<BrandGridData>) {
  const { brands } = useReferenceData();
  const selected = new Set(data.brandIds ?? []);
  const mode = data.mode ?? "dynamic";
  const featured = brands.filter((b) => b.isFeatured).length;

  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={locale === "ar" ? "rtl" : "ltr"} />

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Brand source</label>
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`brand-grid-mode-${locale}`}
              checked={mode === "dynamic"}
              onChange={() => onChange({ ...data, mode: "dynamic" })}
              className="mt-0.5"
            />
            <span>
              Dynamic — brands marked Featured
              <span className="block text-xs text-neutral-500">Managed from Brand Management. Updates automatically as Featured status/order change.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`brand-grid-mode-${locale}`}
              checked={mode === "manual"}
              onChange={() => onChange({ ...data, mode: "manual" })}
              className="mt-0.5"
            />
            <span>
              Manual — hand-pick brands for this section
              <span className="block text-xs text-neutral-500">Leave all unchecked to show every active brand.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name={`brand-grid-mode-${locale}`}
              checked={mode === "all"}
              onChange={() => onChange({ ...data, mode: "all" })}
              className="mt-0.5"
            />
            <span>
              All — every active brand
              <span className="block text-xs text-neutral-500">Automatic, in Brand Management order. Use the limit to cap it.</span>
            </span>
          </label>
        </div>
      </div>

      {mode === "dynamic" || mode === "all" ? (
        <div className="space-y-2">
          <TextField
            label="Limit (optional)"
            value={data.limit != null ? String(data.limit) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
              onChange({ ...data, limit: n });
            }}
          />
          {mode === "all" ? (
            <p className="text-xs text-neutral-500">Shows every active item automatically{data.limit ? `, up to ${data.limit}` : ""}.</p>
          ) : featured === 0 ? (
            <p className="rounded-md border border-amber-900/50 bg-amber-950/30 px-2 py-1.5 text-xs text-amber-400">
              No brands are currently marked Featured yet — this section won&apos;t show anything on the live site until you mark some as Featured in Brand
              Management.
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              {featured} brand{featured === 1 ? "" : "s"} currently marked Featured{data.limit ? `, showing up to ${data.limit}` : ""}.
            </p>
          )}
        </div>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2">
              <CheckboxField
                label={b.label}
                checked={selected.has(b.id)}
                onChange={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(b.id);
                  else next.delete(b.id);
                  onChange({ ...data, brandIds: Array.from(next) });
                }}
              />
              {!b.hasLogo ? (
                <span className="shrink-0 rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-medium text-amber-400">No logo</span>
              ) : !b.isActive ? (
                <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">Inactive</span>
              ) : b.isFeatured ? (
                <span className="shrink-0 rounded-full bg-wheat/20 px-2 py-0.5 text-[10px] font-medium text-wheat">Featured</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 border-t border-neutral-800 pt-3">
        <CheckboxField
          label="Show description on cards"
          checked={data.showDescription ?? true}
          onChange={(showDescription) => onChange({ ...data, showDescription })}
        />
        <p className="text-xs text-neutral-500">Each brand&apos;s own description is used, when it has one set in Brand Management. A brand&apos;s website link (if set) makes its whole card clickable.</p>
      </div>
    </div>
  );
}

export function BrandGridPreview({ data }: { data: BrandGridData }) {
  const { brands } = useReferenceData();
  const mode = data.mode ?? "dynamic";
  const featured = brands.filter((b) => b.isFeatured).length;
  return (
    <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
      {data.heading ? <p className="mb-1 font-medium text-neutral-200">{data.heading}</p> : null}
      {mode === "dynamic" ? (
        featured === 0 ? (
          <span className="text-amber-400">No featured brands selected yet.</span>
        ) : (
          <>
            Live Brand Grid — {featured} featured brand{featured === 1 ? "" : "s"}
            {data.limit ? `, up to ${data.limit}` : ""}.
          </>
        )
      ) : (
        <>Live Brand Grid — {mode === "all" || !data.brandIds?.length ? "all brands" : `${data.brandIds.length} selected`}.</>
      )}
    </div>
  );
}
