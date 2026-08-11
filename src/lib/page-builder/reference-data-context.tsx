"use client";

import { createContext, useContext } from "react";

export interface ReferenceOption {
  id: string;
  label: string;
}

export interface ReferenceData {
  categories: ReferenceOption[];
  brands: ReferenceOption[];
  blogCategories: ReferenceOption[];
}

const ReferenceDataContext = createContext<ReferenceData>({ categories: [], brands: [], blogCategories: [] });

export function ReferenceDataProvider({ value, children }: { value: ReferenceData; children: React.ReactNode }) {
  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>;
}

/** Category/brand option lists for block Edit panels (e.g. Product Grid's category filter). Populated once by the builder shell from server-loaded data. */
export function useReferenceData(): ReferenceData {
  return useContext(ReferenceDataContext);
}
