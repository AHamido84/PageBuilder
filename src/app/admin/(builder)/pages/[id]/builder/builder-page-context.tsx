"use client";

import { createContext, useContext } from "react";

/** Which page the builder is editing -- system pages (system-pages.ts) restrict blocks and lock required sections. */
export const BuilderPageContext = createContext<{ slug: string }>({ slug: "" });
export const useBuilderPage = () => useContext(BuilderPageContext);
