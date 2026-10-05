"use client";

import { useState } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { ProductCard } from "@/components/site/product-card";
import { VariantSelector } from "@/components/site/variant-selector";
import { defaultVariant, findVariant, variantSummaryLine, type ProductVariantsView } from "@/lib/catalog/variants/core";

/**
 * Section D: the real public ProductCard and product-page selector, fed from the unsaved editor
 * state (Arabic), so the admin sees the result before saving.
 */
export function VariantsPreview({
  view,
  card,
  messages,
}: {
  view: ProductVariantsView;
  card: { id: string; slug: string; sku: string; temperatureClass: string; name: string; categoryName: string; isFeatured: boolean };
  messages: AbstractIntlMessages;
}) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = findVariant(view, currentId) ?? defaultVariant(view);
  const def = defaultVariant(view);

  return (
    <section aria-labelledby="variants-preview-title" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 id="variants-preview-title" className="mb-3 text-base font-semibold">معاينة مباشرة</h2>
      <NextIntlClientProvider locale="ar" messages={messages}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
          <div className="pointer-events-none" aria-label="معاينة البطاقة">
            <ProductCard
              locale="ar"
              product={{
                ...card,
                imageUrl: def.images[0]?.url ?? null,
                weight: def.weight,
                variantSummary: variantSummaryLine(view, "ar"),
              }}
            />
          </div>
          <div className="rounded-md bg-[var(--g7-cream-50)] p-4 text-[var(--g7-teal-900)]" dir="rtl">
            <p className="mb-1 text-lg font-medium">{card.name}</p>
            {view.type === "VARIANT" && current.label ? <p className="mb-3 text-sm opacity-70">{current.label}</p> : null}
            {view.type === "VARIANT" && view.variants.length > 1 ? (
              <VariantSelector
                view={view}
                current={current}
                onChange={(v) => setCurrentId(v.id)}
                labels={{ unavailableCombo: "غير متوفر مع اختيارك الحالي", currentlyUnavailable: "غير متوفر حاليًا" }}
              />
            ) : (
              <p className="text-sm opacity-70">منتج بسيط — لا يظهر اختيار أنواع في صفحة المنتج.</p>
            )}
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {current.weight ? (
                <>
                  <dt className="opacity-60">الوزن</dt>
                  <dd>{current.weight}</dd>
                </>
              ) : null}
              {current.packaging ? (
                <>
                  <dt className="opacity-60">التعبئة</dt>
                  <dd>{current.packaging}</dd>
                </>
              ) : null}
              {current.specs.map((s, i) => (
                <div key={i} className="contents">
                  <dt className="opacity-60">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            {current.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.images[0].url} alt="" className="mt-4 h-32 w-32 rounded-md object-cover" />
            ) : null}
          </div>
        </div>
      </NextIntlClientProvider>
    </section>
  );
}
