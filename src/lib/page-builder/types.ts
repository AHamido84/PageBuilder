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
// "fade-left"/"fade-right" (Phase 2) reuse the physical (non-RTL-mirrored) ScrollReveal variants
// added in the Phase 1 design-system foundation (src/lib/motion/primitives.tsx) -- see that file's
// comment for why they're deliberately not mirrored, unlike slide-start/slide-end.
export type AnimationToken =
  | "none"
  | "fade-up"
  | "fade-down"
  | "fade-in"
  | "zoom-in"
  | "scale"
  | "slide-start"
  | "slide-end"
  | "parallax"
  | "fade-left"
  | "fade-right"
  // Phase 8 "Global Visual Control Center": resolves at render time to the site-wide Animation >
  // Default Animation setting (DesignAnimationProvider), so a section can genuinely defer to
  // whatever the admin currently has configured as the global default instead of a value frozen at
  // save time. Additive -- no existing section is ever stored with this value unless an admin
  // explicitly picks "Inherit from global default" in the Style panel.
  | "inherit";
/** Per-breakpoint minimum height (Phase 2's "Height" section setting). "auto" is the default and
 * preserves every already-published section's exact current behavior (no min-height constraint at
 * all) -- the others add an explicit floor without capping actual content height. */
export type SectionHeightToken = "auto" | "sm" | "md" | "lg" | "xl" | "screen";
/** Phase 2's "Container Width" section setting. "default" is the backward-compatible sentinel: it
 * defers entirely to the block's own `BlockDefinition.bleedsWhen` result, exactly today's behavior
 * for every already-published section. "full"/"contained" are explicit admin overrides that win
 * regardless of what the block itself would have chosen. */
export type ContainerWidthToken = "default" | "full" | "contained";
/** Phase 2's "Border Radius" section setting -- "none" preserves current behavior (sections have
 * never had rounded corners). Most useful paired with `containerWidth: "contained"` (a card-like
 * banded section), but not restricted to it. */
export type BorderRadiusToken = "none" | "sm" | "md" | "lg" | "xl";

/** Phase 9 "Layout > Gap" section setting -- spacing between grid items (product/category grids,
 * icon-card/testimonial grids). "default" is the backward-compatible sentinel: no override at all,
 * so every already-published section keeps whatever gap its own block already hardcodes/reads from
 * the global `--grid-gap`/`--card-gap` tokens (Phase 8). Deliberately non-responsive (single value),
 * same scope call as `background`/`containerWidth` above. */
export type GapToken = "default" | "none" | "sm" | "md" | "lg" | "xl";

/** Phase 9 "Style > Shadow" section setting. "none" preserves current behavior (sections have never
 * had a box-shadow). Reuses the same --shadow-* CSS variables Buttons/Cards already read. */
export type ShadowToken = "none" | "sm" | "md" | "lg" | "xl";

export type BorderWidthToken = "none" | "thin" | "medium" | "thick";
export type BorderStyleToken = "solid" | "dashed" | "dotted";
export type BorderColorToken = "ink" | "petrol" | "coral" | "wheat" | "frost" | "custom";

/** Phase 9 "Style > Border" section setting -- a section-level border, independent of `borderRadius`
 * above (a section can have rounded corners with no border, a border with square corners, or both). */
export interface SectionBorderSettings {
  width: BorderWidthToken;
  style: BorderStyleToken;
  color: BorderColorToken;
  /** Hex color, used only when color === "custom". */
  customColor: string;
}

export function defaultSectionBorderSettings(overrides?: Partial<SectionBorderSettings>): SectionBorderSettings {
  return { width: "none", style: "solid", color: "ink", customColor: "#18302D", ...overrides };
}

export type FontWeightToken = "inherit" | "normal" | "medium" | "semibold" | "bold";
export type LineHeightToken = "inherit" | "tight" | "snug" | "normal" | "relaxed" | "loose";
/** A curated palette (not an arbitrary hex) so a section-level text-color override reuses the same
 * CSS custom properties (--color-ink/petrol/coral/wheat/muted-text) every other component already
 * reads -- see resolveTypographyClasses (style-tokens.ts) for why this cascades correctly through
 * Phase 8's Global Colors layer instead of fighting it. */
export type TextColorToken = "inherit" | "ink" | "petrol" | "coral" | "wheat" | "muted";

/** Phase 9 "Typography" tab overrides -- Size (headingSize/bodySize, per-breakpoint, already existed
 * on StyleTokens) and Alignment (the existing per-breakpoint `align` token, edited from the Layout
 * tab to avoid two controls silently writing the same field) are deliberately NOT duplicated here. */
export interface SectionTypographySettings {
  weight: FontWeightToken;
  color: TextColorToken;
  lineHeight: LineHeightToken;
}

export function defaultSectionTypographySettings(overrides?: Partial<SectionTypographySettings>): SectionTypographySettings {
  return { weight: "inherit", color: "inherit", lineHeight: "inherit", ...overrides };
}

export type ButtonRadiusToken = "inherit" | "none" | "sm" | "md" | "lg" | "full";
export type ButtonShadowToken = "inherit" | "none" | "flat" | "card" | "lifted";
export type ButtonPaddingToken = "inherit" | "compact" | "default" | "spacious";

/**
 * Phase 9 "Buttons" tab -- a per-section override of the exact same --button-radius/--button-shadow/
 * --button-padding-scale CSS custom properties the Phase 8 Global Visual Control Center already
 * defines site-wide (design-tokens/resolve-css.ts). Applied as an inline style on the section's own
 * wrapper (see SectionShell), so it overrides the global default for every Button inside THIS
 * section only, via ordinary CSS custom-property inheritance -- no new resolution mechanism, and the
 * global default is completely unaffected for every other section. "inherit" (the default for every
 * field) emits no override at all.
 */
export interface SectionButtonSettings {
  radius: ButtonRadiusToken;
  shadow: ButtonShadowToken;
  paddingScale: ButtonPaddingToken;
  /** "inherit" defers to the global Buttons > Icon toggle (Phase 8); "hide" force-hides `.btn-icon`
   * inside this section only, "show" force-shows it even if the global toggle is off. */
  icon: "inherit" | "show" | "hide";
}

export function defaultSectionButtonSettings(overrides?: Partial<SectionButtonSettings>): SectionButtonSettings {
  return { radius: "inherit", shadow: "inherit", paddingScale: "inherit", icon: "inherit", ...overrides };
}

export type AnimationTriggerToken = "onScroll" | "onLoad";
export type AnimationIntensityToken = "subtle" | "normal" | "strong";

/** Phase 9 "Advanced" tab -- a real custom-class/anchor-id escape hatch, replacing the previous
 * read-only stub. Deliberately does NOT include a raw custom-CSS/HTML field: this project has no
 * existing precedent for admin-authored raw CSS/script rendered on the public site, and doing so
 * would mean injecting admin-controlled strings into a `<style>`/`dangerouslySetInnerHTML` on pages
 * every visitor loads -- a real stored-injection surface for comparatively little value over a
 * custom class name (which a developer can already target in the stylesheet) plus an anchor id
 * (useful for in-page nav links). Both values are sanitized to a safe charset before use, both at
 * the input (settings-panel.tsx) and defensively again at render (section-shell.tsx). */
export interface SectionAdvancedSettings {
  customClass: string;
  anchorId: string;
}

export function defaultSectionAdvancedSettings(overrides?: Partial<SectionAdvancedSettings>): SectionAdvancedSettings {
  return { customClass: "", anchorId: "", ...overrides };
}

/** Shared by the settings-panel input (sanitize as-typed) and section-shell's render (defensive
 * re-sanitize regardless of how the value got into `settings`) -- one definition, no drift risk. */
export function sanitizeAdvancedToken(value: string, allowSpaces: boolean): string {
  const pattern = allowSpaces ? /[^a-zA-Z0-9_\- ]/g : /[^a-zA-Z0-9_-]/g;
  return value.replace(pattern, "").trim();
}

export type BackgroundSizeToken = "cover" | "contain" | "custom";
export type BackgroundRepeatToken = "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
export type BackgroundAttachmentToken = "scroll" | "fixed";
export type OverlayToken = "none" | "light" | "dark" | "gradient" | "custom";

export interface MediaRef {
  id: string;
  url: string;
}

/**
 * A section's optional background image/overlay layer, independent of the plain color `background`
 * token above -- a section can have a color token AND an image (the color shows while the image
 * loads / behind transparent PNGs). `image` unset means no image layer renders at all, regardless
 * of any other field here (so a section with leftover image settings from a prior edit but a
 * cleared `image` cleanly falls back to just its color token, never a broken/blank image box).
 */
export interface BackgroundImageSettings {
  image: MediaRef | null;
  /** Falls back to `image` when unset -- see FIX §21/§13 (mobile background). */
  mobileImage: MediaRef | null;
  /** Optional background video -- `image` (or `mobileImage`) still renders underneath/as a poster,
   * so a slow connection or autoplay-blocked browser never shows a blank section. Muted/looped/
   * autoplaying, same convention as Hero's own video layer. */
  video: MediaRef | null;
  size: BackgroundSizeToken;
  /** Raw CSS background-size value, used only when size === "custom" (e.g. "400px auto"). */
  customSize: string;
  /** 0-100, percentage-based background-position (x% y%). */
  positionX: number;
  positionY: number;
  repeat: BackgroundRepeatToken;
  /** "fixed" gives a parallax-like effect; caller should use sparingly (perf). */
  attachment: BackgroundAttachmentToken;
  overlay: OverlayToken;
  /** Hex color, used only when overlay === "custom". */
  overlayColor: string;
  /** 0-100. */
  overlayOpacity: number;
  /** 0-20 (px). 0 = no blur. */
  blur: number;
  /** 50-150 (%). 100 = unchanged. */
  brightness: number;
  /** 50-150 (%). 100 = unchanged. */
  contrast: number;
}

export function defaultBackgroundImageSettings(overrides?: Partial<BackgroundImageSettings>): BackgroundImageSettings {
  return {
    image: null,
    mobileImage: null,
    video: null,
    size: "cover",
    customSize: "auto",
    positionX: 50,
    positionY: 50,
    repeat: "no-repeat",
    attachment: "scroll",
    overlay: "none",
    overlayColor: "#18302D",
    overlayOpacity: 40,
    blur: 0,
    brightness: 100,
    contrast: 100,
    ...overrides,
  };
}

/** Style properties that can vary per breakpoint. */
export interface StyleTokens {
  paddingY: PaddingToken;
  marginY: MarginToken;
  align: AlignToken;
  columns: ColumnsToken;
  headingSize: HeadingSizeToken;
  bodySize: BodySizeToken;
  visible: boolean;
  /** Phase 2 addition -- see SectionHeightToken. Optional (not required), specifically so the
   * ~30 pre-existing literal `StyleTokens`/`desktop: {...}` object overrides scattered across the
   * block registry (each BlockDefinition's `defaultSettings`) and the one-off page seed scripts
   * don't all need editing just to add a field most of them are happy defaulting on -- every real
   * read site treats a missing value as "auto" (see resolveSectionClasses), so this is equivalent
   * to those objects saying so explicitly. `defaultStyleTokens()` itself still always fills it in. */
  height?: SectionHeightToken;
}

/** Full section settings: per-breakpoint style overrides plus non-responsive extras. */
export interface SectionSettings {
  desktop: StyleTokens;
  tablet: Partial<StyleTokens>;
  mobile: Partial<StyleTokens>;
  background: BackgroundToken;
  /** Phase 2 additions -- see ContainerWidthToken/BorderRadiusToken. Not per-breakpoint (a section's
   * container width/corner treatment is a single deliberate admin choice, same non-responsive
   * status as `background`/`animation` below). */
  containerWidth: ContainerWidthToken;
  borderRadius: BorderRadiusToken;
  /** Optional image/video-style background layer, additive to `background` above -- see FIX §16-21. */
  backgroundImage: BackgroundImageSettings;
  animation: AnimationToken;
  /** Phase 9 additions below -- all additive with backward-compatible defaults ("default"/"none"/
   * "inherit" everywhere), so every section saved before Phase 9 coerces to today's exact behavior
   * via `coerceSectionSettings`'s per-field fallback, never a hard schema break. */
  gap: GapToken;
  border: SectionBorderSettings;
  shadow: ShadowToken;
  typography: SectionTypographySettings;
  buttons: SectionButtonSettings;
  /** null = inherit the animation's own hardcoded default duration (DURATION.large, see reveal.tsx). */
  animationDurationMs: number | null;
  animationDelayMs: number;
  animationTrigger: AnimationTriggerToken;
  animationIntensity: AnimationIntensityToken;
  advanced: SectionAdvancedSettings;
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
  /**
   * Optional per-instance override: when true for a given `data`, SectionShell skips its shared
   * max-width/padding/background/top-border chrome and viewport-triggered Reveal wrapper, letting
   * the block's own Render fully own an edge-to-edge, full-viewport-height composition (e.g. a
   * cinematic full-bleed Hero background). Most blocks omit this and always get the standard
   * chrome. A per-instance function (not a static flag) because the same block type can have
   * multiple layout modes (e.g. Hero's "split" vs "full-bleed") where only one actually wants to
   * bleed off the section's normal container.
   */
  bleedsWhen?: (data: TData) => boolean;
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
    height: "auto",
    ...overrides,
  };
}

export function defaultSectionSettings(overrides?: Partial<SectionSettings>): SectionSettings {
  return {
    desktop: defaultStyleTokens(),
    tablet: {},
    mobile: {},
    background: "none",
    containerWidth: "default",
    borderRadius: "none",
    backgroundImage: defaultBackgroundImageSettings(),
    animation: "none",
    gap: "default",
    border: defaultSectionBorderSettings(),
    shadow: "none",
    typography: defaultSectionTypographySettings(),
    buttons: defaultSectionButtonSettings(),
    animationDurationMs: null,
    animationDelayMs: 0,
    animationTrigger: "onScroll",
    animationIntensity: "normal",
    advanced: defaultSectionAdvancedSettings(),
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

function isMediaRef(value: unknown): value is MediaRef {
  return isPlainObject(value) && typeof value.id === "string" && typeof value.url === "string" && value.url.length > 0;
}

function coerceBackgroundImageSettings(raw: unknown): BackgroundImageSettings {
  const defaults = defaultBackgroundImageSettings();
  if (!isPlainObject(raw)) return defaults;
  return {
    ...defaults,
    ...raw,
    image: isMediaRef(raw.image) ? raw.image : null,
    mobileImage: isMediaRef(raw.mobileImage) ? raw.mobileImage : null,
    video: isMediaRef(raw.video) ? raw.video : null,
  };
}

function coerceSectionBorderSettings(raw: unknown): SectionBorderSettings {
  const defaults = defaultSectionBorderSettings();
  if (!isPlainObject(raw)) return defaults;
  return { ...defaults, ...raw } as SectionBorderSettings;
}

function coerceSectionTypographySettings(raw: unknown): SectionTypographySettings {
  const defaults = defaultSectionTypographySettings();
  if (!isPlainObject(raw)) return defaults;
  return { ...defaults, ...raw } as SectionTypographySettings;
}

function coerceSectionButtonSettings(raw: unknown): SectionButtonSettings {
  const defaults = defaultSectionButtonSettings();
  if (!isPlainObject(raw)) return defaults;
  return { ...defaults, ...raw } as SectionButtonSettings;
}

function coerceSectionAdvancedSettings(raw: unknown): SectionAdvancedSettings {
  const defaults = defaultSectionAdvancedSettings();
  if (!isPlainObject(raw)) return defaults;
  return { ...defaults, ...raw } as SectionAdvancedSettings;
}

function coerceSectionSettings(raw: unknown): SectionSettings {
  if (!isPlainObject(raw)) return defaultSectionSettings();
  const desktop = isPlainObject(raw.desktop) ? { ...defaultStyleTokens(), ...(raw.desktop as Partial<StyleTokens>) } : defaultStyleTokens();
  return {
    desktop,
    tablet: isPlainObject(raw.tablet) ? (raw.tablet as Partial<StyleTokens>) : {},
    mobile: isPlainObject(raw.mobile) ? (raw.mobile as Partial<StyleTokens>) : {},
    background: (raw.background as BackgroundToken) ?? "none",
    containerWidth: (raw.containerWidth as ContainerWidthToken) ?? "default",
    borderRadius: (raw.borderRadius as BorderRadiusToken) ?? "none",
    backgroundImage: coerceBackgroundImageSettings(raw.backgroundImage),
    animation: (raw.animation as AnimationToken) ?? "none",
    gap: (raw.gap as GapToken) ?? "default",
    border: coerceSectionBorderSettings(raw.border),
    shadow: (raw.shadow as ShadowToken) ?? "none",
    typography: coerceSectionTypographySettings(raw.typography),
    buttons: coerceSectionButtonSettings(raw.buttons),
    animationDurationMs: typeof raw.animationDurationMs === "number" ? raw.animationDurationMs : null,
    animationDelayMs: typeof raw.animationDelayMs === "number" ? raw.animationDelayMs : 0,
    animationTrigger: (raw.animationTrigger as AnimationTriggerToken) ?? "onScroll",
    animationIntensity: (raw.animationIntensity as AnimationIntensityToken) ?? "normal",
    advanced: coerceSectionAdvancedSettings(raw.advanced),
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
