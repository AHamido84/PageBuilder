import type { ComponentType } from "react";
import type { z } from "zod";
import type { LucideIcon } from "lucide-react";

export type Breakpoint = "mobile" | "tablet" | "desktop";
export type EditorLocale = "en" | "ar";

export type PaddingToken = "none" | "sm" | "md" | "lg" | "xl";
export type MarginToken = "none" | "sm" | "md" | "lg";
export type AlignToken = "left" | "center" | "right";
export type ColumnsToken = "1" | "2" | "3" | "4";
export type HeadingSizeToken = "sm" | "md" | "lg" | "xl" | "2xl";
export type BodySizeToken = "sm" | "md" | "lg";
export type BackgroundToken = "none" | "paper" | "frost" | "ink" | "harbor";
export type AnimationToken = "none" | "fade-up" | "fade-in" | "zoom-in";

/** Style properties that can vary per breakpoint. */
export interface StyleTokens {
  paddingY: PaddingToken;
  marginY: MarginToken;
  align: AlignToken;
  columns: ColumnsToken;
  headingSize: HeadingSizeToken;
  bodySize: BodySizeToken;
  visible: boolean;
}

/** Full section settings: per-breakpoint style overrides plus non-responsive extras. */
export interface SectionSettings {
  desktop: StyleTokens;
  tablet: Partial<StyleTokens>;
  mobile: Partial<StyleTokens>;
  background: BackgroundToken;
  animation: AnimationToken;
}

export type BlockCategory = "content" | "media" | "layout" | "commerce" | "social-proof" | "interactive" | "forms" | "misc";

export interface BlockEditProps<TData> {
  data: TData;
  onChange: (next: TData) => void;
  locale: EditorLocale;
}

export interface BlockRenderProps<TData> {
  data: TData;
  /** Public route locale, "en" | "ar" (lowercase, matches next-intl routing). */
  locale: string;
  /** True only inside the admin canvas in PREVIEW mode or on the public site — interactive elements (accordions, tabs) may respond to clicks. False in SELECT mode, where the canvas overlay intercepts clicks itself. */
  interactive: boolean;
  /** The section's resolved responsive settings — used by blocks whose own markup needs a token (e.g. Heading's font-size, a grid block's column count). Most blocks ignore this; SectionShell already applies padding/margin/background/animation around Render's output. */
  settings: SectionSettings;
}

export interface BlockDefinition<TData = unknown> {
  type: string;
  label: string;
  category: BlockCategory;
  icon: LucideIcon;
  /** Whether this block's Style settings expose the responsive "columns" control. */
  supportsColumns?: boolean;
  dataSchema: z.ZodType<TData>;
  defaultData: { en: TData; ar: TData };
  defaultSettings: SectionSettings;
  Edit: ComponentType<BlockEditProps<TData>>;
  /**
   * Renders the block. May be an async Server Component ONLY for blocks that
   * are never given a `canvasPreview` (below) — an async Server Component
   * cannot be mounted directly inside the client-side admin canvas.
   */
  Render: ComponentType<BlockRenderProps<TData>> | ((props: BlockRenderProps<TData>) => Promise<React.ReactElement | null>);
  /**
   * Lightweight sync placeholder shown in the admin canvas instead of `Render`,
   * for blocks whose real Render does live server-side data fetching (Product
   * Grid, Product Carousel, Category Grid, Brand Grid) and therefore can't run
   * as a client-rendered component. Omit for blocks where Render is already
   * sync/client-safe (the common case) — the canvas then uses Render directly
   * for true WYSIWYG.
   */
  canvasPreview?: ComponentType<{ data: TData }>;
}

export function defaultStyleTokens(overrides?: Partial<StyleTokens>): StyleTokens {
  return {
    paddingY: "lg",
    marginY: "none",
    align: "left",
    columns: "3",
    headingSize: "lg",
    bodySize: "md",
    visible: true,
    ...overrides,
  };
}

export function defaultSectionSettings(overrides?: Partial<SectionSettings>): SectionSettings {
  return {
    desktop: defaultStyleTokens(),
    tablet: {},
    mobile: {},
    background: "none",
    animation: "none",
    ...overrides,
  };
}

/** A section row as edited in the builder canvas (client-side working copy). */
export interface BuilderSection {
  id: string;
  type: string;
  order: number;
  dataEn: unknown;
  dataAr: unknown;
  settings: SectionSettings;
  isVisible: boolean;
}
