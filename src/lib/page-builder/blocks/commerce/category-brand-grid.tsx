"use client";

import { TextField } from "@/components/admin/ui/field";
import { CheckboxField } from "@/components/admin/ui/field";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { CategoryGridData, BrandGridData } from "../commerce-blocks";

function featuredCount(categories: { isFeatured: boolean }[]): number {
  return categories.filter((c) => c.isFeatured).length;
}

export function CategoryGridEdit({ data, onChange, locale }: BlockEditProps<CategoryGridData>) {
  const { categories } = useReferenceData();
  const selected = new Set(data.categoryIds ?? []);
  const mode = data.mode ?? "dynamic";
  const featured = featuredCount(categories);

  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />

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
        </div>
      </div>

      {mode === "dynamic" ? (
        <div className="space-y-2">
          <TextField
            label="Limit (optional)"
            value={data.limit != null ? String(data.limit) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
              onChange({ ...data, limit: n });
            }}
          />
          {featured === 0 ? (
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
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <CheckboxField
                label={c.label}
                checked={selected.has(c.id)}
                onChange={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(c.id);
                  else next.delete(c.id);
                  onChange({ ...data, categoryIds: Array.from(next) });
                }}
              />
              {c.isFeatured ? <span className="shrink-0 rounded-full bg-wheat/20 px-2 py-0.5 text-[10px] font-medium text-wheat">Featured</span> : null}
            </div>
          ))}
        </div>
      )}
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
        <>Live Category Grid — {data.categoryIds?.length ? `${data.categoryIds.length} selected` : "all categories"}.</>
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
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={locale === "ar" ? "rtl" : "ltr"} />

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
        </div>
      </div>

      {mode === "dynamic" ? (
        <div className="space-y-2">
          <TextField
            label="Limit (optional)"
            value={data.limit != null ? String(data.limit) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? undefined : Math.max(1, Math.min(24, Number(v) || 1));
              onChange({ ...data, limit: n });
            }}
          />
          {featured === 0 ? (
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
        <>Live Brand Grid — {data.brandIds?.length ? `${data.brandIds.length} selected` : "all brands"}.</>
      )}
    </div>
  );
}
