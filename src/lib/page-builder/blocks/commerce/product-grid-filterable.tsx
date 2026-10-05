"use client";

import { useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/site/product-card";
import { withPromo } from "./grid-promo-card";
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

  const items = withPromo(
    visible.map((card) => <ProductCard key={card.id} product={card} locale={locale} {...cardOptions} />),
    promo,
    locale
  );

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
