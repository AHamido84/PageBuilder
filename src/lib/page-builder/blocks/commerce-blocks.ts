import { z } from "zod";
import { Award, GalleryHorizontal, Newspaper, ShoppingBag, Tag, Tags } from "lucide-react";
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

const productGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  categoryId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(24).default(8),
});
export type ProductGridData = z.infer<typeof productGridSchema>;

const categoryGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  /** "dynamic" (default): pulls categories with Category.isFeatured=true, ordered by
   * featuredOrder/order -- see loadFeaturedCategories in category-brand-grid-render.tsx.
   * "manual": legacy/opt-out behavior, unchanged -- uses categoryIds below exactly as before. */
  mode: z.enum(["dynamic", "manual"]).default("dynamic"),
  categoryIds: z.array(z.string()).default([]),
  /** Dynamic mode only: caps how many featured categories render. Unset = no limit. */
  limit: z.number().int().min(1).max(24).optional(),
});
export type CategoryGridData = z.infer<typeof categoryGridSchema>;

const resolvedBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  logoId: z.string().nullable(),
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
    defaultData: { en: { heading: "Featured products", categoryId: "", limit: 8 }, ar: { heading: "منتجات مميزة", categoryId: "", limit: 8 } },
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
    defaultData: { en: { heading: "Featured products", categoryId: "", limit: 8 }, ar: { heading: "منتجات مميزة", categoryId: "", limit: 8 } },
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
      en: { heading: "Shop by category", mode: "dynamic", categoryIds: [] },
      ar: { heading: "تسوق حسب الفئة", mode: "dynamic", categoryIds: [] },
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
      en: { heading: "Brands we distribute", mode: "dynamic", brandIds: [] },
      ar: { heading: "العلامات التجارية التي نوزعها", mode: "dynamic", brandIds: [] },
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
];
