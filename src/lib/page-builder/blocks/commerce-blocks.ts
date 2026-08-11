import { z } from "zod";
import { GalleryHorizontal, Newspaper, ShoppingBag, Tag, Tags } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { ProductGridEdit, ProductGridPreview } from "./commerce/product-grid";
import { ProductGridRender, ProductCarouselRender } from "./commerce/product-grid-render";
import { CategoryGridEdit, CategoryGridPreview, BrandGridEdit, BrandGridPreview } from "./commerce/category-brand-grid";
import { CategoryGridRender, BrandGridRender } from "./commerce/category-brand-grid-render";
import { NewsGridEdit, NewsGridPreview } from "./commerce/news-grid";
import { NewsGridRender } from "./commerce/news-grid-render";

const productGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  categoryId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(24).default(8),
});
export type ProductGridData = z.infer<typeof productGridSchema>;

const categoryGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  categoryIds: z.array(z.string()).default([]),
});
export type CategoryGridData = z.infer<typeof categoryGridSchema>;

const brandGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  brandIds: z.array(z.string()).default([]),
});
export type BrandGridData = z.infer<typeof brandGridSchema>;

const newsGridSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  categoryId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(12).default(3),
});
export type NewsGridData = z.infer<typeof newsGridSchema>;

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
    defaultData: { en: { heading: "Shop by category", categoryIds: [] }, ar: { heading: "تسوق حسب الفئة", categoryIds: [] } },
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
    defaultData: { en: { heading: "Brands we distribute", brandIds: [] }, ar: { heading: "العلامات التجارية التي نوزعها", brandIds: [] } },
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
];
