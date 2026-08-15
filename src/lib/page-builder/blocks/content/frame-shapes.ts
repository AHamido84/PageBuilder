/**
 * Hero's frame/mask shape registry -- the "premium image frame system" (not a rectangular card).
 * Every shape is expressed as `border-radius` or a percentage-based `clip-path` function
 * (`ellipse()`/`polygon()`/`inset()`), never `clip-path: path()` -- `path()` coordinates are fixed
 * px-like units that don't scale with the box, while `border-radius` percentages and the other
 * clip-path functions' percentages *are* relative to the box, so shapes stay correct at any size
 * (mobile through the 1440px+ cinematic composition). The shadow/glow layer behind the frame
 * (`hero-frame-shape.tsx`) reuses these exact same values so the shadow genuinely follows the
 * shape instead of a generic rectangular `box-shadow`.
 */

export const FRAME_STYLES = [
  "rounded-rectangle",
  "soft-oval",
  "vertical-oval",
  "horizontal-oval",
  "organic-blob",
  "organic-asymmetric-blob",
  "arch",
  "soft-arch",
  "curved-rectangle",
  "diagonal-cut",
  "wave",
  "capsule",
  "asymmetric-curved",
  "full-bleed",
  "custom-organic",
] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number];

export const FRAME_STYLE_LABELS: Record<FrameStyle, string> = {
  "rounded-rectangle": "Rounded Rectangle",
  "soft-oval": "Soft Oval",
  "vertical-oval": "Vertical Oval",
  "horizontal-oval": "Horizontal Oval",
  "organic-blob": "Organic Blob",
  "organic-asymmetric-blob": "Organic Asymmetric Blob",
  arch: "Arch",
  "soft-arch": "Soft Arch",
  "curved-rectangle": "Curved Rectangle",
  "diagonal-cut": "Diagonal Cut",
  wave: "Wave",
  capsule: "Capsule",
  "asymmetric-curved": "Asymmetric Curved Shape",
  "full-bleed": "Full Bleed",
  "custom-organic": "Custom Organic",
};

interface FrameShapeCss {
  borderRadius?: string;
  clipPath?: string;
}

/** The resting shape for each style. Organic styles also get a FRAME_MORPH_TARGET (below) for the optional subtle morph animation. */
export const FRAME_SHAPE_CSS: Record<FrameStyle, FrameShapeCss> = {
  "rounded-rectangle": { borderRadius: "28px" },
  "soft-oval": { clipPath: "ellipse(46% 42% at 50% 50%)" },
  "vertical-oval": { clipPath: "ellipse(36% 47% at 50% 50%)" },
  "horizontal-oval": { clipPath: "ellipse(48% 36% at 50% 50%)" },
  "organic-blob": { borderRadius: "63% 37% 54% 46% / 43% 51% 49% 57%" },
  "organic-asymmetric-blob": { borderRadius: "72% 28% 45% 55% / 48% 62% 38% 52%" },
  arch: { borderRadius: "50% 50% 0 0 / 100% 100% 0 0" },
  "soft-arch": { borderRadius: "40% 40% 0 0 / 68% 68% 0 0" },
  "curved-rectangle": { borderRadius: "12%" },
  "diagonal-cut": { clipPath: "polygon(0% 0%, 100% 0%, 100% 86%, 0% 100%)" },
  wave: { clipPath: "polygon(0% 0%, 100% 0%, 100% 84%, 75% 94%, 50% 84%, 25% 94%, 0% 84%)" },
  capsule: { borderRadius: "9999px" },
  "asymmetric-curved": { borderRadius: "20% 80% 20% 80% / 60% 40% 60% 40%" },
  "full-bleed": {},
  "custom-organic": { borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%" },
};

/** Only organic (border-radius-based, non-symmetric) styles get a morph target -- an oval/arch/wave/capsule morphing would either do nothing (oval/capsule are already symmetric) or look like a glitch (arch/wave/diagonal-cut have structural corners a smooth radius interpolation can't cross without visibly snapping). */
export const FRAME_MORPH_TARGET: Partial<Record<FrameStyle, string>> = {
  "organic-blob": "45% 55% 46% 54% / 55% 45% 58% 42%",
  "organic-asymmetric-blob": "55% 45% 62% 38% / 40% 58% 42% 60%",
  "custom-organic": "56% 44% 40% 60% / 60% 52% 48% 40%",
};

export const FRAME_BORDER_STYLES = ["none", "thin", "medium", "accent", "gradient"] as const;
export type FrameBorderStyle = (typeof FRAME_BORDER_STYLES)[number];

export const FRAME_GLOWS = ["none", "navy", "teal", "gold"] as const;
export type FrameGlow = (typeof FRAME_GLOWS)[number];

export const FRAME_PRESETS = [
  "elegant-oval",
  "organic-premium",
  "editorial-arch",
  "asymmetric-wave",
  "luxury-curved",
  "full-bleed-product",
  "saudi-premium",
  "golden-seven-signature",
] as const;
export type FramePreset = (typeof FRAME_PRESETS)[number];

export const FRAME_PRESET_LABELS: Record<FramePreset, string> = {
  "elegant-oval": "Elegant Oval",
  "organic-premium": "Organic Premium",
  "editorial-arch": "Editorial Arch",
  "asymmetric-wave": "Asymmetric Wave",
  "luxury-curved": "Luxury Curved",
  "full-bleed-product": "Full Bleed Product",
  "saudi-premium": "Saudi Premium",
  "golden-seven-signature": "Golden Seven Signature",
};

export interface FramePresetBundle {
  frameStyle: FrameStyle;
  frameBorderStyle: FrameBorderStyle;
  frameGlow: FrameGlow;
  frameRotation: number;
  animation: "none" | "fade" | "slow-zoom" | "parallax" | "reveal" | "cinematic" | "scale" | "morph" | "float";
  /** Only golden-seven-signature seeds a default decorative-typography value -- every other preset leaves it empty, matching the project's "never invent copy" rule (an admin who picks a shape preset shouldn't get surprise text). */
  decorativeText?: string;
}

/** A preset dropdown that fills several underlying fields at once but leaves them fully editable after -- the exact precedent already used by HeroEdit's own image-position presets (POSITION_PRESETS in hero.tsx). */
export const FRAME_PRESET_BUNDLES: Record<FramePreset, FramePresetBundle> = {
  "elegant-oval": { frameStyle: "soft-oval", frameBorderStyle: "thin", frameGlow: "gold", frameRotation: 0, animation: "reveal" },
  "organic-premium": { frameStyle: "organic-blob", frameBorderStyle: "none", frameGlow: "teal", frameRotation: -2, animation: "morph" },
  "editorial-arch": { frameStyle: "arch", frameBorderStyle: "accent", frameGlow: "none", frameRotation: 0, animation: "cinematic" },
  "asymmetric-wave": { frameStyle: "wave", frameBorderStyle: "none", frameGlow: "navy", frameRotation: 0, animation: "float" },
  "luxury-curved": { frameStyle: "asymmetric-curved", frameBorderStyle: "gradient", frameGlow: "gold", frameRotation: 1, animation: "scale" },
  "full-bleed-product": { frameStyle: "full-bleed", frameBorderStyle: "none", frameGlow: "none", frameRotation: 0, animation: "slow-zoom" },
  "saudi-premium": { frameStyle: "curved-rectangle", frameBorderStyle: "medium", frameGlow: "gold", frameRotation: 0, animation: "cinematic" },
  "golden-seven-signature": {
    frameStyle: "organic-asymmetric-blob",
    frameBorderStyle: "gradient",
    frameGlow: "gold",
    frameRotation: -1,
    animation: "cinematic",
    decorativeText: "SEVEN",
  },
};
