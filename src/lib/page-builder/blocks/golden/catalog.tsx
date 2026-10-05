"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CheckboxField, SelectField, TextField, TextareaField, styledProps } from "@/components/admin/ui/field";
import { useReferenceData } from "@/lib/page-builder/reference-data-context";
import { cn } from "@/lib/cn";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7BrandItem, G7BrandsData, G7CategoriesData, G7CategoryItem, G7ProductItem, G7ProductTab, G7ProductsData } from "./schema";
import type { G7Resolved } from "./resolve";
import { G7Arrow, G7ImageField, G7ListEditor, g7Eyebrow, g7GoldButton, g7H2, g7Href } from "./shared";

type LabelPosition = G7CategoriesData["labelPosition"];
/** Category-card label placement (start/end follow the reading direction). */
const LABEL_POSITION: Record<LabelPosition, { box: string; shade: string }> = {
  "bottom-start": { box: "bottom-0 start-0", shade: "bottom-0 bg-gradient-to-t" },
  "bottom-end": { box: "bottom-0 end-0 text-end", shade: "bottom-0 bg-gradient-to-t" },
  "top-start": { box: "top-0 start-0 pt-[clamp(1.25rem,2vw,2.4rem)]", shade: "top-0 bg-gradient-to-b" },
  "top-end": { box: "top-0 end-0 text-end pt-[clamp(1.25rem,2vw,2.4rem)]", shade: "top-0 bg-gradient-to-b" },
  center: { box: "inset-0 flex flex-col items-center justify-center text-center", shade: "inset-y-0 h-full bg-black/25" },
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";
const zoom = "transition-transform duration-700 ease-[var(--ease-premium)] motion-reduce:transition-none";

/** Catalog picker shared by the three catalog blocks' editors ("" = match automatically by name). */
function CatalogPicker({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={[{ value: "", label: "Automatic (match by name)" }, ...options.map((o) => ({ value: o.id, label: o.label }))]}
    />
  );
}

/* 03 -- Categories: one wide card on top (1670x550 on the artboard), the rest in an equal 3-up row
 * (540x550). RTL order follows item order. Each card opens the products list filtered to its
 * catalog category (resolve.ts). */
export function G7CategoriesRender({ data, locale }: BlockRenderProps<G7CategoriesData>) {
  const [first, ...rest] = (data.items ?? []) as G7Resolved<G7CategoryItem>[];
  return (
    <section className="bg-[var(--g7-teal-900)] pb-[clamp(3.5rem,6.8vw,8.1rem)] pt-[clamp(3.5rem,6.25vw,7.5rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className={cn(g7H2, "text-[var(--g7-cream-50)]")}><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
        <div className="mt-[clamp(2rem,4.7vw,5.6rem)] grid grid-cols-1 gap-[clamp(0.75rem,1.3vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-3">
          {first ? <CategoryCard item={first} locale={locale} linkLabel={data.linkLabel ?? ""} position={data.labelPosition} wide /> : null}
          {rest.map((item, i) => (
            <CategoryCard key={i} item={item} locale={locale} linkLabel={data.linkLabel ?? ""} position={data.labelPosition} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ item, locale, linkLabel, position, wide = false }: { item: G7Resolved<G7CategoryItem>; locale: string; linkLabel: string; position: LabelPosition; wide?: boolean }) {
  const pos = LABEL_POSITION[position] ?? LABEL_POSITION["bottom-start"];
  const title = item.resolvedTitle || item.title;
  return (
    <Link
      href={g7Href(item.href ?? item.url ?? "", locale)}
      data-g7-category-card
      className={cn(
        "group relative block overflow-hidden rounded-[12px] bg-[var(--g7-teal-800)]",
        focusRing,
        wide ? "aspect-[16/10] sm:col-span-2 sm:aspect-[1670/550] lg:col-span-3" : "aspect-[540/550]"
      )}
    >
      {item.image?.url ? (
        <Image
          src={item.image.url}
          alt={title ?? ""}
          fill
          sizes={wide ? "(min-width: 1920px) 1670px, 88vw" : "(min-width: 1024px) 29vw, (min-width: 640px) 45vw, 100vw"}
          className={cn("object-cover group-hover:scale-[1.05] motion-reduce:group-hover:scale-100", zoom)}
        />
      ) : null}
      <div aria-hidden="true" className={cn("absolute inset-x-0 h-1/2 from-black/55 to-transparent", pos.shade)} />
      <div className={cn("absolute px-[clamp(1.25rem,2.3vw,2.75rem)] pb-[clamp(1.25rem,2vw,2.4rem)] text-[var(--g7-cream-50)]", pos.box)}>
        <p className="t-h3">{title}</p>
        {linkLabel ? (
          <span className="t-small mt-[clamp(0.25rem,0.8vw,0.9rem)] inline-flex items-center gap-3 font-light group-hover:underline">
            {linkLabel}
            <G7Arrow size={14} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function G7CategoriesEdit({ data, onChange, locale }: BlockEditProps<G7CategoriesData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { categories } = useReferenceData();
  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <TextField label="Card link label" {...styledProps(data, "linkLabel", onChange)} dir={dir} />
      <SelectField
        label="Card text position"
        value={data.labelPosition}
        onChange={(labelPosition) => onChange({ ...data, labelPosition })}
        options={[
          { value: "bottom-start", label: "Bottom, start side (default)" },
          { value: "bottom-end", label: "Bottom, end side" },
          { value: "top-start", label: "Top, start side" },
          { value: "top-end", label: "Top, end side" },
          { value: "center", label: "Center" },
        ]}
      />
      <G7ListEditor<G7CategoryItem>
        label="Cards (first one is the wide card)"
        items={data.items ?? []}
        max={8}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ title: "", image: null, url: "/products", categoryId: "" })}
        itemLabel={(item) => item.title ?? ""}
        renderItem={(item, update) => (
          <>
            <CatalogPicker label="Catalog category (link + title)" value={item.categoryId ?? ""} options={categories} onChange={(categoryId) => update({ ...item, categoryId })} />
            <TextField label="Title (used when no category is linked)" {...styledProps(item, "title", update)} dir={dir} />
            <G7ImageField label="Image" value={item.image} onChange={(image) => update({ ...item, image })} />
            <TextField label="Custom link URL (optional)" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
    </div>
  );
}

const EMPTY_FALLBACK = {
  ar: "لا توجد منتجات في هذه الفئة حاليًا — اطلب عرض سعر وسنوفرها لك",
  en: "No products in this category yet — request a quote and we'll source it for you",
};

/* 04 -- Featured products: client-side tab filter, 3-up cards (525x740 on the artboard), quote card
 * in the slot after the last product. Every card links to its own product page (resolve.ts). */
export function G7ProductsRender({ data, locale, interactive }: BlockRenderProps<G7ProductsData>) {
  const [active, setActive] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const tabs = [
    { label: data.allLabel || (locale === "ar" ? "الكل" : "All"), value: null as string | null, rich: data.allLabel ? richOf(data, "allLabel") : undefined },
    ...(data.tabs ?? []).filter((t) => t.key && t.label).map((t) => ({ label: t.label ?? "", value: t.key as string | null, rich: richOf(t, "label") })),
  ];
  const items = ((data.items ?? []) as G7Resolved<G7ProductItem>[]).filter((item) => active === null || item.tab === active);
  const cta = data.cta;
  const emptyMessage = data.emptyMessage || EMPTY_FALLBACK[locale === "ar" ? "ar" : "en"];

  // Keep the active pill visible inside the horizontal strip (phones), on load and on change.
  useEffect(() => {
    const strip = stripRef.current;
    const pill = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !pill) return;
    const s = strip.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    if (p.left < s.left || p.right > s.right) strip.scrollBy({ left: p.left - s.left - (s.width - p.width) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,6.25vw,7.5rem)] pt-[clamp(3rem,3.6vw,4.4rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className={cn(g7H2, "text-[var(--g7-teal-900)]")}><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
        {tabs.length > 1 ? (
          // Phones: a snap-scrolling strip without a visible scrollbar, edges faded to hint at more.
          <div
            ref={stripRef}
            className="g7-tab-strip -mx-4 mt-[clamp(1.5rem,2.6vw,3.1rem)] snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:px-0"
            role="group"
            aria-label={locale === "ar" ? "تصفية المنتجات" : "Filter products"}
          >
            <div className="flex w-max items-center">
              {tabs.map((tab, i) => (
                <div key={tab.value ?? "__all"} className="flex snap-start items-center">
                  {i > 0 ? <span aria-hidden="true" className="mx-[clamp(0.5rem,2vw,2.4rem)] h-8 w-px bg-[var(--g7-gold-500)]/50 sm:h-[clamp(2.25rem,3.6vw,4.3rem)]" /> : null}
                  <button
                    type="button"
                    onClick={() => interactive && setActive(tab.value)}
                    aria-pressed={active === tab.value}
                    className={cn(
                      "t-p min-h-11 shrink-0 rounded-full px-[clamp(1.1rem,1.9vw,2.25rem)] transition-colors",
                      focusRing,
                      active === tab.value ? "bg-[var(--g7-gold-500)] font-medium text-[var(--g7-cream-50)]" : "text-[var(--g7-teal-900)] hover:text-[var(--g7-gold-600)]"
                    )}
                  >
                    <StyledText text={tab.label} rich={tab.rich} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p role="status" className="t-p mt-[clamp(1.5rem,2.4vw,2.9rem)] rounded-[12px] border border-[var(--g7-divider)] bg-[var(--g7-white)] px-5 py-4 text-[var(--g7-teal-900)]">
            {emptyMessage}
          </p>
        ) : null}

        <div className="mt-[clamp(2rem,3vw,3.6rem)] grid grid-cols-1 gap-x-[clamp(0.75rem,1.6vw,1.9rem)] gap-y-[clamp(1.25rem,5.4vw,6.5rem)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <ProductCard key={`$<StyledText text={item.name} rich={richOf(item, "name")} />-${i}`} item={item} locale={locale} linkLabel={data.linkLabel ?? ""} />
          ))}
          {cta?.enabled && (cta.title || cta.body) ? (
            <div className="flex min-h-[24rem] flex-col rounded-[12px] bg-[var(--g7-teal-900)] px-[clamp(1.5rem,2.6vw,3.1rem)] pb-[clamp(1.5rem,2.6vw,3.1rem)] pt-[clamp(1.75rem,3vw,3.6rem)] text-[var(--g7-cream-50)]">
              {cta.eyebrow ? <p className={g7Eyebrow}><StyledText text={cta.eyebrow} rich={richOf(cta, "eyebrow")} /></p> : null}
              {cta.title ? <h3 className="t-h3 mt-[clamp(1.25rem,3vw,3.6rem)]"><StyledText text={cta.title} rich={richOf(cta, "title")} /></h3> : null}
              {cta.body ? <p className="t-p mt-[clamp(1.25rem,3vw,3.6rem)] max-w-[22rem] font-light text-[var(--g7-cream-50)]/90"><StyledText text={cta.body} rich={richOf(cta, "body")} /></p> : null}
              {cta.buttonLabel ? (
                <Link href={g7Href(cta.buttonUrl ?? "", locale)} data-g7-quote-link className={cn(g7GoldButton, "mt-auto w-full min-h-[clamp(3rem,3.55vw,4.25rem)]")}>
                  <StyledText text={cta.buttonLabel} rich={richOf(cta, "buttonLabel")} />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ item, locale, linkLabel }: { item: G7Resolved<G7ProductItem>; locale: string; linkLabel: string }) {
  return (
    <Link
      href={g7Href(item.href ?? item.url ?? "", locale)}
      data-g7-product-card
      className={cn("group flex flex-col overflow-hidden rounded-[12px] bg-[var(--g7-teal-900)] text-[var(--g7-cream-50)]", focusRing)}
    >
      <div className="relative aspect-[525/472] overflow-hidden bg-[var(--g7-teal-800)]">
        {item.image?.url ? (
          <Image
            src={item.image.url}
            alt={item.name ?? ""}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
            className={cn("object-cover group-hover:scale-[1.04] motion-reduce:group-hover:scale-100", zoom)}
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-[clamp(1.25rem,1.5vw,1.75rem)] pb-[clamp(1.25rem,1.6vw,1.9rem)] pt-[clamp(1rem,1.4vw,1.6rem)]">
        {item.categoryLabel ? <p className="t-small font-light text-[var(--g7-cream-50)]/80"><StyledText text={item.categoryLabel} rich={richOf(item, "categoryLabel")} /></p> : null}
        <p className="t-product mt-[clamp(0.4rem,0.9vw,1.1rem)] font-medium"><StyledText text={item.name} rich={richOf(item, "name")} /></p>
        {item.variantSummary ? <p data-variant-summary className="t-small mt-1 font-light text-[var(--g7-cream-50)]/80">{item.variantSummary}</p> : null}
        <div className="mt-[clamp(1rem,1.8vw,2.1rem)] flex items-center justify-between gap-3 border-t border-[var(--g7-cream-50)]/25 pt-[clamp(0.75rem,1.2vw,1.4rem)]">
          <span className="t-small font-light"><StyledText text={item.weight} rich={richOf(item, "weight")} /></span>
          {item.badge ? <span className="rounded-[6px] bg-[var(--g7-gold-500)] px-[clamp(0.75rem,1.1vw,1.3rem)] py-0.5 text-sm font-bold text-[var(--g7-cream-50)]"><StyledText text={item.badge} rich={richOf(item, "badge")} /></span> : null}
        </div>
        {linkLabel ? (
          <span className="t-ui mt-[clamp(1rem,1.9vw,2.2rem)] inline-flex items-center gap-[clamp(0.75rem,1.6vw,1.9rem)] font-light group-hover:text-[var(--g7-gold-500)]">
            {linkLabel}
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-current">
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function G7ProductsEdit({ data, onChange, locale }: BlockEditProps<G7ProductsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { products } = useReferenceData();
  const cta = data.cta;
  const tabOptions = (data.tabs ?? []).map((t) => t.key).filter(Boolean);
  return (
    <div className="space-y-4">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label='"All" tab label' {...styledProps(data, "allLabel", onChange)} dir={dir} />
        <TextField label="Card link label" {...styledProps(data, "linkLabel", onChange)} dir={dir} />
      </div>
      <TextareaField label="Empty filter message" rows={2} {...styledProps(data, "emptyMessage", onChange)} dir={dir} />
      <G7ListEditor<G7ProductTab>
        label="Filter tabs"
        items={data.tabs ?? []}
        max={8}
        onChange={(tabs) => onChange({ ...data, tabs })}
        createItem={() => ({ key: `tab-${Date.now().toString(36)}`, label: "" })}
        itemLabel={(tab) => tab.label ?? tab.key}
        renderItem={(tab, update) => (
          <>
            <TextField label="Label" {...styledProps(tab, "label", update)} dir={dir} />
            <TextField label="Key (products use this)" value={tab.key} onChange={(key) => update({ ...tab, key: key.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} />
          </>
        )}
      />
      <G7ListEditor<G7ProductItem>
        label="Products"
        items={data.items ?? []}
        max={24}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ image: null, name: "", categoryLabel: "", weight: "", badge: "", tab: "", url: "/products", productId: "" })}
        itemLabel={(item) => item.name ?? ""}
        renderItem={(item, update) => (
          <>
            <CatalogPicker label="Catalog product (card links to its page)" value={item.productId ?? ""} options={products} onChange={(productId) => update({ ...item, productId })} />
            <G7ImageField label="Image" value={item.image} onChange={(image) => update({ ...item, image })} />
            <TextField label="Name" {...styledProps(item, "name", update)} dir={dir} />
            <TextField label="Category label" {...styledProps(item, "categoryLabel", update)} dir={dir} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Weight" {...styledProps(item, "weight", update)} dir={dir} />
              <TextField label="Badge" {...styledProps(item, "badge", update)} dir={dir} />
            </div>
            <TextField label={`Tab key (${tabOptions.join(", ") || "none"})`} value={item.tab ?? ""} onChange={(tab) => update({ ...item, tab })} />
            <TextField label="Custom link URL (optional)" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
      <div className="space-y-3 rounded-md border border-neutral-700 p-3">
        <CheckboxField label="Show quote card" checked={cta.enabled} onChange={(enabled) => onChange({ ...data, cta: { ...cta, enabled } })} />
        <TextField label="Eyebrow" {...styledProps(cta, "eyebrow", (next) => onChange({ ...data, cta: next }))} dir={dir} />
        <TextField label="Title" {...styledProps(cta, "title", (next) => onChange({ ...data, cta: next }))} dir={dir} />
        <TextareaField label="Text" rows={3} {...styledProps(cta, "body", (next) => onChange({ ...data, cta: next }))} dir={dir} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Button" {...styledProps(cta, "buttonLabel", (next) => onChange({ ...data, cta: next }))} dir={dir} />
          <TextField label="Button URL" value={cta.buttonUrl ?? ""} onChange={(buttonUrl) => onChange({ ...data, cta: { ...cta, buttonUrl } })} />
        </div>
      </div>
    </div>
  );
}

/* 05 -- Brands: white bordered cards (812x295 on the artboard), logo centered. The product count is
 * computed from the catalog (resolve.ts); the typed count is only a fallback. */
export function G7BrandsRender({ data, locale }: BlockRenderProps<G7BrandsData>) {
  const items = (data.items ?? []) as G7Resolved<G7BrandItem>[];
  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,4.5vw,5.4rem)] pt-[clamp(2rem,4vw,4.8rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className={cn(g7H2, "text-[var(--g7-teal-900)]")}><StyledText text={data.heading} rich={richOf(data, "heading")} /></h2> : null}
        <div className={cn("mt-[clamp(1.75rem,3.1vw,3.75rem)] grid grid-cols-1 gap-[clamp(1rem,2vw,2.4rem)]", items.length > 1 && "sm:grid-cols-2", items.length > 2 && "lg:grid-cols-3")}>
          {items.map((item, i) => (
            <Link
              key={i}
              href={g7Href(item.href ?? item.url ?? "", locale)}
              className={cn(
                "group flex flex-col items-center rounded-[12px] border border-[var(--g7-divider)] bg-[var(--g7-white)] px-6 pb-[clamp(1rem,1.1vw,1.3rem)] pt-[clamp(1rem,1.25vw,1.5rem)] text-center transition-colors hover:border-[var(--g7-gold-500)]",
                focusRing
              )}
            >
              <div className="relative h-[clamp(6rem,8vw,9.6rem)] w-[clamp(10rem,12.5vw,15rem)]">
                {item.logo?.url ? <Image src={item.logo.url} alt={item.name ?? ""} fill sizes="240px" className="object-contain" /> : null}
              </div>
              <p className="t-product mt-[clamp(0.5rem,0.6vw,0.75rem)] text-[var(--g7-teal-900)]"><StyledText text={item.name} rich={richOf(item, "name")} /></p>
              {item.countLabel || item.count ? <p className="t-small mt-1 font-light text-[var(--g7-muted)]">{item.countLabel || item.count}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function G7BrandsEdit({ data, onChange, locale }: BlockEditProps<G7BrandsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { brands } = useReferenceData();
  return (
    <div className="space-y-3">
      <TextField label="Heading" {...styledProps(data, "heading", onChange)} dir={dir} />
      <G7ListEditor<G7BrandItem>
        label="Brands"
        items={data.items ?? []}
        max={8}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ logo: null, name: "", count: "", url: "/brands", brandId: "" })}
        itemLabel={(item) => item.name ?? ""}
        renderItem={(item, update) => (
          <>
            <CatalogPicker label="Catalog brand (link + product count)" value={item.brandId ?? ""} options={brands} onChange={(brandId) => update({ ...item, brandId })} />
            <G7ImageField label="Logo" value={item.logo} onChange={(logo) => update({ ...item, logo })} />
            <TextField label="Name" {...styledProps(item, "name", update)} dir={dir} />
            <TextField label="Count text (only if no catalog brand matches)" {...styledProps(item, "count", update)} dir={dir} />
            <TextField label="Custom link URL (optional)" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
    </div>
  );
}
