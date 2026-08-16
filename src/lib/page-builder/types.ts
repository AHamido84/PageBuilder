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
export type BackgroundToken = "none" | "paper" | "frost" | "ink" | "harbor" | "wheat-soft";
export type AnimationToken = "none" | "fade-up" | "fade-down" | "fade-in" | "zoom-in" | "scale" | "slide-start" | "slide-end" | "parallax";

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
  /**
   * Optional server-side hydration step for blocks whose `Render` is a plain
   * sync/client component but whose data references `Media`/`Product`/etc. by
   * id (e.g. Hero's `desktopMediaId`, or Product Composition's
   * `primaryProductId`) and needs the real resolved data attached before
   * `Render` ever runs. Both the public `SectionRenderer` and the admin
   * builder's initial page-load call this (with a fresh Prisma query) so the
   * correct data shows on first paint, not just mid-edit-session client state.
   * `locale` is the section's own locale ("en"/"ar") -- needed because a
   * referenced row's translation (e.g. a Product's name) is locale-specific,
   * while `dataEn`/`dataAr` are resolved as two separate calls. Blocks that
   * already do their own live Prisma query inside an async `Render` (Category
   * Grid, Brand Grid, Marquee, …) don't need this — they resolve their own
   * data already.
   */
  resolveData?: (data: TData, locale: string) => Promise<TData>;
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

/**
 * A section's responsive style settings, kept fully independent per locale.
 * Root-cause fix for the AR/EN alignment cross-contamination bug: pre-fix,
 * `PageSection.settings` (and this type) was a single flat `SectionSettings`
 * shared by both `dataEn` and `dataAr` -- changing alignment in one language
 * silently changed it in the other because there was only ever one object.
 * `dataEn`/`dataAr` themselves were never affected (always separate columns);
 * only this section-level Style-panel token set (padding/margin/align/
 * columns/headingSize/bodySize/visible/background/animation) was shared.
 */
export type LocaleSectionSettings = Record<EditorLocale, SectionSettings>;

export function defaultLocaleSectionSettings(overrides?: Partial<SectionSettings>): LocaleSectionSettings {
  return { en: defaultSectionSettings(overrides), ar: defaultSectionSettings(overrides) };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceSectionSettings(raw: unknown): SectionSettings {
  if (!isPlainObject(raw)) return defaultSectionSettings();
  const desktop = isPlainObject(raw.desktop) ? { ...defaultStyleTokens(), ...(raw.desktop as Partial<StyleTokens>) } : defaultStyleTokens();
  return {
    desktop,
    tablet: isPlainObject(raw.tablet) ? (raw.tablet as Partial<StyleTokens>) : {},
    mobile: isPlainObject(raw.mobile) ? (raw.mobile as Partial<StyleTokens>) : {},
    background: (raw.background as BackgroundToken) ?? "none",
    animation: (raw.animation as AnimationToken) ?? "none",
  };
}

/**
 * Reads a `PageSection.settings` JSON value (from the DB, a revision
 * snapshot, or client state) into the locale-isolated shape, tolerating two
 * legacy/edge inputs so no existing page ever breaks or loses data:
 *  - Pre-fix rows store one flat `SectionSettings` shared by both locales.
 *    Treated as the initial shared fallback for BOTH `en` and `ar` (matches
 *    the documented no-data-loss migration: identical until an admin
 *    actually edits one locale's style, at which point only that locale's
 *    branch changes on the next save).
 *  - Anything missing/malformed falls back to defaults for both locales.
 * Post-fix rows already store `{ en, ar }` and pass through (each side
 * defensively re-merged with defaults in case of partial/older data).
 */
export function normalizeLocaleSettings(raw: unknown): LocaleSectionSettings {
  if (isPlainObject(raw) && isPlainObject(raw.en) && isPlainObject(raw.ar)) {
    return { en: coerceSectionSettings(raw.en), ar: coerceSectionSettings(raw.ar) };
  }
  if (isPlainObject(raw) && ("desktop" in raw || "background" in raw || "animation" in raw)) {
    const shared = coerceSectionSettings(raw);
    return { en: structuredClone(shared), ar: structuredClone(shared) };
  }
  return defaultLocaleSectionSettings();
}

/** A section row as edited in the builder canvas (client-side working copy). */
export interface BuilderSection {
  id: string;
  type: string;
  order: number;
  dataEn: unknown;
  dataAr: unknown;
  settings: LocaleSectionSettings;
  isVisible: boolean;
}
