import type { CSSProperties } from "react";
import type {
  AlignToken,
  AnimationIntensityToken,
  AnimationTriggerToken,
  BackgroundImageSettings,
  BackgroundToken,
  BodySizeToken,
  BorderColorToken,
  BorderRadiusToken,
  BorderStyleToken,
  BorderWidthToken,
  Breakpoint,
  ButtonPaddingToken,
  ButtonRadiusToken,
  ButtonShadowToken,
  ColumnsToken,
  ContainerWidthToken,
  FontWeightToken,
  GapToken,
  HeadingSizeToken,
  LineHeightToken,
  MarginToken,
  OverlayToken,
  PaddingToken,
  SectionBorderSettings,
  SectionButtonSettings,
  SectionHeightToken,
  SectionSettings,
  SectionTypographySettings,
  ShadowToken,
  StyleTokens,
  TextColorToken,
} from "./types";

/**
 * Tailwind v4's JIT scanner does a literal text scan of source files for class
 * substrings -- it does not trace runtime string concatenation. Every table below
 * must therefore spell out each breakpoint variant as a complete literal string
 * (e.g. "md:py-12"), never assembled at runtime via `"md:" + token`. Do not
 * "simplify" these tables into a prefix-concatenation helper -- that silently
 * breaks styling in production builds while looking identical in dev.
 */

// Phase 8 "Global Visual Control Center": each non-zero tier is wrapped in
// calc(<literal rem> * var(--section-spacing-scale,1)) -- a real, JIT-safe literal string (no
// runtime concatenation, see the file-level comment above), so a global Section Spacing override
// scales every one of these at once. --section-spacing-scale defaults to 1 in globals.css, so
// calc(3rem * 1) === 3rem: byte-for-byte the same computed value as the old plain "py-12" for
// every already-published section, until an admin actually changes the global scale.
const PADDING_Y_BASE: Record<PaddingToken, string> = {
  none: "py-0",
  sm: "py-[calc(1.5rem*var(--section-spacing-scale,1))]",
  md: "py-[calc(3rem*var(--section-spacing-scale,1))]",
  lg: "py-[calc(4rem*var(--section-spacing-scale,1))]",
  xl: "py-[calc(6rem*var(--section-spacing-scale,1))]",
};
const PADDING_Y_MD: Record<PaddingToken, string> = {
  none: "md:py-0",
  sm: "md:py-[calc(2rem*var(--section-spacing-scale,1))]",
  md: "md:py-[calc(3.5rem*var(--section-spacing-scale,1))]",
  lg: "md:py-[calc(5rem*var(--section-spacing-scale,1))]",
  xl: "md:py-[calc(7rem*var(--section-spacing-scale,1))]",
};
const PADDING_Y_LG: Record<PaddingToken, string> = {
  none: "lg:py-0",
  sm: "lg:py-[calc(2.5rem*var(--section-spacing-scale,1))]",
  md: "lg:py-[calc(4rem*var(--section-spacing-scale,1))]",
  lg: "lg:py-[calc(6rem*var(--section-spacing-scale,1))]",
  xl: "lg:py-[calc(8rem*var(--section-spacing-scale,1))]",
};

// Same var(--section-spacing-scale) treatment as PADDING_Y above.
const MARGIN_Y_BASE: Record<MarginToken, string> = {
  none: "my-0",
  sm: "my-[calc(1rem*var(--section-spacing-scale,1))]",
  md: "my-[calc(2rem*var(--section-spacing-scale,1))]",
  lg: "my-[calc(3rem*var(--section-spacing-scale,1))]",
};
const MARGIN_Y_MD: Record<MarginToken, string> = {
  none: "md:my-0",
  sm: "md:my-[calc(1.5rem*var(--section-spacing-scale,1))]",
  md: "md:my-[calc(2.5rem*var(--section-spacing-scale,1))]",
  lg: "md:my-[calc(4rem*var(--section-spacing-scale,1))]",
};
const MARGIN_Y_LG: Record<MarginToken, string> = {
  none: "lg:my-0",
  sm: "lg:my-[calc(2rem*var(--section-spacing-scale,1))]",
  md: "lg:my-[calc(3rem*var(--section-spacing-scale,1))]",
  lg: "lg:my-[calc(5rem*var(--section-spacing-scale,1))]",
};

// Root-cause fix for "half-flipped" alignment in Arabic: `AlignToken`'s stored values ("left"/
// "right") are kept as-is to avoid a data migration for every already-saved PageSection, but they
// now resolve to Tailwind's LOGICAL alignment utilities (text-start/text-end), not the physical
// text-left/text-right. `text-align: start` natively means "left in LTR, right in RTL" -- the
// browser resolves it from the element's `dir`, so no locale check is needed here. `items-start`/
// `items-end` (align-items: flex-start/flex-end) were already logical/direction-aware and are
// unchanged. Editor-facing labels for this token are "Start"/"Center"/"End" (see settings-panel.tsx)
// so nobody reads "left" here and assumes it means physical left in Arabic.
//
// Each value also sets --pb-box-s / --pb-box-e (inline-start / inline-end margins) so a block with a
// narrow box (e.g. the contact-details card) can follow the section's alignment:
//   className="ms-[var(--pb-box-s,0)] me-[var(--pb-box-e,auto)]"
const ALIGN_BASE: Record<AlignToken, string> = {
  left: "text-start items-start [--pb-box-s:0] [--pb-box-e:auto]",
  center: "text-center items-center [--pb-box-s:auto] [--pb-box-e:auto]",
  right: "text-end items-end [--pb-box-s:auto] [--pb-box-e:0]",
  "phys-right": "text-right ltr:items-end rtl:items-start ltr:[--pb-box-s:auto] ltr:[--pb-box-e:0] rtl:[--pb-box-s:0] rtl:[--pb-box-e:auto]",
  "phys-left": "text-left ltr:items-start rtl:items-end ltr:[--pb-box-s:0] ltr:[--pb-box-e:auto] rtl:[--pb-box-s:auto] rtl:[--pb-box-e:0]",
  justify: "text-justify items-start [--pb-box-s:0] [--pb-box-e:auto]",
};
const ALIGN_MD: Record<AlignToken, string> = {
  left: "md:text-start md:items-start md:[--pb-box-s:0] md:[--pb-box-e:auto]",
  center: "md:text-center md:items-center md:[--pb-box-s:auto] md:[--pb-box-e:auto]",
  right: "md:text-end md:items-end md:[--pb-box-s:auto] md:[--pb-box-e:0]",
  "phys-right": "md:text-right ltr:md:items-end rtl:md:items-start ltr:md:[--pb-box-s:auto] ltr:md:[--pb-box-e:0] rtl:md:[--pb-box-s:0] rtl:md:[--pb-box-e:auto]",
  "phys-left": "md:text-left ltr:md:items-start rtl:md:items-end ltr:md:[--pb-box-s:0] ltr:md:[--pb-box-e:auto] rtl:md:[--pb-box-s:auto] rtl:md:[--pb-box-e:0]",
  justify: "md:text-justify md:items-start md:[--pb-box-s:0] md:[--pb-box-e:auto]",
};
const ALIGN_LG: Record<AlignToken, string> = {
  left: "lg:text-start lg:items-start lg:[--pb-box-s:0] lg:[--pb-box-e:auto]",
  center: "lg:text-center lg:items-center lg:[--pb-box-s:auto] lg:[--pb-box-e:auto]",
  right: "lg:text-end lg:items-end lg:[--pb-box-s:auto] lg:[--pb-box-e:0]",
  "phys-right": "lg:text-right ltr:lg:items-end rtl:lg:items-start ltr:lg:[--pb-box-s:auto] ltr:lg:[--pb-box-e:0] rtl:lg:[--pb-box-s:0] rtl:lg:[--pb-box-e:auto]",
  "phys-left": "lg:text-left ltr:lg:items-start rtl:lg:items-end ltr:lg:[--pb-box-s:0] ltr:lg:[--pb-box-e:auto] rtl:lg:[--pb-box-s:auto] rtl:lg:[--pb-box-e:0]",
  justify: "lg:text-justify lg:items-start lg:[--pb-box-s:0] lg:[--pb-box-e:auto]",
};

const COLUMNS_BASE: Record<ColumnsToken, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1",
  "3": "grid-cols-1",
  "4": "grid-cols-2",
};
const COLUMNS_MD: Record<ColumnsToken, string> = {
  "1": "md:grid-cols-1",
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-2",
  "4": "md:grid-cols-3",
};
const COLUMNS_LG: Record<ColumnsToken, string> = {
  "1": "lg:grid-cols-1",
  "2": "lg:grid-cols-2",
  "3": "lg:grid-cols-3",
  "4": "lg:grid-cols-4",
};

const HEADING_SIZE_BASE: Record<HeadingSizeToken, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
  "2xl": "text-5xl",
};
const HEADING_SIZE_MD: Record<HeadingSizeToken, string> = {
  sm: "md:text-2xl",
  md: "md:text-3xl",
  lg: "md:text-4xl",
  xl: "md:text-5xl",
  "2xl": "md:text-6xl",
};
const HEADING_SIZE_LG: Record<HeadingSizeToken, string> = {
  sm: "lg:text-2xl",
  md: "lg:text-3xl",
  lg: "lg:text-[2.75rem]",
  xl: "lg:text-6xl",
  "2xl": "lg:text-7xl",
};

const BODY_SIZE_BASE: Record<BodySizeToken, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};
const BODY_SIZE_MD: Record<BodySizeToken, string> = {
  sm: "md:text-sm",
  md: "md:text-base",
  lg: "md:text-lg",
};
const BODY_SIZE_LG: Record<BodySizeToken, string> = {
  sm: "lg:text-sm",
  md: "lg:text-base",
  lg: "lg:text-xl",
};

const VISIBLE_BASE: Record<"true" | "false", string> = {
  true: "block",
  false: "hidden",
};
const VISIBLE_MD: Record<"true" | "false", string> = {
  true: "md:block",
  false: "md:hidden",
};
const VISIBLE_LG: Record<"true" | "false", string> = {
  true: "lg:block",
  false: "lg:hidden",
};

export const BACKGROUND_CLASSES: Record<BackgroundToken, string> = {
  none: "",
  paper: "bg-paper text-ink",
  ink: "bg-ink text-paper",
  harbor: "bg-harbor-soft text-ink",
  frost: "bg-frost text-ink",
  "wheat-soft": "bg-wheat-soft text-ink",
};

// Phase 2 "Height" section setting -- literal per-breakpoint tables, same JIT-safety rule as every
// other table in this file. "auto" is empty (no class at all) so it's a true no-op, matching every
// already-published section's current behavior exactly.
const HEIGHT_BASE: Record<SectionHeightToken, string> = {
  auto: "",
  sm: "min-h-[320px]",
  md: "min-h-[480px]",
  lg: "min-h-[640px]",
  xl: "min-h-[800px]",
  screen: "min-h-screen",
};
const HEIGHT_MD: Record<SectionHeightToken, string> = {
  auto: "",
  sm: "md:min-h-[360px]",
  md: "md:min-h-[520px]",
  lg: "md:min-h-[680px]",
  xl: "md:min-h-[860px]",
  screen: "md:min-h-screen",
};
const HEIGHT_LG: Record<SectionHeightToken, string> = {
  auto: "",
  sm: "lg:min-h-[400px]",
  md: "lg:min-h-[560px]",
  lg: "lg:min-h-[720px]",
  xl: "lg:min-h-[920px]",
  screen: "lg:min-h-screen",
};

// Phase 2 "Border Radius" section setting. Reuses the same radius tokens the rest of the app
// already uses (Phase 1 added --radius-xl); "none" is empty, matching current behavior.
export const BORDER_RADIUS_CLASSES: Record<BorderRadiusToken, string> = {
  none: "",
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
};

// Phase 2 "Container Width" section setting -- deliberately independent of `BlockDefinition.bleedsWhen`
// (the "this block fully owns an edge-to-edge composition, skip ALL section chrome" escape hatch
// Hero's full-bleed layout uses). This only widens/narrows the *inner* content container that still
// sits inside the section's normal background/padding/animation chrome -- "full" drops the max-width
// cap but keeps the same responsive side padding, so content doesn't touch the viewport edge. Only
// applied when the block isn't already bleeding (see SectionShell) -- a bleeding block's own Render
// already assumes it's the unconstrained direct child of its section, so this setting has no effect
// on it either way. "default"/"contained" are identical -- both are today's exact existing classes.
// Phase 8: now genuinely reads --container-max (globals.css) instead of repeating the literal
// 1400px -- that variable already existed but was previously unused anywhere in the app (dead
// token). Its default value is still 1400px, so this is a zero-visual-change fix that also makes
// the Global Visual Control Center's Container Width setting actually take effect.
export const CONTAINER_WIDTH_CLASSES: Record<ContainerWidthToken, string> = {
  default: "mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12",
  contained: "mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8 lg:px-12",
  full: "w-full px-5 sm:px-8 lg:px-12",
};

// Phase 9 "Layout > Gap" -- overrides the SAME --grid-gap/--card-gap CSS custom properties the
// Phase 8 Global Visual Control Center already defines site-wide (design-tokens/resolve-css.ts),
// scoped to one section via an inline style on its wrapper (see SectionShell) -- ordinary CSS
// custom-property inheritance means every grid block inside that already reads `var(--grid-gap,...)`/
// `var(--card-gap,...)` (Product Grid, Category/Brand Grid, Icon Cards, Testimonials) picks up the
// override for free, with zero per-block code changes. "default" emits no override at all.
const GAP_REM: Record<Exclude<GapToken, "default">, string> = {
  none: "0rem",
  sm: "0.75rem",
  md: "1.25rem",
  lg: "2rem",
  xl: "3rem",
};

export function resolveGapStyle(gap: GapToken): CSSProperties | undefined {
  if (gap === "default") return undefined;
  const rem = GAP_REM[gap];
  return { "--grid-gap": rem, "--card-gap": rem } as CSSProperties;
}

// Phase 9 "Style > Border" -- plain Tailwind utility classes (not arbitrary-value brackets), so
// there's no JIT literal-string requirement beyond what's already true of every class in this file.
const BORDER_WIDTH_CLASSES: Record<BorderWidthToken, string> = {
  none: "",
  thin: "border",
  medium: "border-2",
  thick: "border-4",
};
const BORDER_STYLE_CLASSES: Record<BorderStyleToken, string> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};
// "custom" resolves to no color class -- the caller applies `borderColor` via inline style instead
// (see resolveBorderStyle), since an admin-picked hex can't be a literal Tailwind class.
const BORDER_COLOR_CLASSES: Record<BorderColorToken, string> = {
  ink: "border-line-strong",
  petrol: "border-petrol",
  coral: "border-coral",
  wheat: "border-wheat",
  frost: "border-frost",
  custom: "",
};

export function resolveBorderClasses(border: SectionBorderSettings): string {
  if (border.width === "none") return "";
  return [BORDER_WIDTH_CLASSES[border.width], BORDER_STYLE_CLASSES[border.style], BORDER_COLOR_CLASSES[border.color]].filter(Boolean).join(" ");
}

export function resolveBorderStyle(border: SectionBorderSettings): CSSProperties | undefined {
  if (border.width === "none" || border.color !== "custom") return undefined;
  return { borderColor: border.customColor || undefined };
}

// Phase 9 "Style > Shadow" -- plain Tailwind shadow utilities (not the --shadow-* variable set
// Buttons/Cards use, which are tuned for those smaller surfaces specifically).
export const SHADOW_CLASSES: Record<ShadowToken, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

// Phase 9 "Typography" tab overrides -- applied as classes on SectionShell's content wrapper, the
// same "ancestor sets it, only descendants that don't already set their own explicit value inherit
// it" convention the existing `align` token already relies on (ALIGN_BASE above). A block whose own
// markup hardcodes e.g. `text-ink` on its heading is unaffected by a section-level Typography >
// Color override -- documented scope limit, not a retrofit of every block's own text classes.
const FONT_WEIGHT_CLASSES: Record<FontWeightToken, string> = {
  inherit: "",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};
const LINE_HEIGHT_CLASSES: Record<LineHeightToken, string> = {
  inherit: "",
  tight: "leading-tight",
  snug: "leading-snug",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
};
// Reuses the exact same CSS custom properties (--color-ink/petrol/coral/wheat/muted-text) Phase 8's
// Global Colors layer already defines -- a section picking e.g. "Petrol" here still respects an
// admin's global Secondary color override, since both ultimately read the same variable. "muted"
// uses the arbitrary-value form (`text-[var(--color-muted-text)]`) rather than a plain `text-*`
// utility -- unlike ink/petrol/coral/wheat, `--color-muted-text` (globals.css) is not yet registered
// in the `@theme inline` block, so `text-muted-text` would not be a real Tailwind class. This is a
// real, literal (non-interpolated) string, so it's JIT-safe per the file-level comment.
const TEXT_COLOR_CLASSES: Record<TextColorToken, string> = {
  inherit: "",
  ink: "text-ink",
  petrol: "text-petrol",
  coral: "text-coral",
  wheat: "text-wheat",
  muted: "text-[var(--color-muted-text)]",
};

export function resolveTypographyClasses(typography: SectionTypographySettings): string {
  return [FONT_WEIGHT_CLASSES[typography.weight], LINE_HEIGHT_CLASSES[typography.lineHeight], TEXT_COLOR_CLASSES[typography.color]].filter(Boolean).join(" ");
}

// Phase 9 "Buttons" tab -- see SectionButtonSettings' doc comment (types.ts): these override the
// SAME --button-radius/--button-shadow/--button-padding-scale variables Phase 8 defines at :root,
// scoped to one section via inline style (SectionShell), so every Button inside it picks up the
// override through ordinary CSS custom-property inheritance -- no new resolution mechanism.
const BUTTON_RADIUS_REM: Record<Exclude<ButtonRadiusToken, "inherit">, string> = {
  none: "0rem",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "1rem",
  full: "9999px",
};
const BUTTON_SHADOW_VAR: Record<Exclude<ButtonShadowToken, "inherit">, string> = {
  none: "none",
  flat: "var(--shadow-flat)",
  card: "var(--shadow-card)",
  lifted: "var(--shadow-lifted)",
};
const BUTTON_PADDING_SCALE: Record<Exclude<ButtonPaddingToken, "inherit">, string> = {
  compact: "0.75",
  default: "1",
  spacious: "1.35",
};

export function resolveButtonsStyle(buttons: SectionButtonSettings): CSSProperties | undefined {
  const style: Record<string, string> = {};
  if (buttons.radius !== "inherit") style["--button-radius"] = BUTTON_RADIUS_REM[buttons.radius];
  if (buttons.shadow !== "inherit") style["--button-shadow"] = BUTTON_SHADOW_VAR[buttons.shadow];
  if (buttons.paddingScale !== "inherit") style["--button-padding-scale"] = BUTTON_PADDING_SCALE[buttons.paddingScale];
  return Object.keys(style).length ? (style as CSSProperties) : undefined;
}

// A literal (non-interpolated) Tailwind arbitrary-variant string -- JIT-safe per the file-level
// comment, since it's spelled out here verbatim rather than assembled from a token at runtime.
export function resolveButtonsIconClass(buttons: SectionButtonSettings): string {
  if (buttons.icon === "hide") return "[&_.btn-icon]:hidden";
  if (buttons.icon === "show") return "[&_.btn-icon]:inline-flex";
  return "";
}

function resolveBreakpointTokens(settings: SectionSettings): Record<Breakpoint, StyleTokens> {
  const mobile: StyleTokens = { ...settings.desktop, ...settings.tablet, ...settings.mobile };
  const tablet: StyleTokens = { ...settings.desktop, ...settings.tablet };
  return { mobile, tablet, desktop: settings.desktop };
}

/** Resolves a section's responsive settings into a single literal Tailwind class string. */
export function resolveSectionClasses(settings: SectionSettings): string {
  const { mobile, tablet, desktop } = resolveBreakpointTokens(settings);

  const classes: string[] = [
    PADDING_Y_BASE[mobile.paddingY],
    PADDING_Y_MD[tablet.paddingY],
    PADDING_Y_LG[desktop.paddingY],
    MARGIN_Y_BASE[mobile.marginY],
    MARGIN_Y_MD[tablet.marginY],
    MARGIN_Y_LG[desktop.marginY],
    ALIGN_BASE[mobile.align],
    ALIGN_MD[tablet.align],
    ALIGN_LG[desktop.align],
    VISIBLE_BASE[mobile.visible ? "true" : "false"],
    VISIBLE_MD[tablet.visible ? "true" : "false"],
    VISIBLE_LG[desktop.visible ? "true" : "false"],
    HEIGHT_BASE[mobile.height ?? "auto"],
    HEIGHT_MD[tablet.height ?? "auto"],
    HEIGHT_LG[desktop.height ?? "auto"],
    BACKGROUND_CLASSES[settings.background],
  ];

  return classes.filter(Boolean).join(" ");
}

/** Resolves just the grid-columns classes for blocks with supportsColumns:true. */
export function resolveColumnsClasses(settings: SectionSettings): string {
  const { mobile, tablet, desktop } = resolveBreakpointTokens(settings);
  return [COLUMNS_BASE[mobile.columns], COLUMNS_MD[tablet.columns], COLUMNS_LG[desktop.columns]].join(" ");
}

export function resolveHeadingClasses(settings: SectionSettings): string {
  const { mobile, tablet, desktop } = resolveBreakpointTokens(settings);
  return [HEADING_SIZE_BASE[mobile.headingSize], HEADING_SIZE_MD[tablet.headingSize], HEADING_SIZE_LG[desktop.headingSize]].join(" ");
}

export function resolveBodyClasses(settings: SectionSettings): string {
  const { mobile, tablet, desktop } = resolveBreakpointTokens(settings);
  return [BODY_SIZE_BASE[mobile.bodySize], BODY_SIZE_MD[tablet.bodySize], BODY_SIZE_LG[desktop.bodySize]].join(" ");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

/**
 * CSS for the section's optional background-image layer (desktop or mobile variant -- mobile
 * falls back to the desktop image when no dedicated mobile image is set, per FIX §13/§21). Returns
 * null when no image is configured for that variant, so the caller can skip rendering the layer
 * entirely rather than leaving an empty positioned div in the DOM.
 */
export function resolveBackgroundImageStyle(bg: BackgroundImageSettings, variant: "desktop" | "mobile"): CSSProperties | null {
  const image = variant === "mobile" ? (bg.mobileImage ?? bg.image) : bg.image;
  if (!image?.url) return null;
  const filter = resolveBackgroundFilter(bg);
  return {
    backgroundImage: `url(${image.url})`,
    backgroundSize: bg.size === "custom" ? bg.customSize || "auto" : bg.size,
    backgroundPosition: `${bg.positionX}% ${bg.positionY}%`,
    backgroundRepeat: bg.repeat,
    backgroundAttachment: bg.attachment,
    filter: filter || undefined,
    // A blurred element still renders its own sharp edges at the element boundary -- scaling up
    // slightly pushes those hard edges outside the visible (overflow-hidden) section so only the
    // blurred interior shows, the standard fix for "blurred background with a visible edge seam."
    transform: bg.blur > 0 ? "scale(1.1)" : undefined,
  };
}

export function resolveBackgroundFilter(bg: BackgroundImageSettings): string {
  const parts: string[] = [];
  if (bg.blur > 0) parts.push(`blur(${bg.blur}px)`);
  if (bg.brightness !== 100) parts.push(`brightness(${bg.brightness}%)`);
  if (bg.contrast !== 100) parts.push(`contrast(${bg.contrast}%)`);
  return parts.join(" ");
}

/** CSS for the overlay layer that sits above the background image and below content (FIX §19-20). */
export function resolveOverlayStyle(bg: BackgroundImageSettings): CSSProperties | null {
  if (bg.overlay === "none" || !bg.image?.url) return null;
  const opacity = Math.min(100, Math.max(0, bg.overlayOpacity)) / 100;
  switch (bg.overlay) {
    case "light":
      return { backgroundColor: `rgba(255,255,255,${opacity})` };
    case "dark":
      return { backgroundColor: `rgba(24,48,45,${opacity})` };
    case "gradient":
      return { backgroundImage: `linear-gradient(to top, rgba(24,48,45,${opacity}), rgba(24,48,45,0))` };
    case "custom": {
      const rgb = hexToRgb(bg.overlayColor) ?? { r: 24, g: 48, b: 45 };
      return { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})` };
    }
    default:
      return null;
  }
}

export const OVERLAY_OPTIONS: OverlayToken[] = ["none", "light", "dark", "gradient", "custom"];
export const BACKGROUND_SIZE_OPTIONS = ["cover", "contain", "custom"] as const;
export const BACKGROUND_REPEAT_OPTIONS = ["no-repeat", "repeat", "repeat-x", "repeat-y"] as const;
export const BACKGROUND_ATTACHMENT_OPTIONS = ["scroll", "fixed"] as const;

export const PADDING_OPTIONS: PaddingToken[] = ["none", "sm", "md", "lg", "xl"];
export const MARGIN_OPTIONS: MarginToken[] = ["none", "sm", "md", "lg"];
export const ALIGN_OPTIONS: AlignToken[] = ["left", "phys-right", "center", "phys-left", "justify", "right"];
export const COLUMNS_OPTIONS: ColumnsToken[] = ["1", "2", "3", "4"];
export const HEADING_SIZE_OPTIONS: HeadingSizeToken[] = ["sm", "md", "lg", "xl", "2xl"];
export const BODY_SIZE_OPTIONS: BodySizeToken[] = ["sm", "md", "lg"];
export const BACKGROUND_OPTIONS: BackgroundToken[] = ["none", "paper", "frost", "ink", "harbor", "wheat-soft"];
export const HEIGHT_OPTIONS: SectionHeightToken[] = ["auto", "sm", "md", "lg", "xl", "screen"];
export const CONTAINER_WIDTH_OPTIONS: ContainerWidthToken[] = ["default", "full", "contained"];
export const BORDER_RADIUS_OPTIONS: BorderRadiusToken[] = ["none", "sm", "md", "lg", "xl"];

export const GAP_OPTIONS: GapToken[] = ["default", "none", "sm", "md", "lg", "xl"];
export const SHADOW_OPTIONS: ShadowToken[] = ["none", "sm", "md", "lg", "xl"];
export const BORDER_WIDTH_OPTIONS: BorderWidthToken[] = ["none", "thin", "medium", "thick"];
export const BORDER_STYLE_OPTIONS: BorderStyleToken[] = ["solid", "dashed", "dotted"];
export const BORDER_COLOR_OPTIONS: BorderColorToken[] = ["ink", "petrol", "coral", "wheat", "frost", "custom"];
export const FONT_WEIGHT_OPTIONS: FontWeightToken[] = ["inherit", "normal", "medium", "semibold", "bold"];
export const LINE_HEIGHT_OPTIONS: LineHeightToken[] = ["inherit", "tight", "snug", "normal", "relaxed", "loose"];
export const TEXT_COLOR_OPTIONS: TextColorToken[] = ["inherit", "ink", "petrol", "coral", "wheat", "muted"];
export const BUTTON_RADIUS_OPTIONS: ButtonRadiusToken[] = ["inherit", "none", "sm", "md", "lg", "full"];
export const BUTTON_SHADOW_OPTIONS: ButtonShadowToken[] = ["inherit", "none", "flat", "card", "lifted"];
export const BUTTON_PADDING_OPTIONS: ButtonPaddingToken[] = ["inherit", "compact", "default", "spacious"];
export const ANIMATION_TRIGGER_OPTIONS: AnimationTriggerToken[] = ["onScroll", "onScrollRepeat", "onLoad"];
export const ANIMATION_INTENSITY_OPTIONS: AnimationIntensityToken[] = ["subtle", "normal", "strong"];
