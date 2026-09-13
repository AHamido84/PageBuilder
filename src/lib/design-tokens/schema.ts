import { z } from "zod";

/**
 * Phase 8 "Global Visual Control Center" -- every field here is optional/nullable by design:
 * unset = "inherit today's existing default" (the hardcoded value already in globals.css/
 * components), never a forced value. This is what makes the whole system additive and safe --
 * an admin who never opens this panel gets a site that renders byte-for-byte identical to before
 * Phase 8 existed. See resolve-css.ts for how these become actual CSS, and the doc comment at the
 * top of that file for the "override only what's actually set" architecture this schema implies.
 */

const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Must be a hex color like #ee665a")
  .optional();

export const designColorsSchema = z.object({
  primary: hexColor, // -> --color-coral (Button primary, CTA accents)
  secondary: hexColor, // -> --color-petrol (Button secondary, footer)
  accent: hexColor, // -> --color-harbor (links, labels, manifest-strip accents)
  gold: hexColor, // -> --color-wheat (gold button, badges, focus rings)
  background: hexColor, // -> --color-paper (page background)
  surface: hexColor, // -> --color-frost (card/section alternate surface)
  text: hexColor, // -> --color-ink (body text)
  mutedText: hexColor, // -> --color-muted-text (new token; most existing "muted" text uses ink at reduced opacity and scales with Text automatically)
});
export type DesignColors = z.infer<typeof designColorsSchema>;

// Body text only ("English Font") -- the display/heading typeface (Archivo, --font-display) is a
// deliberate brand-identity choice (its specific variable-width "Expanded" stretch axis is called
// out explicitly in globals.css) and stays untouched by this control; "public-sans" is today's
// existing default, included so admins can explicitly select back to it.
const ENGLISH_FONT_OPTIONS = ["public-sans", "inter", "poppins"] as const;
const ARABIC_FONT_OPTIONS = ["plex-arabic", "cairo", "tajawal"] as const;
export type EnglishFontOption = (typeof ENGLISH_FONT_OPTIONS)[number];
export type ArabicFontOption = (typeof ARABIC_FONT_OPTIONS)[number];
export { ENGLISH_FONT_OPTIONS, ARABIC_FONT_OPTIONS };

const scaleNumber = z.number().min(0.75).max(1.5).optional();
const weightNumber = z.number().int().min(100).max(900).optional();

export const designTypographySchema = z.object({
  fontEn: z.enum(ENGLISH_FONT_OPTIONS).optional(),
  fontAr: z.enum(ARABIC_FONT_OPTIONS).optional(),
  /** Multipliers on the existing clamp()-based type scale (--scale-display/h1/h2/h3/body in
   * globals.css), not raw sizes -- preserves the responsive floor/ceiling shape at any scale. */
  displaySize: scaleNumber,
  h1Size: scaleNumber,
  h2Size: scaleNumber,
  h3Size: scaleNumber,
  bodySize: scaleNumber,
  weightHeading: weightNumber,
  weightBody: weightNumber,
  /** Multiplier on top of the existing (already locale/tier-aware) line-height values. */
  lineHeightScale: z.number().min(0.8).max(1.4).optional(),
  /** Extra letter-spacing added on top of existing heading tracking, in em. */
  letterSpacingExtra: z.number().min(-0.05).max(0.1).optional(),
});
export type DesignTypography = z.infer<typeof designTypographySchema>;

const remValue = z.number().min(0).max(20).optional();

export const designLayoutSchema = z.object({
  containerWidth: z.number().min(960).max(1920).optional(), // px, -> --container-max
  sectionSpacingScale: z.number().min(0.5).max(2).optional(), // -> --section-spacing-scale
  gridGap: remValue, // rem -> --grid-gap
  cardGap: remValue, // rem -> --card-gap
  buttonRadius: remValue, // rem -> --button-radius
  cardRadius: remValue, // rem -> --card-radius
  imageRadius: remValue, // rem -> --image-radius
});
export type DesignLayout = z.infer<typeof designLayoutSchema>;

const SHADOW_OPTIONS = ["none", "flat", "card", "lifted"] as const;
export type ButtonShadowOption = (typeof SHADOW_OPTIONS)[number];
export { SHADOW_OPTIONS };

export const designButtonsSchema = z.object({
  /** Shared across Gold/Ghost Gold/Primary/Secondary -- each variant's own color already comes
   * from Global Colors (Primary/Secondary/Gold above), so these are the properties actually
   * common to "a button" as a category rather than 24 near-duplicate per-variant fields. */
  paddingScale: z.number().min(0.6).max(1.6).optional(),
  radius: remValue, // duplicated at layout.buttonRadius; kept in sync, see resolve-css.ts
  shadow: z.enum(SHADOW_OPTIONS).optional(),
  showIcon: z.boolean().optional(), // the shared <Button> component's own optional icon slot
});
export type DesignButtons = z.infer<typeof designButtonsSchema>;

const ANIMATION_DEFAULT_OPTIONS = ["fade-up", "fade-down", "fade-in", "zoom-in", "scale", "slide-start", "slide-end", "fade-left", "fade-right"] as const;
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

/** "Allow global defaults for: Desktop / Tablet / Mobile" -- applied to the spacing-shaped layout
 * fields that meaningfully vary by breakpoint (color/radius/typography don't need a per-breakpoint
 * split; container width is itself a max, so only these three get a breakpoint override set). */
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

export const designTokensSchema = z.object({
  colors: designColorsSchema.optional(),
  typography: designTypographySchema.optional(),
  layout: designLayoutSchema.optional(),
  buttons: designButtonsSchema.optional(),
  animation: designAnimationSchema.optional(),
  responsive: designResponsiveSchema.optional(),
});
export type DesignTokens = z.infer<typeof designTokensSchema>;

export function parseDesignTokens(raw: unknown): DesignTokens {
  const parsed = designTokensSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}
