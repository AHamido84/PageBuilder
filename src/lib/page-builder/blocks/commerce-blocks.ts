import { z } from "zod";
import { Award, GalleryHorizontal, Lightbulb, Newspaper, ShoppingBag, Tag, Tags } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ProductGridEdit, ProductGridPreview } from "./commerce/product-grid";
import { ProductGridRender, ProductCarouselRender } from "./commerce/product-grid-render";
import { CategoryGridEdit, CategoryGridPreview, BrandGridEdit, BrandGridPreview } from "./commerce/category-brand-grid";
import { CategoryGridRender, BrandGridRender } from "./commerce/category-brand-grid-render";
import { NewsGridEdit, NewsGridPreview } from "./commerce/news-grid";
import { NewsGridRender } from "./commerce/news-grid-render";
import { CertificationsGridEdit, CertificationsGridPreview } from "./commerce/certifications-grid";
import { CertificationsGridRender } from "./commerce/certifications-grid-render";
import { SolutionsGridEdit, SolutionsGridPreview } from "./commerce/solutions-grid";
import { SolutionsGridRender } from "./commerce/solutions-grid-render";

const productGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  /** Phase 5: optional subheading shown under the heading. */
  description: z.string().max(400).optional().default(""),
  categoryId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(24).default(8),
  /** Phase 5: desktop grid column count (PRODUCT_GRID only -- PRODUCT_CAROUSEL ignores it, its
   * slide width is fixed by ProductCarouselTrack's own responsive `basis-*` classes). Mobile stays
   * a fixed 2-up regardless, matching every other grid block in this registry. */
  columns: z.number().int().min(2).max(6).optional().default(4),
  /** Phase 5 "Image Control": how a product photo fills its frame. "natural" skips the fixed
   * aspect-ratio box entirely and renders the image at its own intrinsic ratio (falls back to
   * "cover" behavior when a product's Media row has no recorded width/height). */
  imageFit: z.enum(["cover", "contain", "natural"]).optional().default("cover"),
  imagePosition: z.enum(["center", "top", "bottom", "left", "right"]).optional().default("center"),
  hoverEffect: z.enum(["zoom", "lift", "none"]).optional().default("zoom"),
  /** Shows a short spec line (weight/dimensions) on the card, only when the product actually has one -- never invented. */
  showSpecs: z.boolean().optional().default(true),
  showCta: z.boolean().optional().default(true),
  /** Empty = the block's own localized default ("View product" / "عرض المنتج"), set inline in ProductCard. */
  ctaLabel: z.string().max(60).optional().default(""),
});
export type ProductGridData = z.infer<typeof productGridSchema>;

const categoryGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  /** Phase 5: optional subheading shown under the heading. */
  description: z.string().max(400).optional().default(""),
  /** "dynamic" (default): pulls categories with Category.isFeatured=true, ordered by
   * featuredOrder/order -- see loadFeaturedCategories in category-brand-grid-render.tsx.
   * "manual": legacy/opt-out behavior, unchanged -- uses categoryIds below exactly as before. */
  mode: z.enum(["dynamic", "manual"]).default("dynamic"),
  /** Manual mode: this array's own order IS the display order (reorderable in the editor via
   * up/down controls) -- see loadManualCategories in category-brand-grid-render.tsx. */
  categoryIds: z.array(z.string()).default([]),
  /** Caps how many categories render. Dynamic mode: applies to the Featured set. Manual mode:
   * optional cap on top of however many are hand-picked. Unset = no limit. */
  limit: z.number().int().min(1).max(24).optional(),
  /** Phase 5: desktop column count for the grid beneath the featured/hero card (or the whole grid
   * in "grid" layout). Mobile stays a fixed 2-up. */
  columns: z.number().int().min(2).max(6).optional().default(4),
  /** "bento" (default, unchanged): first category gets the large editorial hero treatment, the rest
   * bento-grid. "grid": every category rendered as a plain uniform tile, no hero card -- for
   * sections where the editorial treatment doesn't fit the surrounding page. */
  layout: z.enum(["bento", "grid"]).optional().default("bento"),
  showProductCount: z.boolean().optional().default(false),
  /** Shows each category's translated description on its own tile (the featured/hero card already
   * always shows it). */
  showDescription: z.boolean().optional().default(false),
  showCta: z.boolean().optional().default(true),
  /** Empty = the block's own localized default ("Shop now" / "تسوق الآن"). */
  ctaLabel: z.string().max(60).optional().default(""),
});
export type CategoryGridData = z.infer<typeof categoryGridSchema>;

const resolvedBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  logoId: z.string().nullable(),
  /** Brand's translated description, frozen at publish time same as name/logo below. */
  description: z.string().nullable().default(null),
  /** Brand's external site URL (Brand.website), frozen at publish time same as the rest. */
  website: z.string().nullable().default(null),
  productCount: z.number().int().default(0),
});

const brandGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  /** "dynamic" (default): pulls brands with Brand.isFeatured=true, ordered by `order` -- see
   * loadFeaturedBrands in category-brand-grid-render.tsx. "manual": legacy/opt-out behavior,
   * unchanged -- uses brandIds below exactly as before. */
  mode: z.enum(["dynamic", "manual"]).default("dynamic"),
  brandIds: z.array(z.string()).default([]),
  /** Dynamic mode only: caps how many featured brands render. Unset = no limit. */
  limit: z.number().int().min(1).max(24).optional(),
  /** Phase 6: shows each brand's translated description on its card, when the brand actually has
   * one -- defaults on since the redesign brief requires description-if-available on every card. */
  showDescription: z.boolean().optional().default(true),
  /**
   * Root-cause fix for "brand logo sometimes disappears after publish": BrandGridRender otherwise
   * always queries `Brand.logo` live, so a later brand deactivation or Media deletion silently
   * changes what an already-published page shows. `publishPageAction` populates this by resolving
   * `brandIds` once, at the moment of publish, and freezing the result into the PageRevision
   * snapshot -- BrandGridRender then prefers this over a live query whenever it's present. The
   * live draft/admin-canvas path (reading PageSection directly, not a revision snapshot) never has
   * this set, so editors still see the current catalog while working, only the published output is
   * frozen until the next publish. Undefined on any pre-existing revision from before this fix --
   * those keep behaving exactly as before (live) until republished.
   */
  resolvedBrands: z.array(resolvedBrandSchema).optional(),
});
export type BrandGridData = z.infer<typeof brandGridSchema>;
export type ResolvedBrand = z.infer<typeof resolvedBrandSchema>;
export { brandGridSchema };

const newsGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  categoryId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(12).default(3),
});
export type NewsGridData = z.infer<typeof newsGridSchema>;

const certificationsGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  limit: z.number().int().min(1).max(24).optional(),
});
export type CertificationsGridData = z.infer<typeof certificationsGridSchema>;

// Phase 2 addition -- the "Solutions" section type named in the design-system brief had no Page
// Builder block at all (Solutions only ever appeared via the dedicated /solutions index route).
// No mode/manual toggle like Category/Brand Grid above: `Solution` has no `isFeatured` field to
// key that off of, and the real catalog is small (7 rows) with every published one normally shown
// together -- same shape as CertificationsGridData (heading + optional limit) is the honest fit.
const solutionsGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  limit: z.number().int().min(1).max(24).optional(),
});
export type SolutionsGridData = z.infer<typeof solutionsGridSchema>;

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commerceBlocks: BlockDefinition<any>[] = [
  {
    type: "PRODUCT_GRID",
    label: "Product Grid",
    category: "commerce",
    icon: ShoppingBag,
    dataSchema: productGridSchema,
    defaultData: {
      en: { heading: "Featured products", description: "", categoryId: "", limit: 8, columns: 4, imageFit: "cover", imagePosition: "center", hoverEffect: "zoom", showSpecs: true, showCta: true, ctaLabel: "" },
      ar: { heading: "منتجات مميزة", description: "", categoryId: "", limit: 8, columns: 4, imageFit: "cover", imagePosition: "center", hoverEffect: "zoom", showSpecs: true, showCta: true, ctaLabel: "" },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: ProductGridEdit,
    Render: ProductGridRender,
    canvasPreview: ProductGridPreview,
  } as BlockDefinition<ProductGridData>,
  {
    type: "PRODUCT_CAROUSEL",
    label: "Product Carousel",
    category: "commerce",
    icon: GalleryHorizontal,
    dataSchema: productGridSchema,
    defaultData: {
      en: { heading: "Featured products", description: "", categoryId: "", limit: 8, columns: 4, imageFit: "cover", imagePosition: "center", hoverEffect: "zoom", showSpecs: true, showCta: true, ctaLabel: "" },
      ar: { heading: "منتجات مميزة", description: "", categoryId: "", limit: 8, columns: 4, imageFit: "cover", imagePosition: "center", hoverEffect: "zoom", showSpecs: true, showCta: true, ctaLabel: "" },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: ProductGridEdit,
    Render: ProductCarouselRender,
    canvasPreview: ProductGridPreview,
  } as BlockDefinition<ProductGridData>,
  {
    type: "CATEGORY_GRID",
    label: "Category Grid",
    category: "commerce",
    icon: Tags,
    dataSchema: categoryGridSchema,
    defaultData: {
      en: { heading: "Shop by category", description: "", mode: "dynamic", categoryIds: [], columns: 4, layout: "bento", showProductCount: false, showDescription: false, showCta: true, ctaLabel: "" },
      ar: { heading: "تسوق حسب الفئة", description: "", mode: "dynamic", categoryIds: [], columns: 4, layout: "bento", showProductCount: false, showDescription: false, showCta: true, ctaLabel: "" },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: CategoryGridEdit,
    Render: CategoryGridRender,
    canvasPreview: CategoryGridPreview,
  } as BlockDefinition<CategoryGridData>,
  {
    type: "BRAND_GRID",
    label: "Brand Grid",
    category: "commerce",
    icon: Tag,
    dataSchema: brandGridSchema,
    defaultData: {
      en: { heading: "Brands we distribute", mode: "dynamic", brandIds: [], showDescription: true },
      ar: { heading: "العلامات التجارية التي نوزعها", mode: "dynamic", brandIds: [], showDescription: true },
    },
    defaultSettings: defaultSectionSettings(),
    Edit: BrandGridEdit,
    Render: BrandGridRender,
    canvasPreview: BrandGridPreview,
  } as BlockDefinition<BrandGridData>,
  {
    type: "NEWS_GRID",
    label: "News Grid",
    category: "commerce",
    icon: Newspaper,
    dataSchema: newsGridSchema,
    defaultData: { en: { heading: "Latest from the blog", categoryId: "", limit: 3 }, ar: { heading: "أحدث المقالات", categoryId: "", limit: 3 } },
    defaultSettings: defaultSectionSettings(),
    Edit: NewsGridEdit,
    Render: NewsGridRender,
    canvasPreview: NewsGridPreview,
  } as BlockDefinition<NewsGridData>,
  {
    type: "CERTIFICATIONS_GRID",
    label: "Certifications Grid",
    category: "commerce",
    icon: Award,
    dataSchema: certificationsGridSchema,
    defaultData: { en: { heading: "Certifications" }, ar: { heading: "الشهادات" } },
    defaultSettings: defaultSectionSettings(),
    Edit: CertificationsGridEdit,
    Render: CertificationsGridRender,
    canvasPreview: CertificationsGridPreview,
  } as BlockDefinition<CertificationsGridData>,
  {
    type: "SOLUTIONS_GRID",
    label: "Solutions Grid",
    category: "commerce",
    icon: Lightbulb,
    dataSchema: solutionsGridSchema,
    defaultData: { en: { heading: "Solutions for every industry" }, ar: { heading: "حلول لكل قطاع" } },
    defaultSettings: defaultSectionSettings(),
    Edit: SolutionsGridEdit,
    Render: SolutionsGridRender,
    canvasPreview: SolutionsGridPreview,
  } as BlockDefinition<SolutionsGridData>,
];
