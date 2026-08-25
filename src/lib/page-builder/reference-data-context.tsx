"use client";

import { createContext, useContext } from "react";

export interface ReferenceOption {
  id: string;
  label: string;
}

/** Extra flags surfaced only for the Brand Grid checklist, so an editor can see -- before publishing --
 * that a selection has no logo or is currently inactive, instead of discovering it as a silent gap
 * on the live site. */
export interface BrandOption extends ReferenceOption {
  hasLogo: boolean;
  isActive: boolean;
}

export interface ReferenceData {
  categories: ReferenceOption[];
  brands: BrandOption[];
  blogCategories: ReferenceOption[];
  /** Real catalog products, for Hero's Product Composition mode (Primary/Secondary/Supporting picks reference an id here, never duplicate product data). */
  products: ReferenceOption[];
}

const ReferenceDataContext = createContext<ReferenceData>({ categories: [], brands: [], blogCategories: [], products: [] });

export function ReferenceDataProvider({ value, children }: { value: ReferenceData; children: React.ReactNode }) {
  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>;
}

/** Category/brand option lists for block Edit panels (e.g. Product Grid's category filter). Populated once by the builder shell from server-loaded data. */
export function useReferenceData(): ReferenceData {
  return useContext(ReferenceDataContext);
}
