"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ClipReveal, Parallax } from "@/lib/motion/primitives";
import { DURATION, EASE_PREMIUM } from "@/lib/motion/motionTokens";
import type { HeroAnimation, HeroHeight, HeroContentPosition, HeroVerticalAlign, HeroContentMaxWidth, HeroTextColorMode, HeroOverlayDirection } from "../content-blocks";

/**
 * Pieces shared between Hero's image/video render (hero.tsx) and its slideshow render
 * (hero-slideshow-render.tsx) -- split into their own file so those two never import from each
 * other directly (hero.tsx already imports HeroSlideshow to dispatch on mediaType, so the reverse
 * import would be a cycle).
 */

/** Minimum heights are deliberately literal per-token strings, never assembled at runtime (same
 * rule as style-tokens.ts's PADDING_Y_* tables) -- Tailwind v4's JIT scanner needs the exact class
 * substring physically present in source. "tall" combines a real viewport fraction with a hard px
 * floor via CSS `max()` so a short/wide viewport (e.g. a laptop in a browser window) never collapses
 * below a usable height -- matches the brief's "85-100vh, minimum 780px" (§1). */
const HERO_HEIGHT_CLASSES: Record<HeroHeight, string> = {
  compact: "min-h-[520px] sm:min-h-[580px] lg:min-h-[620px]",
  standard: "min-h-[600px] sm:min-h-[680px] lg:min-h-[780px]",
  tall: "min-h-[650px] sm:min-h-[760px] lg:min-h-[max(780px,85vh)]",
  viewport: "min-h-[650px] sm:min-h-[760px] lg:min-h-[100svh]",
};

const CONTENT_MAX_WIDTH_CLASSES: Record<HeroContentMaxWidth, string> = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-3xl" };
// "items-*"/"text-start"/"text-end" are already writing-mode/RTL-aware in CSS -- no manual
// left/right branching needed here (same trusted pattern style-tokens.ts's ALIGN_BASE relies on).
const CONTENT_H_CLASSES: Record<HeroContentPosition, string> = { start: "items-start text-start", center: "items-center text-center", end: "items-end text-end" };
const CONTENT_V_CLASSES: Record<HeroVerticalAlign, string> = { top: "justify-start", center: "justify-center", bottom: "justify-end" };
// "auto" always resolves to "light" (paper) -- the sane default for text sitting on a dark
// gradient scrim, matching how the brief's own example pairs #FFFFFF primary text with the dark
// overlay. A real per-pixel luminance sampling of the background image behind the text (the
// literal "read the pixels and decide" interpretation of "smart adaptation") isn't something this
// stack has infrastructure for and would be substantial new surface for a marginal gain over
// "light text + a well-tuned scrim", which is what the vast majority of real premium hero designs
// actually ship -- "dark" remains available as a deliberate admin override for a bright photo.
const TEXT_COLOR_CLASSES: Record<"light" | "dark", string> = { light: "text-paper", dark: "text-ink" };

/** Ink, at the exact rgb triple hero.tsx's own split-mode overlay already uses (kept identical for
 * one consistent scrim color across both Hero layouts, not a second slightly-different value). */
function inkRgba(alpha: number): string {
  return `rgba(10,24,38,${Math.max(0, Math.min(1, alpha)).toFixed(2)})`;
}

/**
 * The full-bleed cinematic overlay: strong behind the text, fading toward the product (brief §5) --
 * never a single flat wash. "start"/"end" are logical and get mirrored for RTL here (brief §12);
 * "auto" derives the direction from where the content itself sits so the two never disagree by
 * accident. Returns null (no overlay layer at all) for "none" or a fully-transparent opacity.
 */
function resolveOverlayGradient(direction: HeroOverlayDirection, contentPosition: HeroContentPosition, opacityPct: number, isRtl: boolean): string | null {
  if (direction === "none" || opacityPct <= 0) return null;
  const strong = opacityPct / 100;
  const mid = strong * 0.32;
  const effective = direction === "auto" ? contentPosition : direction;

  if (effective === "center") return `linear-gradient(to top, ${inkRgba(strong)} 0%, ${inkRgba(mid)} 45%, ${inkRgba(0)} 85%)`;
  if (effective === "top") return `linear-gradient(to bottom, ${inkRgba(strong)} 0%, ${inkRgba(mid)} 45%, ${inkRgba(0)} 85%)`;
  if (effective === "bottom") return `linear-gradient(to top, ${inkRgba(strong)} 0%, ${inkRgba(mid)} 45%, ${inkRgba(0)} 85%)`;

  // CSS linear-gradient direction is always physical, not writing-mode-aware -- "start" means
  // visually-left in LTR but visually-right in RTL, so it has to be resolved to a physical
  // "to right"/"to left" by hand here (unlike items-*/text-start above, which the browser already
  // resolves for us).
  const strongOnPhysicalLeft = effective === "start" ? !isRtl : isRtl;
  return strongOnPhysicalLeft
    ? `linear-gradient(to right, ${inkRgba(strong)} 0%, ${inkRgba(mid)} 55%, ${inkRgba(0)} 100%)`
    : `linear-gradient(to left, ${inkRgba(strong)} 0%, ${inkRgba(mid)} 55%, ${inkRgba(0)} 100%)`;
}

export interface HeroFullBleedOptions {
  height: HeroHeight;
  contentPosition: HeroContentPosition;
  verticalAlign: HeroVerticalAlign;
  contentMaxWidth: HeroContentMaxWidth;
  textColorMode: HeroTextColorMode;
  overlayDirection: HeroOverlayDirection;
  isRtl: boolean;
  /** Pre-computed pointer-parallax transform for the content layer -- a smaller, independent depth
   * from the background media's own parallax (brief §7's "foreground overlay elements: slightly
   * different movement speed"). Undefined when parallax is disabled/unsupported (touch, reduced motion). */
  contentParallaxStyle?: React.CSSProperties;
}

/** The split (media in its own column) / full-bleed (media as an edge-to-edge cinematic background) outer composition, shared by image/video mode (HeroRender) and slideshow mode (HeroSlideshow) so the two never drift apart. */
export function HeroFrame({
  layout,
  overlayOpacity,
  media,
  content,
  allowOverflow = false,
  hideOverlay = false,
  fullBleed,
}: {
  layout: "split" | "full-bleed";
  overlayOpacity: number;
  media: React.ReactNode;
  content: React.ReactNode;
  /** Split layout only -- lets a premium frame shape spill slightly past its column (brief §25's "controlled overflow"), e.g. an oval/blob nudged toward the text with `frameScale`/`frameX`/`frameY`. */
  allowOverflow?: boolean;
  /** True when `media` already carries its own overlay/scrim inside a shape-clipped layer (HeroFrameShape) -- a plain rectangular overlay drawn over this box would otherwise visibly poke out past a non-rectangular frame shape's edges. */
  hideOverlay?: boolean;
  /** Full-bleed layout only. Falls back to sane defaults (matching heroSchema's own) if omitted -- callers that haven't been updated for these fields yet (e.g. an older slide) still render correctly. */
  fullBleed?: Partial<HeroFullBleedOptions>;
}) {
  const isFullBleed = layout === "full-bleed";
  // Split mode only, unchanged: a directional scrim behind a boxed side-image (only the bottom
  // edge needs darkening for the caption-like feel).
  const splitOverlayStyle = { background: `linear-gradient(to top, ${inkRgba(overlayOpacity / 100)} 0%, ${inkRgba(0)} 60%)` };

  if (isFullBleed) {
    const height = fullBleed?.height ?? "tall";
    const contentPosition = fullBleed?.contentPosition ?? "start";
    const verticalAlign = fullBleed?.verticalAlign ?? "center";
    const contentMaxWidth = fullBleed?.contentMaxWidth ?? "lg";
    const textColorMode = fullBleed?.textColorMode ?? "auto";
    const resolvedTextColor: "light" | "dark" = textColorMode === "dark" ? "dark" : "light";
    const gradient = resolveOverlayGradient(fullBleed?.overlayDirection ?? "auto", contentPosition, overlayOpacity, fullBleed?.isRtl ?? false);

    return (
      // No rounded corners, no max-width, no card feel (brief §1) -- SectionShell already skips
      // its own max-w-[1400px]/padding/border-t chrome for this block (see BlockDefinition.bleedsWhen
      // on the HERO registry entry), so `w-full` here really does span the true page width on the
      // public site, and the admin canvas's own device-preview frame on the builder (which is the
      // correct WYSIWYG behavior in both places -- no viewport-escaping transform trick needed).
      <div className={`relative w-full overflow-hidden ${HERO_HEIGHT_CLASSES[height]}`}>
        {media}
        {media && gradient ? <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: gradient }} /> : null}
        <div
          className={`relative z-10 flex h-full flex-col px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 ${CONTENT_V_CLASSES[verticalAlign]} ${CONTENT_H_CLASSES[contentPosition]}`}
        >
          <div className={`${CONTENT_MAX_WIDTH_CLASSES[contentMaxWidth]} ${TEXT_COLOR_CLASSES[resolvedTextColor]}`} style={fullBleed?.contentParallaxStyle}>
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${allowOverflow ? "lg:overflow-visible" : ""}`}>
      {/* Mobile composition order is Background/Product -> Text -> CTA (brief §42), not a plain
          top-to-bottom stack of whatever the DOM order happens to be -- `content` renders first in
          DOM for desktop's RTL-correct grid-track placement (see its own comment at the call site),
          so on the single-column mobile layout it needs a visual `order` swap to put the media above
          the text instead of below it. `lg:order-*` resets to the natural (already-correct) DOM order
          at the breakpoint where the grid-track reasoning applies. */}
      <div className="order-2 lg:order-1">{content}</div>
      {media ? (
        <div className={`relative order-1 aspect-[4/3] rounded-[var(--radius-lg)] lg:order-2 lg:aspect-[5/4] ${allowOverflow ? "" : "overflow-hidden"}`}>
          {media}
          {hideOverlay ? null : <div className="pointer-events-none absolute inset-0" style={splitOverlayStyle} />}
        </div>
      ) : null}
    </div>
  );
}

/** Wraps the media frame in the chosen entrance/ambient animation. No-ops under prefers-reduced-motion. `delay` staggers this layer's entrance relative to the rest of the composition (brief §16). */
export function HeroMediaMotion({
  animation,
  className,
  delay = 0,
  zoomAmount = 4,
  speedSec = 20,
  children,
}: {
  animation: HeroAnimation;
  className?: string;
  delay?: number;
  /** "cinematic-loop" only: percent scale increase per breath (e.g. 4 => 1.00 -> 1.04 -> 1.00). Ignored by every other animation value. */
  zoomAmount?: number;
  /** "cinematic-loop" only: seconds for one full out-and-back cycle. Ignored by every other animation value. */
  speedSec?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce || animation === "none") return <div className={className}>{children}</div>;

  if (animation === "cinematic-loop") {
    // Genuinely infinite, unlike every other case here (which plays once on mount and stops) --
    // the "the background feels alive" ambient treatment for a full-bleed cinematic Hero (brief
    // §6): scale breathes between 1 and 1+zoomAmount%, easing both ways, forever.
    return (
      <div className={className}>
        <motion.div
          className="h-full w-full"
          animate={{ scale: [1, 1 + zoomAmount / 100, 1] }}
          transition={{ duration: speedSec, repeat: Infinity, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (animation === "fade" || animation === "morph") {
    // "morph" gets its shape-interpolation animation from HeroFrameShape itself -- here it just
    // needs a plain fade-in like any other layer, not a second, competing motion treatment.
    return (
      <motion.div className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DURATION.large, delay, ease: EASE_PREMIUM }}>
        {children}
      </motion.div>
    );
  }
  if (animation === "scale") {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.large, delay, ease: EASE_PREMIUM }}
      >
        {children}
      </motion.div>
    );
  }
  if (animation === "float") {
    // Cinematic idle drift (brief §15) -- 0 to -8px to 0, 5-7s, ease-in-out, never a bounce.
    return (
      <motion.div className={className} animate={{ y: [0, -8, 0] }} transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}>
        {children}
      </motion.div>
    );
  }
  if (animation === "parallax") {
    return (
      <Parallax offset={24} className={className}>
        {children}
      </Parallax>
    );
  }
  if (animation === "reveal") {
    return (
      <ClipReveal className={className}>{children}</ClipReveal>
    );
  }
  if (animation === "cinematic") {
    return (
      <ClipReveal className={className}>
        <motion.div className="h-full w-full" initial={{ scale: 1 }} animate={{ scale: 1.06 }} transition={{ duration: 22, ease: "linear" }}>
          {children}
        </motion.div>
      </ClipReveal>
    );
  }
  // "slow-zoom" (default) — a subtle continuous Ken Burns drift, the brief's requested default.
  return (
    <div className={className}>
      <motion.div className="h-full w-full" initial={{ scale: 1 }} animate={{ scale: 1.08 }} transition={{ duration: 20, ease: "linear" }}>
        {children}
      </motion.div>
    </div>
  );
}

/** A single hero <video> layer with a graceful fallback: on load/decode failure, swap to the poster image instead (never a broken video icon). No poster + a failed video renders nothing, matching image mode's own empty-slot behavior. */
export function HeroVideoLayer({
  src,
  poster,
  autoPlay,
  muted,
  loop,
  className,
  style,
}: {
  src: string;
  poster?: string;
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return poster ? <Image src={poster} alt="" fill sizes="100vw" className={className} style={style} /> : null;
  }

  return (
    <video
      // A server-rendered <video src> can start fetching (and fail -- a stale/deleted Media
      // row, a CSP-blocked host) before React finishes hydrating and attaches `onError` below,
      // so a pre-hydration failure would otherwise go undetected. `ref` runs on the real DOM
      // node as soon as it's committed and checks the already-set `.error` for that case.
      ref={(node) => {
        if (node?.error) setFailed(true);
      }}
      src={src}
      poster={poster || undefined}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}
