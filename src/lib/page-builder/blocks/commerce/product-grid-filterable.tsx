"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { buttonClasses } from "@/components/ui/button";
import { resolveHref } from "../../href";
import type { ProductGridData } from "../commerce-blocks";

const ALL_LABEL = { en: "All", ar: "الكل" };

type CardOptions = Pick<ProductGridData, "imageFit" | "imagePosition" | "hoverEffect" | "showSpecs" | "showCta" | "ctaLabel">;

/**
 * The client half of PRODUCT_GRID: optional category filter chips (filtering happens in the browser
 * over the already-loaded cards -- no extra requests) and an optional promo card slotted into the
 * grid. Cards themselves are loaded server-side by ProductGridRender.
 */
export function ProductGridFilterable({
  cards,
  locale,
  columns,
  showCategoryFilter,
  filterAllLabel,
  promo,
  cardOptions,
}: {
  cards: ProductCardData[];
  locale: string;
  columns: number;
  showCategoryFilter: boolean;
  filterAllLabel: string;
  promo: ProductGridData["promo"];
  cardOptions: CardOptions;
}) {
  const [active, setActive] = useState<string | null>(null);
  const categories = [...new Set(cards.map((c) => c.categoryName).filter(Boolean))];
  const visible = active ? cards.filter((c) => c.categoryName === active) : cards;

  const items: React.ReactNode[] = visible.map((card) => <ProductCard key={card.id} product={card} locale={locale} {...cardOptions} />);
  if (promo?.enabled && (promo.title || promo.body)) {
    const slot = Math.min(Math.max((promo.position ?? 4) - 1, 0), items.length);
    items.splice(
      slot,
      0,
      <div key="promo" className="flex flex-col justify-between gap-6 rounded-[var(--card-radius-lg)] bg-petrol p-6 text-paper sm:p-8">
        <div>
          {promo.eyebrow ? <p className="manifest-strip mb-3 text-wheat">{promo.eyebrow}</p> : null}
          {promo.title ? <p className="font-display text-h3 leading-tight">{promo.title}</p> : null}
          {promo.body ? <p className="mt-3 text-sm leading-relaxed text-paper/75">{promo.body}</p> : null}
        </div>
        {promo.ctaLabel && promo.ctaUrl ? (
          <Link href={resolveHref(promo.ctaUrl, locale)} className={buttonClasses("gold", "md", "self-start whitespace-nowrap")}>
            {promo.ctaLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  const chip = (label: string, value: string | null) => (
    <button
      key={label}
      type="button"
      onClick={() => setActive(value)}
      aria-pressed={active === value}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active === value ? "border-petrol bg-petrol text-paper" : "border-line-strong hover:border-ink/40"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {showCategoryFilter && categories.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={locale === "ar" ? "تصفية حسب الفئة" : "Filter by category"}>
          {chip(filterAllLabel || ALL_LABEL[locale === "ar" ? "ar" : "en"], null)}
          {categories.map((name) => chip(name, name))}
        </div>
      ) : null}
      <div
        className="grid grid-cols-2 gap-[var(--grid-gap,1.25rem)] sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": columns } as React.CSSProperties}
      >
        {items}
      </div>
    </>
  );
}
