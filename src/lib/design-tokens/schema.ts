import { z } from "zod";

/**
 * Global Visual Theme Engine (originally Phase 8 "Global Visual Control Center") -- every field
 * here is optional by design: unset = "inherit the site's existing default" (the value already in
 * globals.css/components), never a forced value. An admin who never touches the Appearance page
 * gets a site that renders exactly as it did before this system existed. See resolve-css.ts for
 * how these become CSS, and /admin/appearance for the editor.
 */

const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Must be a hex color like #ee665a")
  .optional();

/** Button colors may also be fully transparent (e.g. an outline button's fill). */
const buttonColor = z
  .union([z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Must be a hex color like #ee665a"), z.literal("transparent")])
  .optional();

/**
 * Role -> palette variable each color drives (resolve-css.ts):
 *   primary    -> --color-petrol  (brand green: secondary buttons, footer, dark brand surfaces) = --color-primary
 *   secondary  -> --color-coral   (CTA accent: primary buttons by default)                       = --color-secondary
 *   accent     -> --color-harbor  (links, labels, highlights)
 *   gold       -> --color-wheat   (gold buttons, badges, focus rings)
 *   background -> --color-paper   (page background)
 *   surface    -> --color-frost   (alternate section/card surface)
 *   text       -> --color-ink     (body text and dark neutral surfaces)
 *   mutedText  -> --color-muted-text
 *   border     -> --color-border  (hairline borders: border-line / border-line-strong)
 *
 * Version 1 data (saved before `version: 2` existed) used primary -> coral and secondary -> petrol;
 * parseDesignTokens swaps those two so previously saved colors keep their original meaning.
 */
export const designColorsSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  gold: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  mutedText: hexColor,
  border: hexColor,
});
export type DesignColors = z.infer<typeof designColorsSchema>;

/** Curated, self-hosted font lists (src/lib/fonts.ts loads each one). Keys only -- never URLs. */
export const ENGLISH_FONTS = {
  "public-sans": "Public Sans",
  inter: "Inter",
  manrope: "Manrope",
  "dm-sans": "DM Sans",
  "plus-jakarta-sans": "Plus Jakarta Sans",
  poppins: "Poppins",
} as const;
export const ENGLISH_HEADING_FONTS = { archivo: "Archivo (expanded)", ...ENGLISH_FONTS } as const;
export const ARABIC_FONTS = {
  "plex-arabic": "IBM Plex Sans Arabic",
  cairo: "Cairo",
  tajawal: "Tajawal",
  "noto-kufi-arabic": "Noto Kufi Arabic",
  "noto-sans-arabic": "Noto Sans Arabic",
} as const;

const ENGLISH_FONT_OPTIONS = Object.keys(ENGLISH_FONTS) as [keyof typeof ENGLISH_FONTS, ...(keyof typeof ENGLISH_FONTS)[]];
const ENGLISH_HEADING_FONT_OPTIONS = Object.keys(ENGLISH_HEADING_FONTS) as [keyof typeof ENGLISH_HEADING_FONTS, ...(keyof typeof ENGLISH_HEADING_FONTS)[]];
const ARABIC_FONT_OPTIONS = Object.keys(ARABIC_FONTS) as [keyof typeof ARABIC_FONTS, ...(keyof typeof ARABIC_FONTS)[]];
export type EnglishFontOption = keyof typeof ENGLISH_FONTS;
export type EnglishHeadingFontOption = keyof typeof ENGLISH_HEADING_FONTS;
export type ArabicFontOption = keyof typeof ARABIC_FONTS;
export { ENGLISH_FONT_OPTIONS, ENGLISH_HEADING_FONT_OPTIONS, ARABIC_FONT_OPTIONS };

const scaleNumber = z.number().min(0.75).max(1.5).optional();
const weightNumber = z.number().int().min(100).max(900).optional();
const lineHeightScale = z.number().min(0.8).max(1.4).optional();

export const designTypographySchema = z.object({
  /** Body fonts (English / Arabic). */
  fontEn: z.enum(ENGLISH_FONT_OPTIONS).optional(),
  fontAr: z.enum(ARABIC_FONT_OPTIONS).optional(),
  /** Heading fonts (English / Arabic). Unset = Archivo / the Arabic body font, as before. */
  fontHeadingEn: z.enum(ENGLISH_HEADING_FONT_OPTIONS).optional(),
  fontHeadingAr: z.enum(ARABIC_FONT_OPTIONS).optional(),
  /** Multipliers on the existing clamp()-based type scale (--scale-display/h1/h2/h3/body in
   * globals.css), not raw sizes -- preserves the responsive floor/ceiling shape at any scale. */
  displaySize: scaleNumber,
  h1Size: scaleNumber,
  h2Size: scaleNumber,
  h3Size: scaleNumber,
  bodySize: scaleNumber,
  weightHeading: weightNumber,
  weightBody: weightNumber,
  /** Multipliers on each heading/body class's own existing line-height. */
  lineHeightHeading: lineHeightScale,
  lineHeightBody: lineHeightScale,
  /** Legacy single multiplier (applied to headings and body) -- superseded by the two above. */
  lineHeightScale,
  /** Extra letter-spacing (em) added on top of the existing heading tracking. */
  letterSpacingExtra: z.number().min(-0.05).max(0.1).optional(),
  /** Body letter-spacing (em). */
  letterSpacingBody: z.number().min(-0.05).max(0.1).optional(),
});
export type DesignTypography = z.infer<typeof designTypographySchema>;

const remValue = z.number().min(0).max(20).optional();

export const designLayoutSchema = z.object({
  containerWidth: z.number().min(960).max(1920).optional(), // px, -> --container-max
  sectionSpacingScale: z.number().min(0.5).max(2).optional(), // -> --section-spacing-scale
  gridGap: remValue, // rem -> --grid-gap
  cardGap: remValue, // rem -> --card-gap
  buttonRadius: remValue, // rem -> --button-radius
  cardRadius: remValue, // rem -> --card-radius(-lg/-xl)
  imageRadius: remValue, // rem -> --image-radius(-lg)
  sectionRadius: remValue, // rem -> page sections without their own Border Radius setting
});
export type DesignLayout = z.infer<typeof designLayoutSchema>;

/** One editable shadow preset: a single drop shadow, tinted with `shadows.color`. */
const shadowPresetSchema = z.object({
  y: z.number().min(0).max(64),
  blur: z.number().min(0).max(120),
  spread: z.number().min(-40).max(40),
  opacity: z.number().min(0).max(0.6),
});
export type ShadowPreset = z.infer<typeof shadowPresetSchema>;

export const designShadowsSchema = z.object({
  /** Tint for all three presets (default: the site's dark green ink, rgb(24,48,45)). */
  color: hexColor,
  soft: shadowPresetSchema.optional(), // -> --shadow-flat   (resting cards, buttons)
  medium: shadowPresetSchema.optional(), // -> --shadow-card  (hovered cards/buttons)
  strong: shadowPresetSchema.optional(), // -> --shadow-lifted (featured cards)
});
export type DesignShadows = z.infer<typeof designShadowsSchema>;

const SHADOW_OPTIONS = ["none", "flat", "card", "lifted"] as const;
export type ButtonShadowOption = (typeof SHADOW_OPTIONS)[number];
export { SHADOW_OPTIONS };

const buttonVariantColorsSchema = z.object({
  bg: buttonColor,
  text: buttonColor,
  border: buttonColor,
  hoverBg: buttonColor,
  hoverText: buttonColor,
});
export type ButtonVariantColors = z.infer<typeof buttonVariantColorsSchema>;
export const BUTTON_VARIANTS = ["primary", "secondary", "gold", "ghostGold"] as const;
export type EditableButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const designButtonsSchema = z.object({
  /** Shared by every button style. */
  paddingScale: z.number().min(0.6).max(1.6).optional(),
  radius: remValue, // duplicated at layout.buttonRadius; kept in sync, see resolve-css.ts
  shadow: z.enum(SHADOW_OPTIONS).optional(),
  showIcon: z.boolean().optional(), // the shared <Button> component's own optional icon slot
  /** Per-style colors (unset = the palette color that style already uses). */
  primary: buttonVariantColorsSchema.optional(),
  secondary: buttonVariantColorsSchema.optional(),
  gold: buttonVariantColorsSchema.optional(),
  ghostGold: buttonVariantColorsSchema.optional(),
});
export type DesignButtons = z.infer<typeof designButtonsSchema>;

const ANIMATION_DEFAULT_OPTIONS = ["fade-up", "fade-down", "fade-in", "zoom-in", "scale", "slide-start", "slide-end", "fade-left", "fade-right", "reveal", "blur-reveal"] as const;
export type AnimationDefaultOption = (typeof ANIMATION_DEFAULT_OPTIONS)[number];
export { ANIMATION_DEFAULT_OPTIONS };

export const designAnimationSchema = z.object({
  enabled: z.boolean().optional(), // master switch -- false disables every sub-toggle below too
  defaultAnimation: z.enum(ANIMATION_DEFAULT_OPTIONS).optional(), // what a section's Animation="Inherit from global default" resolves to
  speed: z.number().min(0.4).max(2.5).optional(), // multiplier on ScrollReveal/motion durations
  scrollReveal: z.boolean().optional(), // viewport-triggered fade/slide-in
  hoverAnimation: z.boolean().optional(), // button/card hover-lift & scale
  pageTransition: z.boolean().optional(), // route-change fade wrapper
});
export type DesignAnimation = z.infer<typeof designAnimationSchema>;

/** Per-breakpoint overrides for the spacing-shaped layout fields that meaningfully vary by screen size. */
const responsiveBreakpointSchema = z.object({
  sectionSpacingScale: z.number().min(0.5).max(2).optional(),
  gridGap: remValue,
  cardGap: remValue,
});
export const designResponsiveSchema = z.object({
  tablet: responsiveBreakpointSchema.optional(),
  mobile: responsiveBreakpointSchema.optional(),
});
export type DesignResponsive = z.infer<typeof designResponsiveSchema>;

export const DESIGN_TOKENS_VERSION = 2;

export const designTokensSchema = z.object({
  version: z.number().int().optional(),
  colors: designColorsSchema.optional(),
  typography: designTypographySchema.optional(),
  layout: designLayoutSchema.optional(),
  shadows: designShadowsSchema.optional(),
  buttons: designButtonsSchema.optional(),
  animation: designAnimationSchema.optional(),
  responsive: designResponsiveSchema.optional(),
});
export type DesignTokens = z.infer<typeof designTokensSchema>;

export function parseDesignTokens(raw: unknown): DesignTokens {
  const parsed = designTokensSchema.safeParse(raw);
  if (!parsed.success) return {};
  const tokens = parsed.data;
  // Version 1 mapped "primary" to the coral CTA color and "secondary" to the brand green. Swap so
  // a value saved back then still recolors the same thing it did when it was saved.
  if ((tokens.version ?? 1) < 2 && tokens.colors && (tokens.colors.primary || tokens.colors.secondary)) {
    const { primary, secondary, ...rest } = tokens.colors;
    tokens.colors = { ...rest, primary: secondary, secondary: primary };
  }
  return { ...tokens, version: DESIGN_TOKENS_VERSION };
}

/** Drops undefined/empty values and empty objects, so stored JSON (and "unsaved changes" checks)
 * only ever contain what the admin actually set. */
export function pruneTokens<T>(value: T): T {
  if (Array.isArray(value) || value === null || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const pruned = pruneTokens(child);
    if (pruned === undefined || pruned === "") continue;
    if (typeof pruned === "object" && pruned !== null && !Array.isArray(pruned) && Object.keys(pruned).length === 0) continue;
    out[key] = pruned;
  }
  return out as T;
}
