"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CheckboxField, TextField, TextareaField } from "@/components/admin/ui/field";
import { cn } from "@/lib/cn";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { G7BrandItem, G7BrandsData, G7CategoriesData, G7CategoryItem, G7ProductItem, G7ProductTab, G7ProductsData } from "./schema";
import { G7Arrow, G7ImageField, G7ListEditor, g7Eyebrow, g7GoldButton, g7H2, g7Href } from "./shared";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)]";
const zoom = "transition-transform duration-700 ease-[var(--ease-premium)] motion-reduce:transition-none";

/* 03 -- Categories: one wide card on top (1670x550 on the artboard), the rest in an equal 3-up row
 * (540x550). RTL order follows item order. */
export function G7CategoriesRender({ data, locale }: BlockRenderProps<G7CategoriesData>) {
  const [first, ...rest] = data.items ?? [];
  return (
    <section className="bg-[var(--g7-teal-900)] pb-[clamp(3.5rem,6.8vw,8.1rem)] pt-[clamp(3.5rem,6.25vw,7.5rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className={cn(g7H2, "text-[var(--g7-cream-50)]")}>{data.heading}</h2> : null}
        <div className="mt-[clamp(2rem,4.7vw,5.6rem)] grid grid-cols-1 gap-[clamp(0.75rem,1.3vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-3">
          {first ? <CategoryCard item={first} locale={locale} linkLabel={data.linkLabel ?? ""} wide /> : null}
          {rest.map((item, i) => (
            <CategoryCard key={i} item={item} locale={locale} linkLabel={data.linkLabel ?? ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ item, locale, linkLabel, wide = false }: { item: G7CategoryItem; locale: string; linkLabel: string; wide?: boolean }) {
  return (
    <Link
      href={g7Href(item.url ?? "", locale)}
      className={cn(
        "group relative block overflow-hidden rounded-[12px] bg-[var(--g7-teal-800)]",
        focusRing,
        wide ? "aspect-[16/10] sm:col-span-2 sm:aspect-[1670/550] lg:col-span-3" : "aspect-[540/550]"
      )}
    >
      {item.image?.url ? (
        <Image
          src={item.image.url}
          alt={item.title ?? ""}
          fill
          sizes={wide ? "(min-width: 1920px) 1670px, 88vw" : "(min-width: 1024px) 29vw, (min-width: 640px) 45vw, 100vw"}
          className={cn("object-cover group-hover:scale-[1.05] motion-reduce:group-hover:scale-100", zoom)}
        />
      ) : null}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-0 start-0 px-[clamp(1.25rem,2.3vw,2.75rem)] pb-[clamp(1.25rem,2vw,2.4rem)] text-[var(--g7-cream-50)]">
        <p className="g7-t30 font-bold leading-tight">{item.title}</p>
        {linkLabel ? (
          <span className="g7-t22 mt-[clamp(0.25rem,0.8vw,0.9rem)] inline-flex items-center gap-3 font-light group-hover:underline">
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
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <TextField label="Card link label" value={data.linkLabel ?? ""} onChange={(linkLabel) => onChange({ ...data, linkLabel })} dir={dir} />
      <G7ListEditor<G7CategoryItem>
        label="Cards (first one is the wide card)"
        items={data.items ?? []}
        max={8}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ title: "", image: null, url: "/products" })}
        itemLabel={(item) => item.title ?? ""}
        renderItem={(item, update) => (
          <>
            <TextField label="Title" value={item.title ?? ""} onChange={(title) => update({ ...item, title })} dir={dir} />
            <G7ImageField label="Image" value={item.image} onChange={(image) => update({ ...item, image })} />
            <TextField label="Link URL" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
    </div>
  );
}

/* 04 -- Featured products: client-side tab filter, 3-up cards (525x740 on the artboard), quote card
 * in the slot after the last product. */
export function G7ProductsRender({ data, locale, interactive }: BlockRenderProps<G7ProductsData>) {
  const [active, setActive] = useState<string | null>(null);
  const tabs = [
    { label: data.allLabel || (locale === "ar" ? "الكل" : "All"), value: null as string | null },
    ...(data.tabs ?? []).filter((t) => t.key && t.label).map((t) => ({ label: t.label ?? "", value: t.key as string | null })),
  ];
  const items = (data.items ?? []).filter((item) => active === null || item.tab === active);
  const cta = data.cta;

  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,6.25vw,7.5rem)] pt-[clamp(3rem,3.6vw,4.4rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className={cn(g7H2, "text-[var(--g7-teal-900)]")}>{data.heading}</h2> : null}
        {tabs.length > 1 ? (
          <div className="-mx-4 mt-[clamp(1.5rem,2.6vw,3.1rem)] overflow-x-auto px-4" role="group" aria-label={locale === "ar" ? "تصفية المنتجات" : "Filter products"}>
            <div className="flex w-max items-center">
              {tabs.map((tab, i) => (
                <div key={tab.value ?? "__all"} className="flex items-center">
                  {i > 0 ? <span aria-hidden="true" className="mx-[clamp(0.75rem,2vw,2.4rem)] h-[clamp(2.25rem,3.6vw,4.3rem)] w-px bg-[var(--g7-gold-500)]/50" /> : null}
                  <button
                    type="button"
                    onClick={() => interactive && setActive(tab.value)}
                    aria-pressed={active === tab.value}
                    className={cn(
                      "g7-t28 shrink-0 rounded-full px-[clamp(1.25rem,1.9vw,2.25rem)] py-[clamp(0.35rem,0.55vw,0.65rem)] transition-colors",
                      focusRing,
                      active === tab.value ? "bg-[var(--g7-gold-500)] font-medium text-[var(--g7-cream-50)]" : "text-[var(--g7-teal-900)] hover:text-[var(--g7-gold-600)]"
                    )}
                  >
                    {tab.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-[clamp(2rem,3vw,3.6rem)] grid grid-cols-1 gap-x-[clamp(0.75rem,1.6vw,1.9rem)] gap-y-[clamp(1.25rem,5.4vw,6.5rem)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <ProductCard key={`${item.name}-${i}`} item={item} locale={locale} linkLabel={data.linkLabel ?? ""} />
          ))}
          {cta?.enabled && (cta.title || cta.body) ? (
            <div className="flex min-h-[24rem] flex-col rounded-[12px] bg-[var(--g7-teal-900)] px-[clamp(1.5rem,2.6vw,3.1rem)] pb-[clamp(1.5rem,2.6vw,3.1rem)] pt-[clamp(1.75rem,3vw,3.6rem)] text-[var(--g7-cream-50)]">
              {cta.eyebrow ? <p className={cn(g7Eyebrow, "g7-t22")}>{cta.eyebrow}</p> : null}
              {cta.title ? <h3 className="g7-h3 mt-[clamp(1.25rem,3vw,3.6rem)]">{cta.title}</h3> : null}
              {cta.body ? <p className="g7-t30 g7-body mt-[clamp(1.25rem,4.4vw,5.3rem)] max-w-[22rem] font-light text-[var(--g7-cream-50)]/90">{cta.body}</p> : null}
              {cta.buttonLabel ? (
                <Link href={g7Href(cta.buttonUrl ?? "", locale)} className={cn(g7GoldButton, "mt-auto w-full min-h-[clamp(3rem,3.55vw,4.25rem)]")}>
                  {cta.buttonLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ item, locale, linkLabel }: { item: G7ProductItem; locale: string; linkLabel: string }) {
  return (
    <Link href={g7Href(item.url ?? "", locale)} className={cn("group flex flex-col overflow-hidden rounded-[12px] bg-[var(--g7-teal-900)] text-[var(--g7-cream-50)]", focusRing)}>
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
        {item.categoryLabel ? <p className="g7-t18 font-light text-[var(--g7-cream-50)]/80">{item.categoryLabel}</p> : null}
        <p className="g7-t28 mt-[clamp(0.4rem,0.9vw,1.1rem)] font-normal leading-snug">{item.name}</p>
        <div className="mt-[clamp(1rem,1.8vw,2.1rem)] flex items-center justify-between gap-3 border-t border-[var(--g7-cream-50)]/25 pt-[clamp(0.75rem,1.2vw,1.4rem)]">
          <span className="g7-t22 font-light">{item.weight}</span>
          {item.badge ? <span className="g7-t14 rounded-[6px] bg-[var(--g7-gold-500)] px-[clamp(0.75rem,1.1vw,1.3rem)] py-0.5 font-bold text-[var(--g7-cream-50)]">{item.badge}</span> : null}
        </div>
        {linkLabel ? (
          <span className="g7-t22 mt-[clamp(1rem,1.9vw,2.2rem)] inline-flex items-center gap-[clamp(0.75rem,1.6vw,1.9rem)] font-light group-hover:text-[var(--g7-gold-500)]">
            {linkLabel}
            <span aria-hidden="true" className="flex h-[clamp(1.25rem,1.25vw,1.5rem)] w-[clamp(1.25rem,1.25vw,1.5rem)] items-center justify-center rounded-full border border-current">
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
  const cta = data.cta;
  const tabOptions = (data.tabs ?? []).map((t) => t.key).filter(Boolean);
  return (
    <div className="space-y-4">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label='"All" tab label' value={data.allLabel ?? ""} onChange={(allLabel) => onChange({ ...data, allLabel })} dir={dir} />
        <TextField label="Card link label" value={data.linkLabel ?? ""} onChange={(linkLabel) => onChange({ ...data, linkLabel })} dir={dir} />
      </div>
      <G7ListEditor<G7ProductTab>
        label="Filter tabs"
        items={data.tabs ?? []}
        max={8}
        onChange={(tabs) => onChange({ ...data, tabs })}
        createItem={() => ({ key: `tab-${Date.now().toString(36)}`, label: "" })}
        itemLabel={(tab) => tab.label ?? tab.key}
        renderItem={(tab, update) => (
          <>
            <TextField label="Label" value={tab.label ?? ""} onChange={(label) => update({ ...tab, label })} dir={dir} />
            <TextField label="Key (products use this)" value={tab.key} onChange={(key) => update({ ...tab, key: key.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} />
          </>
        )}
      />
      <G7ListEditor<G7ProductItem>
        label="Products"
        items={data.items ?? []}
        max={24}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ image: null, name: "", categoryLabel: "", weight: "", badge: "", tab: "", url: "/products" })}
        itemLabel={(item) => item.name ?? ""}
        renderItem={(item, update) => (
          <>
            <G7ImageField label="Image" value={item.image} onChange={(image) => update({ ...item, image })} />
            <TextField label="Name" value={item.name ?? ""} onChange={(name) => update({ ...item, name })} dir={dir} />
            <TextField label="Category label" value={item.categoryLabel ?? ""} onChange={(categoryLabel) => update({ ...item, categoryLabel })} dir={dir} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Weight" value={item.weight ?? ""} onChange={(weight) => update({ ...item, weight })} dir={dir} />
              <TextField label="Badge" value={item.badge ?? ""} onChange={(badge) => update({ ...item, badge })} dir={dir} />
            </div>
            <TextField label={`Tab key (${tabOptions.join(", ") || "none"})`} value={item.tab ?? ""} onChange={(tab) => update({ ...item, tab })} />
            <TextField label="Link URL" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
      <div className="space-y-3 rounded-md border border-neutral-700 p-3">
        <CheckboxField label="Show quote card" checked={cta.enabled} onChange={(enabled) => onChange({ ...data, cta: { ...cta, enabled } })} />
        <TextField label="Eyebrow" value={cta.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...data, cta: { ...cta, eyebrow } })} dir={dir} />
        <TextField label="Title" value={cta.title ?? ""} onChange={(title) => onChange({ ...data, cta: { ...cta, title } })} dir={dir} />
        <TextareaField label="Text" rows={3} value={cta.body ?? ""} onChange={(body) => onChange({ ...data, cta: { ...cta, body } })} dir={dir} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Button" value={cta.buttonLabel ?? ""} onChange={(buttonLabel) => onChange({ ...data, cta: { ...cta, buttonLabel } })} dir={dir} />
          <TextField label="Button URL" value={cta.buttonUrl ?? ""} onChange={(buttonUrl) => onChange({ ...data, cta: { ...cta, buttonUrl } })} />
        </div>
      </div>
    </div>
  );
}

/* 05 -- Brands: white bordered cards (812x295 on the artboard), logo centered. */
export function G7BrandsRender({ data, locale }: BlockRenderProps<G7BrandsData>) {
  const items = data.items ?? [];
  return (
    <section className="bg-[var(--g7-cream-50)] pb-[clamp(3.5rem,4.5vw,5.4rem)] pt-[clamp(2rem,4vw,4.8rem)]">
      <div className="g7-container">
        {data.heading ? <h2 className="g7-h2-sm text-[var(--g7-teal-900)]">{data.heading}</h2> : null}
        <div className={cn("mt-[clamp(1.75rem,3.1vw,3.75rem)] grid grid-cols-1 gap-[clamp(1rem,2vw,2.4rem)]", items.length > 1 && "sm:grid-cols-2", items.length > 2 && "lg:grid-cols-3")}>
          {items.map((item, i) => (
            <Link
              key={i}
              href={g7Href(item.url ?? "", locale)}
              className={cn(
                "group flex flex-col items-center rounded-[12px] border border-[var(--g7-divider)] bg-[var(--g7-white)] px-6 pb-[clamp(1rem,1.1vw,1.3rem)] pt-[clamp(1rem,1.25vw,1.5rem)] text-center transition-colors hover:border-[var(--g7-gold-500)]",
                focusRing
              )}
            >
              <div className="relative h-[clamp(6rem,8vw,9.6rem)] w-[clamp(10rem,12.5vw,15rem)]">
                {item.logo?.url ? <Image src={item.logo.url} alt={item.name ?? ""} fill sizes="240px" className="object-contain" /> : null}
              </div>
              <p className="g7-t26 mt-[clamp(0.5rem,0.6vw,0.75rem)] text-[var(--g7-teal-900)]">{item.name}</p>
              {item.count ? <p className="g7-t22 mt-[clamp(0.25rem,0.6vw,0.75rem)] font-light text-[var(--g7-muted)]">{item.count}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function G7BrandsEdit({ data, onChange, locale }: BlockEditProps<G7BrandsData>) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className="space-y-3">
      <TextField label="Heading" value={data.heading ?? ""} onChange={(heading) => onChange({ ...data, heading })} dir={dir} />
      <G7ListEditor<G7BrandItem>
        label="Brands"
        items={data.items ?? []}
        max={8}
        onChange={(items) => onChange({ ...data, items })}
        createItem={() => ({ logo: null, name: "", count: "", url: "/brands" })}
        itemLabel={(item) => item.name ?? ""}
        renderItem={(item, update) => (
          <>
            <G7ImageField label="Logo" value={item.logo} onChange={(logo) => update({ ...item, logo })} />
            <TextField label="Name" value={item.name ?? ""} onChange={(name) => update({ ...item, name })} dir={dir} />
            <TextField label="Product count text" value={item.count ?? ""} onChange={(count) => update({ ...item, count })} dir={dir} />
            <TextField label="Link URL" value={item.url ?? ""} onChange={(url) => update({ ...item, url })} />
          </>
        )}
      />
    </div>
  );
}
