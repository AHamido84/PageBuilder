"use client";

import { createContext } from "react";

/**
 * Preselects a product (and variant) in the quote form's «المنتجات المطلوبة» when the form sits on a
 * product page (the product page template). Elsewhere `?product=<slug>&variant=<id>` does the same.
 */
export const QuotePrefillContext = createContext<{ product: string; variant?: string | null } | null>(null);

export function QuotePrefillProvider({ product, variant, children }: { product: string; variant?: string | null; children: React.ReactNode }) {
  return <QuotePrefillContext.Provider value={{ product, variant }}>{children}</QuotePrefillContext.Provider>;
}
