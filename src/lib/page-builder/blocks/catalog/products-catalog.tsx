"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { CheckboxField, NumberField, SelectField, TextField, TextareaField, styledProps } from "@/components/admin/ui/field";
import { FILTER_KEYS, type FilterKey } from "@/lib/catalog/products-listing-params";
import { useReferenceData } from "../../reference-data-context";
import type { BlockEditProps } from "../../types";
import type { ProductDetailsData, ProductRelatedData, ProductsCatalogData } from "../catalog-blocks";

const FILTER_LABELS: Record<FilterKey, string> = {
  search: "Search box · البحث",
  category: "Category · الفئة",
  brand: "Brand · العلامة",
  temperature: "Temperature · الحرارة",
  sort: "Sort · الترتيب",
  options: "Variant options (size…) · خيارات الأنواع",
};

const box = "space-y-2 rounded-md border border-neutral-700 p-3";
const boxTitle = "text-xs font-medium uppercase tracking-wide text-neutral-400";

/** Shown filters first (in order), hidden ones after -- each can be toggled and moved. */
function FiltersEditor({ value, onChange }: { value: FilterKey[]; onChange: (next: FilterKey[]) => void }) {
  const hidden = FILTER_KEYS.filter((k) => !value.includes(k));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const btn = "rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 disabled:opacity-30";
  return (
    <div className="space-y-1">
      {value.map((key, i) => (
        <div key={key} className="flex items-center gap-1 rounded bg-neutral-900 px-2 py-1">
          <CheckboxField label={FILTER_LABELS[key]} checked onChange={() => onChange(value.filter((k) => k !== key))} />
          <span className="flex-1" />
          <button type="button" className={btn} aria-label={`Move ${key} up`} disabled={i === 0} onClick={() => move(i, -1)}>
            <ArrowUp size={14} />
          </button>
          <button type="button" className={btn} aria-label={`Move ${key} down`} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
            <ArrowDown size={14} />
          </button>
        </div>
      ))}
      {hidden.map((key) => (
        <div key={key} className="flex items-center gap-1 px-2 py-1 opacity-70">
          <CheckboxField label={FILTER_LABELS[key]} checked={false} onChange={() => onChange([...value, key])} />
        </div>
      ))}
    </div>
  );
}

export function ProductsCatalogEdit({ data, onChange, locale }: BlockEditProps<ProductsCatalogData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { categories } = useReferenceData();
  const set = <K extends keyof ProductsCatalogData>(key: K) => (value: ProductsCatalogData[K]) => onChange({ ...data, [key]: value });
  const quote = { enabled: false, eyebrow: "", title: "", body: "", ctaLabel: "", ctaUrl: "/#quote-form", position: 4, ...data.quoteCard };
  const setQuote = (next: typeof quote) => onChange({ ...data, quoteCard: next });
  const num = (options: number[]) => options.map((n) => ({ value: String(n), label: String(n) }));

  return (
    <div className="space-y-3">
      <div className={box}>
        <p className={boxTitle}>Header · العنوان</p>
        <TextField label="Eyebrow" {...styledProps(data, "eyebrow", onChange)} dir={dir} />
        <TextField label="Title" {...styledProps(data, "title", onChange)} dir={dir} />
        <TextareaField label="Subtitle" rows={2} {...styledProps(data, "subtitle", onChange)} dir={dir} />
        <CheckboxField label="On a category (?category=…) show the category's own name, description and banner" checked={data.categoryHeader !== false} onChange={set("categoryHeader")} />
      </div>

      <div className={box}>
        <p className={boxTitle}>Grid · الشبكة</p>
        <div className="grid grid-cols-3 gap-2">
          <SelectField label="Desktop" value={String(data.columnsDesktop ?? 4)} onChange={(v) => set("columnsDesktop")(Number(v))} options={num([2, 3, 4, 5, 6])} />
          <SelectField label="Tablet" value={String(data.columnsTablet ?? 3)} onChange={(v) => set("columnsTablet")(Number(v))} options={num([2, 3, 4])} />
          <SelectField label="Mobile" value={String(data.columnsMobile ?? 2)} onChange={(v) => set("columnsMobile")(Number(v))} options={num([1, 2])} />
        </div>
        <NumberField label="Products per page" value={data.pageSize ?? 12} min={4} max={48} onChange={set("pageSize")} />
        <SelectField
          label="Paging"
          value={data.paging ?? "pages"}
          onChange={set("paging")}
          options={[
            { value: "pages", label: "Page numbers (as before)" },
            { value: "loadMore", label: "«Load more» button" },
          ]}
        />
        {data.paging === "loadMore" ? <TextField label="«Load more» label (empty = default)" {...styledProps(data, "loadMoreLabel", onChange)} dir={dir} /> : null}
        <SelectField
          label="Variant products"
          value={data.variantCards ?? "product"}
          onChange={set("variantCards")}
          options={[
            { value: "product", label: "One card per product (as before)" },
            { value: "variant", label: "One card per variant (when variants are on)" },
          ]}
        />
        <SelectField
          label="Default category (when the URL has none)"
          value={data.defaultCategory ?? ""}
          onChange={set("defaultCategory")}
          options={[{ value: "", label: "All products" }, ...categories.filter((c) => c.slug).map((c) => ({ value: c.slug!, label: c.label }))]}
        />
        <CheckboxField label="Show the results count" checked={data.showResultsCount !== false} onChange={set("showResultsCount")} />
      </div>

      <div className={box}>
        <p className={boxTitle}>Filters (shown, in order) · الفلاتر</p>
        <FiltersEditor value={data.filters ?? [...FILTER_KEYS]} onChange={set("filters")} />
      </div>

      <div className={box}>
        <p className={boxTitle}>Quote card in the grid · بطاقة طلب عرض السعر</p>
        <CheckboxField label="Show a quote card" checked={quote.enabled} onChange={(enabled) => setQuote({ ...quote, enabled })} />
        {quote.enabled ? (
          <>
            <TextField label="Eyebrow" {...styledProps(quote, "eyebrow", setQuote)} dir={dir} />
            <TextField label="Title" {...styledProps(quote, "title", setQuote)} dir={dir} />
            <TextareaField label="Text" rows={2} {...styledProps(quote, "body", setQuote)} dir={dir} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Button label" {...styledProps(quote, "ctaLabel", setQuote)} dir={dir} />
              <TextField label="Button link" value={quote.ctaUrl} onChange={(ctaUrl) => setQuote({ ...quote, ctaUrl })} placeholder="/#quote-form" />
            </div>
            <NumberField label="Position in the grid" value={quote.position} min={1} max={48} onChange={(position) => setQuote({ ...quote, position })} />
          </>
        ) : null}
      </div>

      <div className={box}>
        <p className={boxTitle}>Empty states (empty = default text)</p>
        <TextareaField label="No matching products" rows={2} {...styledProps(data, "emptyText", onChange)} dir={dir} />
        <TextareaField label="Empty category" rows={2} {...styledProps(data, "emptyCategoryText", onChange)} dir={dir} />
        <TextField label="Empty category button" {...styledProps(data, "emptyCategoryAction", onChange)} dir={dir} />
      </div>
    </div>
  );
}

const preview = "rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400";

export function ProductsCatalogPreview({ data }: { data: ProductsCatalogData }) {
  return (
    <div className={preview}>
      {data.title ? <p className="mb-1 font-medium text-neutral-200">{data.title}</p> : null}
      Live Products Catalog — filters ({(data.filters ?? []).join(", ") || "none"}), {data.columnsDesktop ?? 4}/{data.columnsTablet ?? 3}/{data.columnsMobile ?? 2} columns, {data.pageSize ?? 12} per {data.paging === "loadMore" ? "«load more»" : "page"}
      {data.quoteCard?.enabled ? ", with a quote card" : ""}.
      <br />
      Renders with real products on the page (use «Preview» to see it).
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the block has nothing to edit; the signature matches the registry
export function ProductDetailsEdit(_props: BlockEditProps<ProductDetailsData>) {
  return (
    <p className="text-sm text-neutral-400">
      The product&apos;s gallery, variant selector, specifications, «الأنواع المتاحة» and «اطلب عرض سعر». Filled from each product — edit the product itself in Admin → Products. This section is required and can&apos;t be removed; add sections above or below it.
    </p>
  );
}

export function ProductDetailsPreview() {
  return <div className={preview}>Product details — gallery, variant selector, specifications, variants table, quote button (filled from each product).</div>;
}

export function ProductRelatedEdit({ data, onChange, locale }: BlockEditProps<ProductRelatedData>) {
  return (
    <div className="space-y-3">
      <TextField label="Heading (empty = «منتجات ذات صلة» / “Related products”)" {...styledProps(data, "heading", onChange)} dir={locale === "ar" ? "rtl" : "ltr"} />
      <p className="text-xs text-neutral-500">The product&apos;s curated related products, else up to 4 from the same category. Hidden when there are none.</p>
    </div>
  );
}

export function ProductRelatedPreview({ data }: { data: ProductRelatedData }) {
  return <div className={preview}>{data.heading || "Related products"} — filled from each product.</div>;
}
