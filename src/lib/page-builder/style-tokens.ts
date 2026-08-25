import type { CSSProperties } from "react";
import type {
  AlignToken,
  BackgroundImageSettings,
  BackgroundToken,
  BodySizeToken,
  Breakpoint,
  ColumnsToken,
  HeadingSizeToken,
  MarginToken,
  OverlayToken,
  PaddingToken,
  SectionSettings,
  StyleTokens,
} from "./types";

/**
 * Tailwind v4's JIT scanner does a literal text scan of source files for class
 * substrings -- it does not trace runtime string concatenation. Every table below
 * must therefore spell out each breakpoint variant as a complete literal string
 * (e.g. "md:py-12"), never assembled at runtime via `"md:" + token`. Do not
 * "simplify" these tables into a prefix-concatenation helper -- that silently
 * breaks styling in production builds while looking identical in dev.
 */

const PADDING_Y_BASE: Record<PaddingToken, string> = {
  none: "py-0",
  sm: "py-6",
  md: "py-12",
  lg: "py-16",
  xl: "py-24",
};
const PADDING_Y_MD: Record<PaddingToken, string> = {
  none: "md:py-0",
  sm: "md:py-8",
  md: "md:py-14",
  lg: "md:py-20",
  xl: "md:py-28",
};
const PADDING_Y_LG: Record<PaddingToken, string> = {
  none: "lg:py-0",
  sm: "lg:py-10",
  md: "lg:py-16",
  lg: "lg:py-24",
  xl: "lg:py-32",
};

const MARGIN_Y_BASE: Record<MarginToken, string> = {
  none: "my-0",
  sm: "my-4",
  md: "my-8",
  lg: "my-12",
};
const MARGIN_Y_MD: Record<MarginToken, string> = {
  none: "md:my-0",
  sm: "md:my-6",
  md: "md:my-10",
  lg: "md:my-16",
};
const MARGIN_Y_LG: Record<MarginToken, string> = {
  none: "lg:my-0",
  sm: "lg:my-8",
  md: "lg:my-12",
  lg: "lg:my-20",
};

// Root-cause fix for "half-flipped" alignment in Arabic: `AlignToken`'s stored values ("left"/
// "right") are kept as-is to avoid a data migration for every already-saved PageSection, but they
// now resolve to Tailwind's LOGICAL alignment utilities (text-start/text-end), not the physical
// text-left/text-right. `text-align: start` natively means "left in LTR, right in RTL" -- the
// browser resolves it from the element's `dir`, so no locale check is needed here. `items-start`/
// `items-end` (align-items: flex-start/flex-end) were already logical/direction-aware and are
// unchanged. Editor-facing labels for this token are "Start"/"Center"/"End" (see settings-panel.tsx)
// so nobody reads "left" here and assumes it means physical left in Arabic.
const ALIGN_BASE: Record<AlignToken, string> = {
  left: "text-start items-start",
  center: "text-center items-center",
  right: "text-end items-end",
};
const ALIGN_MD: Record<AlignToken, string> = {
  left: "md:text-start md:items-start",
  center: "md:text-center md:items-center",
  right: "md:text-end md:items-end",
};
const ALIGN_LG: Record<AlignToken, string> = {
  left: "lg:text-start lg:items-start",
  center: "lg:text-center lg:items-center",
  right: "lg:text-end lg:items-end",
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
  return {
    backgroundImage: `url(${image.url})`,
    backgroundSize: bg.size === "custom" ? bg.customSize || "auto" : bg.size,
    backgroundPosition: `${bg.positionX}% ${bg.positionY}%`,
    backgroundRepeat: bg.repeat,
    backgroundAttachment: bg.attachment,
  };
}

/** CSS for the overlay layer that sits above the background image and below content (FIX §19-20). */
export function resolveOverlayStyle(bg: BackgroundImageSettings): CSSProperties | null {
  if (bg.overlay === "none" || !bg.image?.url) return null;
  const opacity = Math.min(100, Math.max(0, bg.overlayOpacity)) / 100;
  switch (bg.overlay) {
    case "light":
      return { backgroundColor: `rgba(255,255,255,${opacity})` };
    case "dark":
      return { backgroundColor: `rgba(11,28,44,${opacity})` };
    case "gradient":
      return { backgroundImage: `linear-gradient(to top, rgba(11,28,44,${opacity}), rgba(11,28,44,0))` };
    case "custom": {
      const rgb = hexToRgb(bg.overlayColor) ?? { r: 11, g: 28, b: 44 };
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
export const ALIGN_OPTIONS: AlignToken[] = ["left", "center", "right"];
export const COLUMNS_OPTIONS: ColumnsToken[] = ["1", "2", "3", "4"];
export const HEADING_SIZE_OPTIONS: HeadingSizeToken[] = ["sm", "md", "lg", "xl", "2xl"];
export const BODY_SIZE_OPTIONS: BodySizeToken[] = ["sm", "md", "lg"];
export const BACKGROUND_OPTIONS: BackgroundToken[] = ["none", "paper", "frost", "ink", "harbor", "wheat-soft"];
