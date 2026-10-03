import { z } from "zod";
import type { MediaType } from "@prisma/client";
import { Heading1, MousePointerClick, RectangleHorizontal, Sparkles, Type } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { HeroEdit, HeroRender } from "./content/hero";
import { resolveHeroData } from "./content/hero-resolve";
import { FRAME_STYLES, FRAME_BORDER_STYLES, FRAME_GLOWS } from "./content/frame-shapes";
import { HeadingEdit, HeadingRender } from "./content/heading";
import { RichTextEdit, RichTextRender } from "./content/rich-text";
import { CtaEdit, CtaRender } from "./content/cta";
import { PageIntroEdit, PageIntroRender } from "./content/page-intro";
import { BannerEdit, BannerRender } from "./content/banner";

// "secondary"/"ghost" are the two original values -- kept exactly as-is (still mapped by
// heroButtonVariant in hero-shared.tsx the same way they always were: secondary->ghost-light,
// ghost->ghost-dark) so no previously-published Hero changes appearance. "ghost-light"/"ghost-dark"
// let an admin pick either of those two button-kit variants directly and explicitly; "gold"/
// "gold-outline" are new CTA colors for a Hero button that wants to stand out (advanced hero
// CTA controls brief).
// "ghost-gold" added for Phase 4 -- the Button component (and its "gold-outline" twin) already
// supported it; Hero's own style enum just never exposed it as a selectable CTA color.
const heroButtonStyleSchema = z.enum(["primary", "secondary", "ghost", "ghost-light", "ghost-dark", "gold", "gold-outline", "ghost-gold"]);
export type HeroButtonStyle = z.infer<typeof heroButtonStyleSchema>;

// object-fit for the Hero's own image/video, real (not decorative) -- "contain" is the one that
// matters most: guarantees the complete image stays visible with no cropping, for a banner with a
// product/logo/baked-in text that "cover" would otherwise cut off (see session H's mobile-crop bug,
// which this generalizes into an admin-configurable control instead of only a focal-point fix).
const heroImageFitSchema = z.enum(["cover", "contain", "fill", "none"]);
export type HeroImageFit = z.infer<typeof heroImageFitSchema>;

// "flow": CTA(s) render inline in the normal content stack, exactly like today (default, zero
// visual change for every existing Hero/slide). "custom": CTA(s) are pulled out of that stack and
// placed at an explicit X/Y point over the media instead -- independent of where the heading/body
// text sits (advanced hero CTA controls brief's "CTA position must not move the Hero heading").
const heroCtaPositionModeSchema = z.enum(["flow", "custom"]);
export type HeroCtaPositionMode = z.infer<typeof heroCtaPositionModeSchema>;

// "scale"/"morph"/"float" added for the premium frame system (morph only visually applies to the
// three organic/blob frame styles; float/scale apply to any frame). "cinematic-loop" added for the
// full-bleed cinematic Hero background: unlike every other value here (which plays once on mount
// and stops), it's a genuinely infinite alternating breathing zoom -- see HeroMediaMotion in
// hero-shared.tsx. "slide"/"pan" added for Phase 4: "slide" is a one-shot slide-in-from-the-reading-
// start-edge entrance (direction-aware, same mirroring convention as the shared motion primitives'
// slide-start/slide-end); "pan" is a continuous horizontal drift with no zoom, distinct from
// slow-zoom/cinematic-loop (zoom-only/zoom+breathe). "slow-zoom" is presented in the admin UI as
// "Ken Burns" (it already is one) rather than adding a redundant near-duplicate animation value.
// Same field throughout, still just "the media/frame's entrance-and-ambient treatment."
// "ken-burns" added for redesign PHASE 5: zoom + a slow diagonal drift (a true Ken Burns), now
// distinct from "slow-zoom" (zoom only), which keeps its exact existing behavior and is labelled
// "Slow Zoom" in the admin from here on.
const heroAnimationSchema = z.enum(["none", "fade", "slow-zoom", "parallax", "reveal", "cinematic", "scale", "morph", "float", "cinematic-loop", "slide", "pan", "ken-burns"]);
export type HeroAnimation = z.infer<typeof heroAnimationSchema>;

const heroImagePositionSchema = z.enum(["center", "top", "bottom", "left", "right", "custom"]);
export type HeroImagePosition = z.infer<typeof heroImagePositionSchema>;

// "auto"/"custom" added for Phase 4 (admin-facing labels: Auto/Small/Medium/Large/Full Viewport/
// Custom, mapping compact->Small, standard->Medium, tall->Large) -- additive, every pre-existing
// stored value stays valid. "auto" emits no min-height class at all (content drives height);
// "custom" reads `heroHeightCustomValue` instead of a token class (see HERO_HEIGHT_CLASSES).
const heroHeightSchema = z.enum(["compact", "standard", "tall", "viewport", "auto", "custom"]);
export type HeroHeight = z.infer<typeof heroHeightSchema>;

const heroContentPositionSchema = z.enum(["start", "center", "end"]);
export type HeroContentPosition = z.infer<typeof heroContentPositionSchema>;

const heroVerticalAlignSchema = z.enum(["top", "center", "bottom"]);
export type HeroVerticalAlign = z.infer<typeof heroVerticalAlignSchema>;

const heroContentMaxWidthSchema = z.enum(["sm", "md", "lg", "xl"]);
export type HeroContentMaxWidth = z.infer<typeof heroContentMaxWidthSchema>;

const heroTextColorModeSchema = z.enum(["auto", "light", "dark"]);
export type HeroTextColorMode = z.infer<typeof heroTextColorModeSchema>;

const heroAccentColorSchema = z.enum(["wheat", "paper"]);
export type HeroAccentColor = z.infer<typeof heroAccentColorSchema>;

// "auto" derives the gradient direction from contentPosition (mirrored for RTL, see
// resolveOverlayGradient in hero-shared.tsx) -- the sane default for "strong behind the text,
// fading toward the product". The explicit values let an admin override that for creative reasons.
const heroOverlayDirectionSchema = z.enum(["auto", "start", "end", "center", "top", "bottom", "none"]);
export type HeroOverlayDirection = z.infer<typeof heroOverlayDirectionSchema>;

const heroFrameStyleSchema = z.enum(FRAME_STYLES);
export type HeroFrameStyle = z.infer<typeof heroFrameStyleSchema>;

const heroFramePositionSchema = z.enum(["left", "center", "right", "top", "bottom", "custom"]);
export type HeroFramePosition = z.infer<typeof heroFramePositionSchema>;

const heroFrameBorderStyleSchema = z.enum(FRAME_BORDER_STYLES);
export type HeroFrameBorderStyle = z.infer<typeof heroFrameBorderStyleSchema>;

const heroFrameGlowSchema = z.enum(FRAME_GLOWS);
export type HeroFrameGlow = z.infer<typeof heroFrameGlowSchema>;

const heroFrameBorderColorSchema = z.enum(["ink", "harbor", "wheat", "paper"]);
export type HeroFrameBorderColor = z.infer<typeof heroFrameBorderColorSchema>;

const heroDecorativePositionSchema = z.enum(["behind", "beside", "overlap-start", "overlap-end"]);
export type HeroDecorativePosition = z.infer<typeof heroDecorativePositionSchema>;

const heroSlideSchema = z.object({
  // Client-generated (crypto.randomUUID()) so React keys and reorder/duplicate stay stable across edits.
  id: z.string(),
  enabled: z.boolean().default(true),
  mediaType: z.enum(["image", "video"]).default("image"),
  desktopMediaId: z.string().optional().default(""),
  mobileMediaId: z.string().optional().default(""), // "" => falls back to desktopMediaId
  posterId: z.string().optional().default(""), // video slides only
  eyebrow: z.string().max(80).optional().default(""),
  headline: z.string().max(200).optional().default(""),
  description: z.string().max(400).optional().default(""),
  ctaLabel: z.string().max(60).optional().default(""),
  ctaUrl: z.string().max(300).optional().default(""),
  ctaLabel2: z.string().max(60).optional().default(""),
  ctaUrl2: z.string().max(300).optional().default(""),
  durationMs: z.number().int().min(1000).max(30000).default(6000),
  animation: heroAnimationSchema.default("slow-zoom"),

  // Advanced media & CTA controls -- every field below is genuinely per-slide (brief's core
  // requirement: no single global value shared across all slides). "" / null sentinels mean
  // "not set on this slide" and are resolved at render time falling back to a value that
  // reproduces this slideshow's exact pre-existing behavior, so no already-published slide's
  // appearance changes until an admin deliberately opens a slide and sets one of these.
  imageFit: z.union([heroImageFitSchema, z.literal("")]).default(""), // "" => "cover" (today's hardcoded behavior)
  imageFitMobile: z.union([heroImageFitSchema, z.literal("")]).default(""), // "" => same as this slide's imageFit
  focalX: z.number().min(0).max(100).nullable().default(null), // null => the Hero-level focalX (pre-existing shared value)
  focalY: z.number().min(0).max(100).nullable().default(null), // null => the Hero-level focalY
  ctaStyle: z.union([heroButtonStyleSchema, z.literal("")]).default(""), // "" => "primary" (today's hardcoded primary button)
  ctaStyle2: z.union([heroButtonStyleSchema, z.literal("")]).default(""), // "" => "secondary" (today's hardcoded ghost-light button)
  ctaPositionMode: z.union([heroCtaPositionModeSchema, z.literal("")]).default(""), // "" => "flow"
  ctaX: z.number().min(0).max(100).nullable().default(null), // null => 75 (only read when ctaPositionMode is "custom")
  ctaY: z.number().min(0).max(100).nullable().default(null), // null => 80
  overlayOpacity: z.number().min(0).max(100).nullable().default(null), // null => the Hero-level overlayOpacity

  // Phase 4 -- true desktop/tablet/mobile independence for Image Fit, Focal Point, and CTA Position
  // (previously only a single desktop/mobile split existed, at one breakpoint, and CTA position had
  // no responsive variation at all). Same "" / null = inherit convention as every field above:
  // an unset tier falls back to this slide's own desktop value (imageFit/focalX/focalY/ctaX/ctaY),
  // which itself falls back further per the comments above -- so an already-published slide with no
  // tier overrides renders identically to before these fields existed.
  imageFitTablet: z.union([heroImageFitSchema, z.literal("")]).default(""), // "" => this slide's imageFit
  focalXTablet: z.number().min(0).max(100).nullable().default(null),
  focalYTablet: z.number().min(0).max(100).nullable().default(null),
  focalXMobile: z.number().min(0).max(100).nullable().default(null), // null => this slide's focalX (imageFitMobile already existed; a mobile focal override did not)
  focalYMobile: z.number().min(0).max(100).nullable().default(null),
  ctaXTablet: z.number().min(0).max(100).nullable().default(null),
  ctaYTablet: z.number().min(0).max(100).nullable().default(null),
  ctaXMobile: z.number().min(0).max(100).nullable().default(null),
  ctaYMobile: z.number().min(0).max(100).nullable().default(null),

  // Phase 4 -- per-slide override of the entrance animation's own duration/delay. Every
  // HeroMediaMotion animation branch previously hardcoded its own timing; null on either field here
  // means "use that animation's existing hardcoded default," so no already-published slide's
  // animation speed changes until an admin deliberately sets one of these.
  animationDurationMs: z.number().int().min(200).max(30000).nullable().default(null),
  animationDelayMs: z.number().int().min(0).max(5000).nullable().default(null),

  // Redesign PHASE 5 -- per-slide overlay style. "" => the Hero-level overlayDirection (unchanged
  // behavior for every existing slide); "none" turns the scrim off for this slide only.
  overlayDirection: z.union([heroOverlayDirectionSchema, z.literal("")]).default(""),
});
export type HeroSlide = z.infer<typeof heroSlideSchema>;

/**
 * "3D Composition" mode's config -- a layered arrangement of arbitrary Media Library images
 * (background/main/secondary/product/decorative), distinct from "product-composition" mode above
 * which references real Product catalog rows instead. Grouped as its own nested object (like
 * `heroSlideSchema`) rather than ~20 more flat fields on `heroSchema` directly. Every field is
 * defaulted, so existing Hero rows with no `composition` key parse to this default object
 * unaffected -- no migration, no risk to any pre-existing Hero (image/video/slideshow/
 * product-composition all stay exactly as they render today).
 */
const heroCompositionSchema = z.object({
  // Content -- plain Media ids, resolved server-side by resolveHeroData like every other Hero
  // media reference (never duplicates the image data itself).
  backgroundId: z.string().optional().default(""),
  mobileBackgroundId: z.string().optional().default(""), // "" => falls back to backgroundId
  mainImageId: z.string().optional().default(""),
  secondaryImageId: z.string().optional().default(""),
  productImageIds: z.array(z.string()).max(6).default([]),
  decorativeImageIds: z.array(z.string()).max(4).default([]),

  // Animation
  animationEnabled: z.boolean().default(true),
  intensity: z.number().min(0).max(100).default(50), // scales float distance/rotation
  speed: z.number().min(0.5).max(2).default(1), // multiplier on base durations
  entrance: z.enum(["none", "fade", "fade-slide"]).default("fade-slide"),
  floating: z.boolean().default(true),
  hoverInteraction: z.boolean().default(true), // pointer parallax on the main image
  parallaxIntensity: z.number().min(0).max(100).default(40),

  // Layout
  mainPosition: z.enum(["left", "right", "center"]).default("right"),
  width: z.number().min(40).max(100).default(100), // % of hero width the composition occupies
  height: z.number().min(40).max(100).default(100), // % of hero height
  mobileLayout: z.enum(["simplified", "background-only", "stacked"]).default("simplified"),

  // Style
  borderRadius: z.number().min(0).max(48).default(24),
  shadow: z.enum(["none", "sm", "md", "lg"]).default("md"),
  overlay: z.enum(["none", "light", "dark", "gradient"]).default("none"),
  frameStyle: heroFrameStyleSchema.default("full-bleed"),
  opacity: z.number().min(0).max(100).default(100),
  blendMode: z.enum(["normal", "multiply", "screen", "soft-light"]).default("normal"),
});
export type HeroCompositionData = z.infer<typeof heroCompositionSchema>;

const DEFAULT_COMPOSITION: HeroCompositionData = {
  backgroundId: "", mobileBackgroundId: "", mainImageId: "", secondaryImageId: "",
  productImageIds: [], decorativeImageIds: [],
  animationEnabled: true, intensity: 50, speed: 1, entrance: "fade-slide", floating: true,
  hoverInteraction: true, parallaxIntensity: 40,
  mainPosition: "right", width: 100, height: 100, mobileLayout: "simplified",
  borderRadius: 24, shadow: "md", overlay: "none", frameStyle: "full-bleed", opacity: 100, blendMode: "normal",
};

const heroSchema = z.object({
  // Content -- used directly in image/video mode; ignored in slideshow mode, which reads from `slides` instead.
  eyebrow: z.string().max(80).optional().default(""),
  headline: z.string().max(200),
  subheading: z.string().max(400).optional().default(""),
  ctaLabel: z.string().max(60).optional().default(""),
  ctaUrl: z.string().max(300).optional().default(""),
  ctaVisible: z.boolean().default(true),
  ctaStyle: heroButtonStyleSchema.default("primary"),
  ctaExternal: z.boolean().default(false),
  ctaLabel2: z.string().max(60).optional().default(""),
  ctaUrl2: z.string().max(300).optional().default(""),
  ctaVisible2: z.boolean().default(true),
  ctaStyle2: heroButtonStyleSchema.default("secondary"),
  ctaExternal2: z.boolean().default(false),

  // Real absolute CTA positioning (advanced hero CTA controls brief), independent of both the
  // heading/body text (which never moves -- see contentPosition/verticalAlign below, untouched by
  // this) and of image/video/product-composition/3d-composition mode (these apply to whichever
  // media mode is active; slideshow mode instead reads each slide's own ctaPositionMode/ctaX/ctaY,
  // see heroSlideSchema). Defaults to "flow" -- the CTA(s) stay exactly where they render today,
  // inline after the description -- so no existing Hero changes until an admin opts in to "custom".
  ctaPositionMode: heroCtaPositionModeSchema.default("flow"),
  ctaX: z.number().min(0).max(100).default(75),
  ctaY: z.number().min(0).max(100).default(80),
  // Off by default: each locale's Hero content (dataEn/dataAr) is already a fully independent JSON
  // object, so ctaX/ctaY set while editing /ar never touches /en's values -- this toggle is only
  // for an admin who deliberately wants one X value to read as "mirrored" on the RTL locale instead
  // of re-entering the mirrored number by hand. Physical (un-mirrored) is the safe, unsurprising
  // default matching how every other physical value on this schema (frameX, decorativeRotation...) already behaves.
  ctaMirrorForRtl: z.boolean().default(false),
  // Phase 4 -- CTA position gets the same tablet/mobile independence as slideshow slides (cheap:
  // HeroCtaOverlay is one small absolutely-positioned component). null => this Hero's own ctaX/ctaY.
  ctaXTablet: z.number().min(0).max(100).nullable().default(null),
  ctaYTablet: z.number().min(0).max(100).nullable().default(null),
  ctaXMobile: z.number().min(0).max(100).nullable().default(null),
  ctaYMobile: z.number().min(0).max(100).nullable().default(null),

  // Media
  // "carousel" (redesign PHASE 5) reads the same `slides` array as "slideshow" -- the difference is
  // presentation: slides physically slide along a track (direction-aware for RTL), arrows show at
  // every breakpoint, and a slide counter is shown. Autoplay is optional (`carouselAutoplay`).
  mediaType: z.enum(["image", "video", "slideshow", "carousel", "product-composition", "3d-composition"]).default("image"),
  // "split": media in its own framed column beside the text (current default). "full-bleed": media
  // stretches across the whole section as a background layer, text overlays on top of it.
  layout: z.enum(["split", "full-bleed"]).default("split"),
  desktopMediaId: z.string().optional().default(""),
  mobileMediaId: z.string().optional().default(""), // "" => falls back to desktopMediaId
  posterId: z.string().optional().default(""), // video mode only
  imagePosition: heroImagePositionSchema.default("center"),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  // Real object-fit control for image/video mode (advanced hero CTA controls brief) -- "cover"
  // preserves every already-published Hero's exact current rendering (the class was hardcoded
  // "object-cover" before this field existed). "contain" is the one that matters most: guarantees
  // the complete photo stays visible with no cropping of a product/logo/baked-in text.
  imageFit: heroImageFitSchema.default("cover"),
  // Phase 4 -- the single image/video mode's own mobile <Image>/<video> element previously always
  // reused the desktop imageFit/focalX/focalY verbatim (no independent mobile control existed at
  // this level at all, unlike slideshow slides which already had imageFitMobile). "" / null =>
  // fall back to imageFit/focalX/focalY, reproducing today's exact behavior.
  imageFitMobile: z.union([heroImageFitSchema, z.literal("")]).default(""),
  focalXMobile: z.number().min(0).max(100).nullable().default(null),
  focalYMobile: z.number().min(0).max(100).nullable().default(null),
  overlayOpacity: z.number().min(0).max(100).default(35),
  animation: heroAnimationSchema.default("slow-zoom"),
  // Phase 4 -- overrides the active animation's own hardcoded duration/delay (see HeroMediaMotion).
  // null on either => that animation's existing default timing, unchanged.
  animationDurationMs: z.number().int().min(200).max(30000).nullable().default(null),
  animationDelayMs: z.number().int().min(0).max(5000).nullable().default(null),
  videoAutoplay: z.boolean().default(true),
  videoMuted: z.boolean().default(true),
  videoLoop: z.boolean().default(true),

  // Premium image-frame system (§18-34 of the brief). Defaults to "full-bleed" (no clip/shape,
  // today's plain rectangular look) so every already-published Hero section renders unchanged
  // until an admin deliberately picks a shape or preset -- same additive-field convention as
  // every other field on this schema.
  frameStyle: heroFrameStyleSchema.default("full-bleed"),
  // "" = use `frameStyle` on mobile too. A separate shape (brief §43, e.g. desktop Blob / mobile
  // Oval) is genuinely optional -- most Heroes want the same shape everywhere.
  mobileFrameStyle: z.union([z.literal(""), heroFrameStyleSchema]).default(""),
  // Which named preset (if any) last filled these fields -- UI state only, Render never branches
  // on it (mirrors framePreset the way `imagePosition` already works: a preset sets several
  // canonical fields at once, Render only ever reads the canonical fields it fills).
  framePreset: z.string().optional().default(""),
  framePosition: heroFramePositionSchema.default("center"),
  frameX: z.number().min(-50).max(50).default(0),
  frameY: z.number().min(-50).max(50).default(0),
  frameWidth: z.number().min(20).max(120).default(100),
  frameHeight: z.number().min(20).max(120).default(100),
  frameScale: z.number().min(0.5).max(1.5).default(1),
  frameRotation: z.number().min(-5).max(5).default(0),
  frameOverflow: z.boolean().default(false),
  frameBorderStyle: heroFrameBorderStyleSchema.default("none"),
  frameBorderWidth: z.number().min(1).max(8).default(2),
  frameBorderOpacity: z.number().min(0).max(100).default(60),
  frameBorderColor: heroFrameBorderColorSchema.default("wheat"),
  frameGlow: heroFrameGlowSchema.default("none"),

  // Oversized low-opacity brand typography behind/beside the frame (§29-30). Empty string =
  // nothing renders -- never invented copy; an admin (or the Golden Seven Signature preset) must
  // deliberately set it.
  decorativeText: z.string().max(40).optional().default(""),
  decorativeOpacity: z.number().min(5).max(12).default(8),
  decorativePosition: heroDecorativePositionSchema.default("behind"),
  decorativeRotation: z.number().min(-15).max(15).default(0),

  parallaxEnabled: z.boolean().default(true),

  // Full-bleed cinematic composition (§1-16 of the "premium full-bleed dynamic hero" brief).
  // Only meaningful when layout === "full-bleed" -- split mode's own frame/positioning fields
  // above are untouched by these. All additive/defaulted so every pre-existing Hero (split or
  // full-bleed) renders exactly as before until an admin deliberately touches one of these.
  heroHeight: heroHeightSchema.default("tall"),
  // Phase 4 -- only read when heroHeight === "custom" (e.g. "600px", "70vh"). Empty until an admin
  // deliberately picks Custom, so no pre-existing Hero is affected.
  heroHeightCustomValue: z.string().max(20).optional().default(""),
  contentPosition: heroContentPositionSchema.default("start"),
  verticalAlign: heroVerticalAlignSchema.default("center"),
  contentMaxWidth: heroContentMaxWidthSchema.default("lg"),
  textColorMode: heroTextColorModeSchema.default("auto"),
  accentColor: heroAccentColorSchema.default("wheat"),
  overlayDirection: heroOverlayDirectionSchema.default("auto"),
  // Percent scale increase for the "cinematic-loop" animation (e.g. 4 => 1.00 -> 1.04 -> 1.00).
  zoomAmount: z.number().min(0).max(20).default(4),
  // Full cycle duration in seconds (out and back) for "cinematic-loop".
  animationSpeedSec: z.number().min(8).max(40).default(20),

  // Product Composition mode (§4-11 of the brief) -- stores real Product ids by role, never
  // duplicates product data (name/image/etc.) into Hero's own JSON. "" = that role isn't shown;
  // every role is optional and independently settable, matching the rest of this schema's
  // graceful-degradation convention. `resolveHeroData` batches these into `HeroResolvedMedia`.
  primaryProductId: z.string().optional().default(""),
  secondaryProductId: z.string().optional().default(""),
  supportingProductId: z.string().optional().default(""),
  productsClickable: z.boolean().default(true),
  showProductBadges: z.boolean().default(true),

  slides: z.array(heroSlideSchema).max(12).default([]),
  // "crossfade" keeps the outgoing slide mounted during a brief opacity cross-dissolve instead of
  // an instant swap (see HeroSlideshow's AnimatePresence usage) -- "cut" preserves the original
  // hard-swap behavior for admins who prefer it. Defaults to "crossfade" for the more premium feel
  // the brief asks for; existing sections with no stored value pick this up automatically.
  slideTransition: z.enum(["cut", "crossfade"]).default("crossfade"),
  // "carousel" mode only -- whether it advances on each slide's own durationMs timer.
  carouselAutoplay: z.boolean().default(true),

  // "3d-composition" mode only -- see heroCompositionSchema above.
  composition: heroCompositionSchema.default(DEFAULT_COMPOSITION),
});
export type HeroData = z.infer<typeof heroSchema>;

/** A Product resolved server-side for the Hero's Product Composition mode -- only real, current
 * catalog data (never fabricated), always re-resolved from `Product`/`ProductTranslation`/`Media`
 * on every render, so a change made in the Product CMS (a new photo, a name edit, an isFeatured
 * toggle) shows up automatically without touching the Hero section at all. */
export interface HeroResolvedProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  isFeatured: boolean;
}

/** Real Media URLs resolved server-side by `resolveHeroData` -- never persisted, never part of `heroSchema` itself (mirrors the id-only-persisted / url-resolved-separately convention already used across the Page Builder's media-referencing blocks). */
export interface HeroResolvedMedia {
  desktopMediaUrl?: string;
  desktopMediaKind?: MediaType;
  mobileMediaUrl?: string;
  mobileMediaKind?: MediaType;
  posterUrl?: string;
  slideMedia?: Record<string, { desktopUrl?: string; desktopKind?: MediaType; mobileUrl?: string; mobileKind?: MediaType; posterUrl?: string }>;
  primaryProduct?: HeroResolvedProduct;
  secondaryProduct?: HeroResolvedProduct;
  supportingProduct?: HeroResolvedProduct;
  /** "3d-composition" mode's resolved image URLs. productUrls/decorativeUrls are id-keyed (like
   * `slideMedia` above), not plain arrays -- keeps them robust to a referenced Media row being
   * deleted (a missing entry just means that one id doesn't render, without shifting/misaligning
   * every id after it the way a filtered array would) and lets the Edit UI look up a thumbnail by
   * id directly. */
  compositionMedia?: {
    backgroundUrl?: string;
    mobileBackgroundUrl?: string;
    mainUrl?: string;
    secondaryUrl?: string;
    productUrls: Record<string, string>;
    decorativeUrls: Record<string, string>;
  };
}
export type HeroRenderData = HeroData & HeroResolvedMedia;

const headingSchema = z.object({
  text: z.string().max(200),
  level: z.enum(["h1", "h2", "h3"]).default("h2"),
});
export type HeadingData = z.infer<typeof headingSchema>;

const richTextSchema = z.object({
  html: z.string().max(20000).default(""),
});
export type RichTextData = z.infer<typeof richTextSchema>;

// Phase 7: header/intro zone for otherwise-hardcoded catalog listing pages (Products/Brands/Blog/
// Solutions index) -- see page-intro.tsx's doc comment for why this is its own block rather than
// reusing HEADING/RICH_TEXT.
const pageIntroSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().max(200).optional().default(""),
  description: z.string().max(500).optional().default(""),
  // PHASE 8: this block is the page header, so its title is the page's <h1> by default (index and
  // legal pages had no <h1> at all). "h2" for the rare intro used further down a page.
  headingLevel: z.enum(["h1", "h2"]).optional().default("h1"),
});
export type PageIntroData = z.infer<typeof pageIntroSchema>;

// Phase 3 premium redesign: `layout`/`image` are additive + defaulted -- every already-published
// CTA (no layout, no image) keeps rendering the original centered text-only treatment exactly as
// before. "banner" is a new full-bleed option only meaningful once an image is actually set.
const ctaSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(500).optional().default(""),
  ctaLabel: z.string().max(60),
  ctaUrl: z.string().max(300),
  layout: z.enum(["centered", "banner"]).optional().default("centered"),
  image: z.object({ id: z.string(), url: z.string() }).nullable().optional().default(null),
});
export type CtaData = z.infer<typeof ctaSchema>;

// Redesign PHASE 5 -- reusable Banner section. Media are stored as {id, url} (the same convention
// as CTA/IMAGE/GALLERY: picked through the Media Library, URL kept for rendering without a server
// resolve step; Media "Replace" rewrites these URLs in place). Every locale's data is independent,
// so EN and AR can position text, focal point and height differently.
const bannerMediaRefSchema = z.object({ id: z.string(), url: z.string() }).nullable().default(null);
const bannerHeightSchema = z.enum(["auto", "small", "medium", "large", "viewport", "custom"]);
export type BannerHeight = z.infer<typeof bannerHeightSchema>;

const bannerSchema = z.object({
  // "background": media fills the banner, text over it. "split": a side image beside the text
  // (optionally over a background too). "text": text + CTA only, on the section's own background.
  layout: z.enum(["background", "split", "text"]).default("background"),
  backgroundType: z.enum(["image", "video"]).default("image"),
  backgroundImage: bannerMediaRefSchema,
  backgroundImageMobile: bannerMediaRefSchema, // null => backgroundImage
  backgroundVideo: bannerMediaRefSchema,
  videoPoster: bannerMediaRefSchema,
  image: bannerMediaRefSchema, // split layout's side image
  imageSide: z.enum(["start", "end"]).default("end"), // logical -- mirrors automatically under RTL
  imageFit: heroImageFitSchema.default("cover"),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  focalXMobile: z.number().min(0).max(100).nullable().default(null), // null => focalX
  focalYMobile: z.number().min(0).max(100).nullable().default(null),

  eyebrow: z.string().max(80).optional().default(""),
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(600).optional().default(""),
  ctaLabel: z.string().max(60).optional().default(""),
  ctaUrl: z.string().max(300).optional().default(""),
  ctaStyle: heroButtonStyleSchema.default("gold"),
  ctaLabel2: z.string().max(60).optional().default(""),
  ctaUrl2: z.string().max(300).optional().default(""),
  ctaStyle2: heroButtonStyleSchema.default("secondary"),

  overlay: heroOverlayDirectionSchema.default("auto"),
  overlayOpacity: z.number().min(0).max(100).default(55),

  height: bannerHeightSchema.default("medium"),
  heightCustomValue: z.string().max(20).optional().default(""), // only read when height === "custom"
  heightMobile: z.union([bannerHeightSchema.exclude(["custom"]), z.literal("")]).default(""), // "" => same as height
  contentPosition: heroContentPositionSchema.default("start"),
  verticalAlign: heroVerticalAlignSchema.default("center"),
  contentMaxWidth: heroContentMaxWidthSchema.default("md"),
  textColorMode: heroTextColorModeSchema.default("auto"),
  animation: heroAnimationSchema.default("none"),
  // true => edge-to-edge (skips the section's container chrome, no rounded corners).
  fullWidth: z.boolean().default(false),
});
export type BannerData = z.infer<typeof bannerSchema>;

const DEFAULT_BANNER: Omit<BannerData, "eyebrow" | "heading" | "body" | "ctaLabel"> = {
  layout: "background", backgroundType: "image",
  backgroundImage: null, backgroundImageMobile: null, backgroundVideo: null, videoPoster: null,
  image: null, imageSide: "end", imageFit: "cover", focalX: 50, focalY: 50, focalXMobile: null, focalYMobile: null,
  ctaUrl: "/contact", ctaStyle: "gold", ctaLabel2: "", ctaUrl2: "", ctaStyle2: "secondary",
  overlay: "auto", overlayOpacity: 55, height: "medium", heightCustomValue: "", heightMobile: "",
  contentPosition: "start", verticalAlign: "center", contentMaxWidth: "md", textColorMode: "auto",
  animation: "none", fullWidth: false,
};

// `any` is required here, not a shortcut: this array holds BlockDefinition<T> for many different T (each
// entry individually typed via its own `as BlockDefinition<XData>` cast below), and TData's contravariant
// use in `onChange: (next: TData) => void` makes `BlockDefinition<unknown>[]` fail to typecheck against
// any specific entry -- confirmed by trying it and getting real tsc errors, not assumed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const contentBlocks: BlockDefinition<any>[] = [
  {
    type: "HERO",
    label: "Hero",
    category: "content",
    icon: Sparkles,
    dataSchema: heroSchema,
    defaultData: {
      en: {
        eyebrow: "", headline: "Your headline here", subheading: "",
        ctaLabel: "", ctaUrl: "", ctaVisible: true, ctaStyle: "primary", ctaExternal: false,
        ctaLabel2: "", ctaUrl2: "", ctaVisible2: true, ctaStyle2: "secondary", ctaExternal2: false,
        ctaPositionMode: "flow", ctaX: 75, ctaY: 80, ctaMirrorForRtl: false,
        ctaXTablet: null, ctaYTablet: null, ctaXMobile: null, ctaYMobile: null,
        mediaType: "image", layout: "split", desktopMediaId: "", mobileMediaId: "", posterId: "",
        imagePosition: "center", focalX: 50, focalY: 50, imageFit: "cover",
        imageFitMobile: "", focalXMobile: null, focalYMobile: null,
        overlayOpacity: 35, animation: "slow-zoom", animationDurationMs: null, animationDelayMs: null,
        videoAutoplay: true, videoMuted: true, videoLoop: true,
        frameStyle: "full-bleed", mobileFrameStyle: "", framePreset: "", framePosition: "center", frameX: 0, frameY: 0,
        frameWidth: 100, frameHeight: 100, frameScale: 1, frameRotation: 0, frameOverflow: false,
        frameBorderStyle: "none", frameBorderWidth: 2, frameBorderOpacity: 60, frameBorderColor: "wheat",
        frameGlow: "none", decorativeText: "", decorativeOpacity: 8, decorativePosition: "behind",
        decorativeRotation: 0, parallaxEnabled: true,
        heroHeight: "tall", heroHeightCustomValue: "", contentPosition: "start", verticalAlign: "center", contentMaxWidth: "lg",
        textColorMode: "auto", accentColor: "wheat", overlayDirection: "auto", zoomAmount: 4, animationSpeedSec: 20,
        primaryProductId: "", secondaryProductId: "", supportingProductId: "",
        productsClickable: true, showProductBadges: true, slides: [], slideTransition: "crossfade", carouselAutoplay: true,
        composition: DEFAULT_COMPOSITION,
      },
      ar: {
        eyebrow: "", headline: "العنوان الرئيسي هنا", subheading: "",
        ctaLabel: "", ctaUrl: "", ctaVisible: true, ctaStyle: "primary", ctaExternal: false,
        ctaLabel2: "", ctaUrl2: "", ctaVisible2: true, ctaStyle2: "secondary", ctaExternal2: false,
        ctaPositionMode: "flow", ctaX: 75, ctaY: 80, ctaMirrorForRtl: false,
        ctaXTablet: null, ctaYTablet: null, ctaXMobile: null, ctaYMobile: null,
        mediaType: "image", layout: "split", desktopMediaId: "", mobileMediaId: "", posterId: "",
        imagePosition: "center", focalX: 50, focalY: 50, imageFit: "cover",
        imageFitMobile: "", focalXMobile: null, focalYMobile: null,
        overlayOpacity: 35, animation: "slow-zoom", animationDurationMs: null, animationDelayMs: null,
        videoAutoplay: true, videoMuted: true, videoLoop: true,
        frameStyle: "full-bleed", mobileFrameStyle: "", framePreset: "", framePosition: "center", frameX: 0, frameY: 0,
        frameWidth: 100, frameHeight: 100, frameScale: 1, frameRotation: 0, frameOverflow: false,
        frameBorderStyle: "none", frameBorderWidth: 2, frameBorderOpacity: 60, frameBorderColor: "wheat",
        frameGlow: "none", decorativeText: "", decorativeOpacity: 8, decorativePosition: "behind",
        decorativeRotation: 0, parallaxEnabled: true,
        heroHeight: "tall", heroHeightCustomValue: "", contentPosition: "start", verticalAlign: "center", contentMaxWidth: "lg",
        textColorMode: "auto", accentColor: "wheat", overlayDirection: "auto", zoomAmount: 4, animationSpeedSec: 20,
        primaryProductId: "", secondaryProductId: "", supportingProductId: "",
        productsClickable: true, showProductBadges: true, slides: [], slideTransition: "crossfade", carouselAutoplay: true,
        composition: DEFAULT_COMPOSITION,
      },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
    Edit: HeroEdit,
    Render: HeroRender,
    resolveData: resolveHeroData,
    // Only full-bleed layout actually wants to bleed off the section's normal container -- split
    // mode keeps its own framed column inside the standard chrome, unchanged.
    bleedsWhen: (data: HeroData) => data.layout === "full-bleed",
  } as BlockDefinition<HeroData>,
  {
    type: "HEADING",
    label: "Heading",
    category: "content",
    icon: Heading1,
    dataSchema: headingSchema,
    defaultData: { en: { text: "Section heading", level: "h2" }, ar: { text: "عنوان القسم", level: "h2" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: HeadingEdit,
    Render: HeadingRender,
  } as BlockDefinition<HeadingData>,
  {
    type: "RICH_TEXT",
    label: "Rich Text",
    category: "content",
    icon: Type,
    dataSchema: richTextSchema,
    defaultData: { en: { html: "<p>Write something...</p>" }, ar: { html: "<p>اكتب شيئًا...</p>" } },
    defaultSettings: defaultSectionSettings({ desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "lg", bodySize: "md", visible: true } }),
    Edit: RichTextEdit,
    Render: RichTextRender,
  } as BlockDefinition<RichTextData>,
  {
    type: "PAGE_INTRO",
    label: "Page Intro (eyebrow/title/description)",
    category: "content",
    icon: Heading1,
    dataSchema: pageIntroSchema,
    defaultData: { en: { eyebrow: "", title: "Page title", description: "", headingLevel: "h1" }, ar: { eyebrow: "", title: "عنوان الصفحة", description: "", headingLevel: "h1" } },
    defaultSettings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "xl", marginY: "none", align: "left", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
    Edit: PageIntroEdit,
    Render: PageIntroRender,
  } as BlockDefinition<PageIntroData>,
  {
    type: "CTA",
    label: "CTA",
    category: "content",
    icon: MousePointerClick,
    dataSchema: ctaSchema,
    defaultData: {
      en: { heading: "Ready to get started?", body: "", ctaLabel: "Contact us", ctaUrl: "/contact", layout: "centered", image: null },
      ar: { heading: "هل أنت مستعد للبدء؟", body: "", ctaLabel: "تواصل معنا", ctaUrl: "/contact", layout: "centered", image: null },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
    Edit: CtaEdit,
    Render: CtaRender,
  } as BlockDefinition<CtaData>,
  {
    type: "BANNER",
    label: "Banner",
    category: "content",
    icon: RectangleHorizontal,
    dataSchema: bannerSchema,
    defaultData: {
      en: { ...DEFAULT_BANNER, eyebrow: "", heading: "Banner heading", body: "", ctaLabel: "Contact us" },
      ar: { ...DEFAULT_BANNER, eyebrow: "", heading: "عنوان البانر", body: "", ctaLabel: "تواصل معنا" },
    },
    defaultSettings: defaultSectionSettings({ background: "paper", desktop: { paddingY: "md", marginY: "none", align: "left", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
    Edit: BannerEdit,
    Render: BannerRender,
    bleedsWhen: (data: BannerData) => data.fullWidth,
  } as BlockDefinition<BannerData>,
];
