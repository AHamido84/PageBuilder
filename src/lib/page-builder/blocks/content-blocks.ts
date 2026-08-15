import { z } from "zod";
import type { MediaType } from "@prisma/client";
import { Heading1, MousePointerClick, Sparkles, Type } from "lucide-react";
import type { BlockDefinition } from "../types";
import { defaultSectionSettings } from "../types";
import { HeroEdit, HeroRender } from "./content/hero";
import { resolveHeroData } from "./content/hero-resolve";
import { FRAME_STYLES, FRAME_BORDER_STYLES, FRAME_GLOWS } from "./content/frame-shapes";
import { HeadingEdit, HeadingRender } from "./content/heading";
import { RichTextEdit, RichTextRender } from "./content/rich-text";
import { CtaEdit, CtaRender } from "./content/cta";

const heroButtonStyleSchema = z.enum(["primary", "secondary", "ghost"]);
export type HeroButtonStyle = z.infer<typeof heroButtonStyleSchema>;

// "scale"/"morph"/"float" added for the premium frame system (morph only visually applies to the
// three organic/blob frame styles; float/scale apply to any frame). Same field, still just "the
// media/frame's entrance-and-ambient treatment" -- not a second parallel animation field.
const heroAnimationSchema = z.enum(["none", "fade", "slow-zoom", "parallax", "reveal", "cinematic", "scale", "morph", "float"]);
export type HeroAnimation = z.infer<typeof heroAnimationSchema>;

const heroImagePositionSchema = z.enum(["center", "top", "bottom", "left", "right", "custom"]);
export type HeroImagePosition = z.infer<typeof heroImagePositionSchema>;

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
});
export type HeroSlide = z.infer<typeof heroSlideSchema>;

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

  // Media
  mediaType: z.enum(["image", "video", "slideshow", "product-composition"]).default("image"),
  // "split": media in its own framed column beside the text (current default). "full-bleed": media
  // stretches across the whole section as a background layer, text overlays on top of it.
  layout: z.enum(["split", "full-bleed"]).default("split"),
  desktopMediaId: z.string().optional().default(""),
  mobileMediaId: z.string().optional().default(""), // "" => falls back to desktopMediaId
  posterId: z.string().optional().default(""), // video mode only
  imagePosition: heroImagePositionSchema.default("center"),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  overlayOpacity: z.number().min(0).max(100).default(35),
  animation: heroAnimationSchema.default("slow-zoom"),
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

const ctaSchema = z.object({
  heading: z.string().max(200).optional().default(""),
  body: z.string().max(500).optional().default(""),
  ctaLabel: z.string().max(60),
  ctaUrl: z.string().max(300),
});
export type CtaData = z.infer<typeof ctaSchema>;

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
        mediaType: "image", layout: "split", desktopMediaId: "", mobileMediaId: "", posterId: "",
        imagePosition: "center", focalX: 50, focalY: 50, overlayOpacity: 35, animation: "slow-zoom",
        videoAutoplay: true, videoMuted: true, videoLoop: true,
        frameStyle: "full-bleed", mobileFrameStyle: "", framePreset: "", framePosition: "center", frameX: 0, frameY: 0,
        frameWidth: 100, frameHeight: 100, frameScale: 1, frameRotation: 0, frameOverflow: false,
        frameBorderStyle: "none", frameBorderWidth: 2, frameBorderOpacity: 60, frameBorderColor: "wheat",
        frameGlow: "none", decorativeText: "", decorativeOpacity: 8, decorativePosition: "behind",
        decorativeRotation: 0, parallaxEnabled: true,
        primaryProductId: "", secondaryProductId: "", supportingProductId: "",
        productsClickable: true, showProductBadges: true, slides: [],
      },
      ar: {
        eyebrow: "", headline: "العنوان الرئيسي هنا", subheading: "",
        ctaLabel: "", ctaUrl: "", ctaVisible: true, ctaStyle: "primary", ctaExternal: false,
        ctaLabel2: "", ctaUrl2: "", ctaVisible2: true, ctaStyle2: "secondary", ctaExternal2: false,
        mediaType: "image", layout: "split", desktopMediaId: "", mobileMediaId: "", posterId: "",
        imagePosition: "center", focalX: 50, focalY: 50, overlayOpacity: 35, animation: "slow-zoom",
        videoAutoplay: true, videoMuted: true, videoLoop: true,
        frameStyle: "full-bleed", mobileFrameStyle: "", framePreset: "", framePosition: "center", frameX: 0, frameY: 0,
        frameWidth: 100, frameHeight: 100, frameScale: 1, frameRotation: 0, frameOverflow: false,
        frameBorderStyle: "none", frameBorderWidth: 2, frameBorderOpacity: 60, frameBorderColor: "wheat",
        frameGlow: "none", decorativeText: "", decorativeOpacity: 8, decorativePosition: "behind",
        decorativeRotation: 0, parallaxEnabled: true,
        primaryProductId: "", secondaryProductId: "", supportingProductId: "",
        productsClickable: true, showProductBadges: true, slides: [],
      },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "xl", marginY: "none", align: "center", columns: "1", headingSize: "2xl", bodySize: "md", visible: true } }),
    Edit: HeroEdit,
    Render: HeroRender,
    resolveData: resolveHeroData,
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
    type: "CTA",
    label: "CTA",
    category: "content",
    icon: MousePointerClick,
    dataSchema: ctaSchema,
    defaultData: {
      en: { heading: "Ready to get started?", body: "", ctaLabel: "Contact us", ctaUrl: "/contact" },
      ar: { heading: "هل أنت مستعد للبدء؟", body: "", ctaLabel: "تواصل معنا", ctaUrl: "/contact" },
    },
    defaultSettings: defaultSectionSettings({ background: "ink", desktop: { paddingY: "lg", marginY: "none", align: "center", columns: "1", headingSize: "xl", bodySize: "md", visible: true } }),
    Edit: CtaEdit,
    Render: CtaRender,
  } as BlockDefinition<CtaData>,
];
