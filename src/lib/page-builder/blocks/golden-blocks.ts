import { Award, Building2, Footprints, Image as ImageIcon, LayoutGrid, PanelTop, Send, ShoppingBasket, Type } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import {
  G7_DEFAULTS,
  g7AboutSchema,
  g7BannerSchema,
  g7BrandsSchema,
  g7CategoriesSchema,
  g7HeroSchema,
  g7ProductsSchema,
  g7QuoteSchema,
  g7SectorsSchema,
  g7StepsSchema,
  type G7AboutData,
  type G7BannerData,
  type G7BrandsData,
  type G7CategoriesData,
  type G7HeroData,
  type G7ProductsData,
  type G7QuoteData,
  type G7SectorsData,
  type G7StepsData,
} from "./golden/schema";
import { G7AboutEdit, G7AboutRender, G7HeroEdit, G7HeroRender } from "./golden/hero";
import { G7BrandsEdit, G7BrandsRender, G7CategoriesEdit, G7CategoriesRender, G7ProductsEdit, G7ProductsRender } from "./golden/catalog";
import { G7BannerEdit, G7BannerRender, G7SectorsEdit, G7SectorsRender, G7StepsEdit, G7StepsRender } from "./golden/story";
import { G7QuoteEdit, G7QuoteRender } from "./golden/quote";
import { resolveG7Brands, resolveG7Categories, resolveG7Products, resolveG7Quote } from "./golden/resolve";

/**
 * Golden Seven home v7 (design-assets/reference): one block per design section. Each owns its
 * full-width composition and colors (bleedsWhen: always), so only content -- text per language,
 * images, links, list items -- is edited here; section Style settings don't apply.
 */
const always = () => true;
const settings = () => defaultSectionSettings({ desktop: { paddingY: "none", marginY: "none", align: "left", columns: "3", headingSize: "lg", bodySize: "md", visible: true } });

// `any` for the same reason as the other block modules: BlockDefinition<T> is contravariant in T.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const goldenBlocks: BlockDefinition<any>[] = [
  { type: "G7_HERO", label: "G7 · Hero", category: "golden", icon: PanelTop, dataSchema: g7HeroSchema, defaultData: G7_DEFAULTS.hero, defaultSettings: settings(), Edit: G7HeroEdit, Render: G7HeroRender, bleedsWhen: always } as BlockDefinition<G7HeroData>,
  { type: "G7_ABOUT", label: "G7 · About strip", category: "golden", icon: Type, dataSchema: g7AboutSchema, defaultData: G7_DEFAULTS.about, defaultSettings: settings(), Edit: G7AboutEdit, Render: G7AboutRender, bleedsWhen: always } as BlockDefinition<G7AboutData>,
  { type: "G7_CATEGORIES", label: "G7 · Categories", category: "golden", icon: LayoutGrid, dataSchema: g7CategoriesSchema, defaultData: G7_DEFAULTS.categories, defaultSettings: settings(), Edit: G7CategoriesEdit, Render: G7CategoriesRender, resolveData: resolveG7Categories, bleedsWhen: always } as BlockDefinition<G7CategoriesData>,
  { type: "G7_PRODUCTS", label: "G7 · Featured products", category: "golden", icon: ShoppingBasket, dataSchema: g7ProductsSchema, defaultData: G7_DEFAULTS.products, defaultSettings: settings(), Edit: G7ProductsEdit, Render: G7ProductsRender, resolveData: resolveG7Products, bleedsWhen: always } as BlockDefinition<G7ProductsData>,
  { type: "G7_BRANDS", label: "G7 · Brands", category: "golden", icon: Award, dataSchema: g7BrandsSchema, defaultData: G7_DEFAULTS.brands, defaultSettings: settings(), Edit: G7BrandsEdit, Render: G7BrandsRender, resolveData: resolveG7Brands, bleedsWhen: always } as BlockDefinition<G7BrandsData>,
  { type: "G7_BANNER", label: "G7 · Lifestyle banner", category: "golden", icon: ImageIcon, dataSchema: g7BannerSchema, defaultData: G7_DEFAULTS.banner, defaultSettings: settings(), Edit: G7BannerEdit, Render: G7BannerRender, bleedsWhen: always } as BlockDefinition<G7BannerData>,
  { type: "G7_STEPS", label: "G7 · Why us (steps)", category: "golden", icon: Footprints, dataSchema: g7StepsSchema, defaultData: G7_DEFAULTS.steps, defaultSettings: settings(), Edit: G7StepsEdit, Render: G7StepsRender, bleedsWhen: always } as BlockDefinition<G7StepsData>,
  { type: "G7_SECTORS", label: "G7 · Business sectors", category: "golden", icon: Building2, dataSchema: g7SectorsSchema, defaultData: G7_DEFAULTS.sectors, defaultSettings: settings(), Edit: G7SectorsEdit, Render: G7SectorsRender, bleedsWhen: always } as BlockDefinition<G7SectorsData>,
  { type: "G7_QUOTE", label: "G7 · Quote form", category: "golden", icon: Send, dataSchema: g7QuoteSchema, defaultData: G7_DEFAULTS.quote, defaultSettings: settings(), Edit: G7QuoteEdit, Render: G7QuoteRender, resolveData: resolveG7Quote, bleedsWhen: always } as BlockDefinition<G7QuoteData>,
];

/** Design order of the v7 homepage (used by scripts/build-home-v7.ts). */
export const GOLDEN_HOME_ORDER = ["G7_HERO", "G7_ABOUT", "G7_CATEGORIES", "G7_PRODUCTS", "G7_BRANDS", "G7_BANNER", "G7_STEPS", "G7_SECTORS", "G7_QUOTE"] as const;
