"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ProductGallery } from "./product-gallery";
import { VariantSelector, type VariantSelectorLabels } from "@/components/site/variant-selector";
import type { RichText } from "@/lib/text-style/rich-text";
import { findVariant, resolveVariantFromParams, variantQuery, type ProductVariantsView, type VariantView } from "@/lib/catalog/variants/core";
import { cn } from "@/lib/cn";
import { StyledText } from "@/components/text/styled-text";

/**
 * Product page variant state. The server renders the page with the variant picked from the URL
 * (`?cut=ribeye&weight=1kg`, invalid params -> default), so there is no hydration flash; these
 * client islands then swap gallery / name / details / quote link on selection and keep the URL in
 * sync with history.replaceState -- no reload, no new history entry per click. Back/forward still
 * restore the selection via popstate.
 */

interface Ctx {
  view: ProductVariantsView;
  current: VariantView;
  select: (variant: VariantView) => void;
}

const VariantContext = createContext<Ctx | null>(null);

function useVariant(): Ctx {
  const ctx = useContext(VariantContext);
  if (!ctx) throw new Error("variant islands must be inside <VariantProvider>");
  return ctx;
}

export function VariantProvider({ view, initialVariantId, children }: { view: ProductVariantsView; initialVariantId: string; children: ReactNode }) {
  const [current, setCurrent] = useState<VariantView>(() => findVariant(view, initialVariantId) ?? view.variants[0]);

  const select = useCallback(
    (variant: VariantView) => {
      setCurrent(variant);
      const url = new URL(window.location.href);
      for (const option of view.options) url.searchParams.delete(option.key);
      const qs = variantQuery(view, variant);
      for (const [k, v] of new URLSearchParams(qs)) url.searchParams.set(k, v);
      window.history.replaceState(window.history.state, "", url.pathname + (url.search ? url.search : "") + url.hash);
    },
    [view]
  );

  useEffect(() => {
    function onPop() {
      setCurrent(resolveVariantFromParams(view, new URLSearchParams(window.location.search)));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [view]);

  return <VariantContext.Provider value={{ view, current, select }}>{children}</VariantContext.Provider>;
}

export function VariantGallery({ videos, mobileMainUrl }: { videos: { id: string; url: string }[]; mobileMainUrl: string | null }) {
  const { view, current } = useVariant();
  // Keyed by variant so the gallery restarts on the new variant's main image.
  return (
    <div data-variant-gallery>
      <ProductGallery
        key={current.id}
        images={current.images.map((img) => ({ id: img.url, url: img.url }))}
        // The phone-only main image belongs to the product's own main image, i.e. SIMPLE products.
        mobileMainUrl={view.type === "SIMPLE" ? mobileMainUrl : null}
        videos={videos}
        productName={current.name}
      />
    </div>
  );
}

export function VariantTitle({ productName, className }: { productName: string; className?: string }) {
  const { view, current } = useVariant();
  return (
    <h1 className={className}>
      <StyledText text={productName} rich={view.productNameRich} />
      {view.type === "VARIANT" && current.label ? (
        <span data-variant-name className="mt-2 block text-xl font-normal text-ink/60 sm:text-2xl">
          {current.name.startsWith(productName) ? current.label : <StyledText text={current.name} rich={current.rich?.name} />}
        </span>
      ) : null}
    </h1>
  );
}

/** Short + full description: the selected variant's own, else the product's (same markup as before). */
export function VariantDescription() {
  const { current } = useVariant();
  return (
    <>
      {current.shortDescription ? (
        <p className="mt-3 text-lg text-ink/60">
          <StyledText text={current.shortDescription} rich={current.rich?.shortDescription} />
        </p>
      ) : null}
      {current.description ? (
        <p className="mt-4 text-base leading-relaxed text-ink/70">
          <StyledText text={current.description} rich={current.rich?.description} />
        </p>
      ) : null}
    </>
  );
}

export function VariantSelectorIsland({ labels }: { labels: VariantSelectorLabels }) {
  const { view, current, select } = useVariant();
  if (view.type !== "VARIANT" || view.variants.length < 2) return null;
  return (
    <div className="mt-7">
      <VariantSelector view={view} current={current} onChange={select} labels={labels} />
    </div>
  );
}

/** SKU / weight / packaging / storage / extra specs of the selected variant. */
export function VariantDetails({
  productSku,
  labels,
  fixedSpecRows,
  extraInfoRows,
}: {
  /** Shown when the selected variant has no SKU of its own. */
  productSku: string;
  labels: { specifications: string; sku: string; weight: string; packaging: string; storage: string; additionalInfo: string };
  /** Server-rendered rows that don't change with the variant (category, brand, temperature, origin). */
  fixedSpecRows: ReactNode;
  /** Server-rendered "additional info" rows that don't change (dimensions, ingredients…). */
  extraInfoRows: { label: string; value: string; rich?: RichText }[];
}) {
  const { current } = useVariant();
  const additional: { label: ReactNode; value: ReactNode }[] = [
    ...(current.weight ? [{ label: labels.weight, value: <StyledText text={current.weight} rich={current.rich?.weight} /> }] : []),
    ...extraInfoRows.map((row) => ({ label: row.label, value: row.rich ? <StyledText text={row.value} rich={row.rich} /> : row.value })),
    ...current.specs.map((sp) => ({ label: <StyledText text={sp.label} rich={sp.labelRich} />, value: <StyledText text={sp.value} rich={sp.valueRich} /> })),
  ];
  return (
    <>
      <div className="mt-8 rounded-[var(--card-radius)] border border-line">
        <p className="border-b border-line px-5 py-3 text-sm font-medium">{labels.specifications}</p>
        <dl className="divide-y divide-ink/10">
          <SpecRow label={labels.sku} value={<span className="font-mono-data">{current.sku ?? productSku}</span>} />
          {fixedSpecRows}
        </dl>
      </div>

      {current.packaging ? (
        <div className="mt-6">
          <p className="mb-1.5 text-sm font-medium">{labels.packaging}</p>
          <p className="text-sm leading-relaxed text-ink/65">
            <StyledText text={current.packaging} rich={current.rich?.packaging} />
          </p>
        </div>
      ) : null}
      {current.storage ? (
        <div className="mt-6">
          <p className="mb-1.5 text-sm font-medium">{labels.storage}</p>
          <p className="text-sm leading-relaxed text-ink/65">
            <StyledText text={current.storage} rich={current.rich?.storage} />
          </p>
        </div>
      ) : null}

      {additional.length > 0 ? (
        <div className="mt-6 rounded-[var(--card-radius)] border border-line">
          <p className="border-b border-line px-5 py-3 text-sm font-medium">{labels.additionalInfo}</p>
          <dl className="divide-y divide-ink/10">
            {additional.map((row, i) => (
              <SpecRow key={i} label={row.label} value={row.value} />
            ))}
          </dl>
        </div>
      ) : null}
    </>
  );
}

/** «اطلب عرض سعر لهذا المنتج» -> the home quote form with this product + variant preselected. */
export function VariantQuoteLink({ locale, slug, label, className }: { locale: string; slug: string; label: string; className?: string }) {
  const { view, current } = useVariant();
  const qs = new URLSearchParams({ product: slug });
  if (view.type === "VARIANT") qs.set("variant", current.id);
  return (
    <Link href={`/${locale}?${qs.toString()}#quote`} data-quote-link className={className}>
      {label}
    </Link>
  );
}

/** «الأنواع المتاحة»: every variant with its key details; a row selects that variant. */
export function VariantsTable({
  labels,
}: {
  labels: { title: string; variant: string; sku: string; weight: string; packaging: string; availability: string; available: string; unavailable: string; select: string; selected: string };
}) {
  const { view, current, select } = useVariant();
  if (view.type !== "VARIANT" || view.variants.length < 2) return null;
  const showSku = view.variants.some((v) => v.sku);
  const showWeight = view.variants.some((v) => v.weight);
  const showPackaging = view.variants.some((v) => v.packaging);
  return (
    <div className="mt-10" data-variants-table>
      <h2 className="mb-3 text-lg font-medium">{labels.title}</h2>
      <div className="overflow-x-auto rounded-[var(--card-radius)] border border-line">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-frost text-start text-ink/60">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">{labels.variant}</th>
              {showSku ? <th scope="col" className="px-4 py-3 text-start font-medium">{labels.sku}</th> : null}
              {showWeight ? <th scope="col" className="px-4 py-3 text-start font-medium">{labels.weight}</th> : null}
              {showPackaging ? <th scope="col" className="px-4 py-3 text-start font-medium">{labels.packaging}</th> : null}
              <th scope="col" className="px-4 py-3 text-start font-medium">{labels.availability}</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">{labels.select}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {view.variants.map((v) => {
              const isCurrent = v.id === current.id;
              return (
                <tr key={v.id} className={cn(isCurrent && "bg-[var(--g7-gold-500)]/10")}>
                  <td className="px-4 py-3 font-medium">{v.label || v.name}</td>
                  {showSku ? <td className="font-mono-data px-4 py-3">{v.sku ?? "—"}</td> : null}
                  {showWeight ? <td className="px-4 py-3">{v.weight ? <StyledText text={v.weight} rich={v.rich?.weight} /> : "—"}</td> : null}
                  {showPackaging ? <td className="px-4 py-3 text-ink/70">{v.packaging ? <StyledText text={v.packaging} rich={v.rich?.packaging} /> : "—"}</td> : null}
                  <td className="px-4 py-3">{v.available ? labels.available : labels.unavailable}</td>
                  <td className="px-4 py-2 text-end">
                    <button
                      type="button"
                      onClick={() => {
                        select(v);
                        document.querySelector("[data-variant-selector]")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      aria-pressed={isCurrent}
                      className="min-h-11 rounded-[6px] border border-line px-3 text-sm transition-colors hover:border-[var(--g7-teal-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g7-gold-500)] aria-pressed:border-[var(--g7-teal-800)] aria-pressed:bg-[var(--g7-teal-800)] aria-pressed:text-[var(--g7-cream-50)]"
                    >
                      {isCurrent ? labels.selected : labels.select}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
