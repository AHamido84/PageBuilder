"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ClipReveal, Parallax } from "@/lib/motion/primitives";
import { DURATION, EASE_PREMIUM } from "@/lib/motion/motionTokens";
import type { HeroAnimation } from "../content-blocks";

/**
 * Pieces shared between Hero's image/video render (hero.tsx) and its slideshow render
 * (hero-slideshow-render.tsx) -- split into their own file so those two never import from each
 * other directly (hero.tsx already imports HeroSlideshow to dispatch on mediaType, so the reverse
 * import would be a cycle).
 */

/** The split (media in its own column) / full-bleed (media behind the text) outer composition, shared by image/video mode (HeroRender) and slideshow mode (HeroSlideshow) so the two never drift apart. */
export function HeroFrame({
  layout,
  overlayOpacity,
  media,
  content,
  allowOverflow = false,
  hideOverlay = false,
}: {
  layout: "split" | "full-bleed";
  overlayOpacity: number;
  media: React.ReactNode;
  content: React.ReactNode;
  /** Split layout only -- lets a premium frame shape spill slightly past its column (brief §25's "controlled overflow"), e.g. an oval/blob nudged toward the text with `frameScale`/`frameX`/`frameY`. */
  allowOverflow?: boolean;
  /** True when `media` already carries its own overlay/scrim inside a shape-clipped layer (HeroFrameShape) -- a plain rectangular overlay drawn over this box would otherwise visibly poke out past a non-rectangular frame shape's edges. */
  hideOverlay?: boolean;
}) {
  const isFullBleed = layout === "full-bleed";
  // Split mode: a directional scrim behind a boxed side-image (only the bottom edge needs darkening
  // for the caption-like feel). Full-bleed: text can overlay anywhere across the image, so a flat
  // wash reads correctly regardless of text position or RTL/LTR direction (no gradient-direction math needed).
  const overlayStyle = isFullBleed
    ? { backgroundColor: `rgba(10,24,38,${overlayOpacity / 100})` }
    : { background: `linear-gradient(to top, rgba(10,24,38,${overlayOpacity / 100}) 0%, rgba(10,24,38,0) 60%)` };

  if (isFullBleed) {
    return (
      <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
        {media}
        {media ? <div className="pointer-events-none absolute inset-0" style={overlayStyle} /> : null}
        <div className="relative z-10 px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">{content}</div>
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
          {hideOverlay ? null : <div className="pointer-events-none absolute inset-0" style={overlayStyle} />}
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
  children,
}: {
  animation: HeroAnimation;
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce || animation === "none") return <div className={className}>{children}</div>;

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
