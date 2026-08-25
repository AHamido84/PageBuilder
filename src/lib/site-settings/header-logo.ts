/**
 * Per-locale header logo configuration (Admin > Settings > General).
 *
 * Root-cause fix for two bugs in the old flat `logoHeightDesktop`/`logoHeightMobile`/`logoAlign`
 * columns: (1) `logoAlign` was resolved to a hardcoded physical CSS value (`"left center"`/
 * `"right center"`) with no awareness of the page's `dir`, so "start" always meant visual-left even
 * in Arabic -- see `resolveLogoObjectPosition` below, which is now the single place that maps a
 * logical align token to a physical CSS value, given the actual `dir`. (2) every logo control was a
 * single value shared by both languages, so Arabic and English could never diverge -- this type is
 * now locale-keyed like Page Builder's `LocaleSectionSettings`, for the same reason.
 */

export type LogoAlign = "start" | "center" | "end";
export type Dir = "ltr" | "rtl";

export interface HeaderLogoLocaleSettings {
  heightDesktop: number;
  heightMobile: number;
  /** null = auto (derived from height, same as the pre-fix behavior) so existing sites render unchanged until an admin sets an explicit width. */
  widthDesktop: number | null;
  widthMobile: number | null;
  /** Caps the rendered width regardless of the image's natural aspect ratio; null = no cap. */
  maxWidth: number | null;
  /** Logical alignment within the logo's box -- resolved to a physical CSS value at render time via `resolveLogoObjectPosition`, never stored as a physical left/right value. */
  align: LogoAlign;
  /** Gap (px) between the logo and the nav/actions that follow it. */
  spacing: number;
  /** Whether the header bar stays fixed to the viewport top on scroll. */
  sticky: boolean;
  /** Hides the logo image entirely for this locale (falls back to the site name in text). */
  hidden: boolean;
}

export type HeaderLogoSettings = Record<"en" | "ar", HeaderLogoLocaleSettings>;

export const HEADER_LOGO_DEFAULTS: HeaderLogoLocaleSettings = {
  heightDesktop: 56,
  heightMobile: 44,
  widthDesktop: null,
  widthMobile: null,
  maxWidth: null,
  align: "start",
  spacing: 10,
  sticky: true,
  hidden: false,
};

export function defaultHeaderLogoLocaleSettings(overrides?: Partial<HeaderLogoLocaleSettings>): HeaderLogoLocaleSettings {
  return { ...HEADER_LOGO_DEFAULTS, ...overrides };
}

export function defaultHeaderLogoSettings(): HeaderLogoSettings {
  return { en: defaultHeaderLogoLocaleSettings(), ar: defaultHeaderLogoLocaleSettings() };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function coerceNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coerceLocaleSettings(raw: unknown): HeaderLogoLocaleSettings {
  const defaults = HEADER_LOGO_DEFAULTS;
  if (!isPlainObject(raw)) return { ...defaults };
  const align: LogoAlign = raw.align === "center" || raw.align === "end" ? raw.align : "start";
  return {
    heightDesktop: coerceNumber(raw.heightDesktop, defaults.heightDesktop),
    heightMobile: coerceNumber(raw.heightMobile, defaults.heightMobile),
    widthDesktop: coerceNullableNumber(raw.widthDesktop),
    widthMobile: coerceNullableNumber(raw.widthMobile),
    maxWidth: coerceNullableNumber(raw.maxWidth),
    align,
    spacing: coerceNumber(raw.spacing, defaults.spacing),
    sticky: typeof raw.sticky === "boolean" ? raw.sticky : defaults.sticky,
    hidden: typeof raw.hidden === "boolean" ? raw.hidden : defaults.hidden,
  };
}

/** Reads a `SiteSetting.headerLogo` JSON value, tolerating missing/malformed input (pre-migration rows have none at all). */
export function normalizeHeaderLogoSettings(raw: unknown): HeaderLogoSettings {
  if (!isPlainObject(raw)) return defaultHeaderLogoSettings();
  return { en: coerceLocaleSettings(raw.en), ar: coerceLocaleSettings(raw.ar) };
}

/**
 * Resolves a logical align token to a physical CSS `object-position` value given the page's actual
 * `dir` -- the root-cause fix for the RTL logo bug. "start" means "reading start", which is the
 * LEFT edge in LTR (English) but the RIGHT edge in RTL (Arabic); "end" is the mirror image. Never
 * hardcode "left"/"right" from a locale check anywhere else -- always go through this function.
 */
export function resolveLogoObjectPosition(align: LogoAlign, dir: Dir): string {
  if (align === "center") return "center";
  const isStart = align === "start";
  const isLeft = dir === "rtl" ? !isStart : isStart;
  return isLeft ? "left center" : "right center";
}
