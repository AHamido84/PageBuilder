import { z } from "zod";
import { LayoutGrid, PackageSearch, Rows3 } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { FILTER_KEYS } from "@/lib/catalog/products-listing-params";
import { ProductsCatalogEdit, ProductsCatalogPreview, ProductDetailsEdit, ProductDetailsPreview, ProductRelatedEdit, ProductRelatedPreview } from "./catalog/products-catalog";
import { ProductsCatalogRender } from "./catalog/products-catalog-render";
import { ProductDetailsRender, ProductRelatedRender } from "./catalog/product-template-render";

/**
 * System-page blocks (system-pages.ts): the Products page's live catalog, and the product page
 * template's fixed «Product details» + related products. All render server-side with the page's
 * request context (search params / the loaded product) -- see PageRenderContext.
 */

const text = (max: number) => z.string().max(max).optional().default("");

export const productsCatalogSchema = z.object({
  /** Optional header above the filters (the page's own title when the catalog is the page). */
  eyebrow: text(80),
  title: text(160),
  subtitle: text(400),
  /** On ?category=…: the category's own name/description/banner replace this header (as before). */
  categoryHeader: z.boolean().optional().default(true),
  columnsDesktop: z.number().int().min(2).max(6).optional().default(4),
  columnsTablet: z.number().int().min(2).max(4).optional().default(3),
  columnsMobile: z.number().int().min(1).max(2).optional().default(2),
  /** Filters shown, in this order. */
  filters: z.array(z.enum(FILTER_KEYS)).max(FILTER_KEYS.length).optional().default([...FILTER_KEYS]),
  showResultsCount: z.boolean().optional().default(true),
  /** Category slug applied when the URL has none ("" = all products). */
  defaultCategory: z.string().max(160).optional().default(""),
  pageSize: z.number().int().min(4).max(48).optional().default(12),
  paging: z.enum(["pages", "loadMore"]).optional().default("pages"),
  loadMoreLabel: text(60),
  /** "product": one card per product (as before); "variant": one card per variant. */
  variantCards: z.enum(["product", "variant"]).optional().default("product"),
  quoteCard: z
    .object({
      enabled: z.boolean().default(false),
      eyebrow: text(80),
      title: text(150),
      body: text(300),
      ctaLabel: text(60),
      ctaUrl: text(300),
      position: z.number().int().min(1).max(48).default(4),
    })
    .optional(),
  /** Empty = the built-in texts. */
  emptyText: text(200),
  emptyCategoryText: text(200),
  emptyCategoryAction: text(60),
});
export type ProductsCatalogData = z.infer<typeof productsCatalogSchema>;

export const productDetailsSchema = z.object({}).passthrough();
export type ProductDetailsData = z.infer<typeof productDetailsSchema>;

export const productRelatedSchema = z.object({ heading: text(160) });
export type ProductRelatedData = z.infer<typeof productRelatedSchema>;

const catalogDefaults = (lang: "en" | "ar"): ProductsCatalogData => ({
  eyebrow: lang === "ar" ? "الكتالوج" : "Catalog",
  title: lang === "ar" ? "المنتجات" : "Products",
  subtitle: "",
  categoryHeader: true,
  columnsDesktop: 4,
  columnsTablet: 3,
  columnsMobile: 2,
  filters: [...FILTER_KEYS],
  showResultsCount: true,
  defaultCategory: "",
  pageSize: 12,
  paging: "pages",
  loadMoreLabel: "",
  variantCards: "product",
  quoteCard: { enabled: false, eyebrow: "", title: "", body: "", ctaLabel: "", ctaUrl: "/#quote-form", position: 4 },
  emptyText: "",
  emptyCategoryText: "",
  emptyCategoryAction: "",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see commerce-blocks.ts
export const catalogBlocks: BlockDefinition<any>[] = [
  {
    type: "PRODUCTS_CATALOG",
    label: "Products Catalog (filters + grid)",
    category: "commerce",
    icon: PackageSearch,
    dataSchema: productsCatalogSchema,
    defaultData: { en: catalogDefaults("en"), ar: catalogDefaults("ar") },
    defaultSettings: defaultSectionSettings(),
    Edit: ProductsCatalogEdit,
    Render: ProductsCatalogRender,
    canvasPreview: ProductsCatalogPreview,
    // The block owns its sections (category banner + results), exactly like the built-in page.
    bleedsWhen: () => true,
    usesContext: true,
  } as BlockDefinition<ProductsCatalogData>,
  {
    type: "PRODUCT_DETAILS",
    label: "Product details (fixed — product template)",
    category: "commerce",
    icon: Rows3,
    dataSchema: productDetailsSchema,
    defaultData: { en: {}, ar: {} },
    defaultSettings: defaultSectionSettings(),
    Edit: ProductDetailsEdit,
    Render: ProductDetailsRender,
    canvasPreview: ProductDetailsPreview,
    bleedsWhen: () => true,
    usesContext: true,
  } as BlockDefinition<ProductDetailsData>,
  {
    type: "PRODUCT_RELATED",
    label: "Related products (product template)",
    category: "commerce",
    icon: LayoutGrid,
    dataSchema: productRelatedSchema,
    defaultData: { en: { heading: "" }, ar: { heading: "" } },
    defaultSettings: defaultSectionSettings(),
    Edit: ProductRelatedEdit,
    Render: ProductRelatedRender,
    canvasPreview: ProductRelatedPreview,
    bleedsWhen: () => true,
    usesContext: true,
    hiddenWhen: (_data, context) => {
      const related = (context.product as { related?: unknown[] } | undefined)?.related;
      return !related || related.length === 0;
    },
  } as BlockDefinition<ProductRelatedData>,
];
