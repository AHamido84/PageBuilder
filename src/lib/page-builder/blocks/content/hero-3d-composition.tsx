"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { usePointerParallaxContainer, pointerParallaxStyle } from "@/lib/motion/primitives";
import { EASE_PREMIUM } from "@/lib/motion/motionTokens";
import { HeroMediaMotion } from "./hero-shared";
import { FRAME_SHAPE_CSS } from "./frame-shapes";
import type { HeroRenderData, HeroCompositionData } from "../content-blocks";

/**
 * "3D Composition" mode's media slot -- a layered arrangement of plain Media Library images
 * (background/main/secondary/product/decorative), each with its own subtle independent motion,
 * for a premium depth feel without animating one flat image as a single object (see the request's
 * own "do not animate the entire image as one object" rule). Deliberately built on the exact same
 * primitives (HeroMediaMotion, pointer-parallax, per-layer staggered float) already proven by
 * HeroProductComposition (hero-product-composition-render.tsx) and Hero's own framed-image branch
 * (hero.tsx) -- no new animation system, no new dependency.
 *
 * Content is arbitrary uploaded Media (resolveHeroData/hero-resolve.ts), unlike
 * "product-composition" mode which references real Product catalog rows -- the two modes solve
 * different problems and stay fully independent.
 */

const SHADOW_CLASSES: Record<HeroCompositionData["shadow"], string> = {
  none: "",
  sm: "shadow-[0_8px_24px_-10px_rgba(11,28,44,0.25)]",
  md: "shadow-[0_20px_48px_-14px_rgba(11,28,44,0.35)]",
  lg: "shadow-[0_32px_72px_-18px_rgba(11,28,44,0.45)]",
};

const OVERLAY_BACKGROUND: Record<HeroCompositionData["overlay"], string | undefined> = {
  none: undefined,
  light: "linear-gradient(to top, rgba(247,248,245,0.3) 0%, rgba(247,248,245,0) 60%)",
  dark: "linear-gradient(to top, rgba(11,28,44,0.42) 0%, rgba(11,28,44,0) 60%)",
  gradient: "linear-gradient(135deg, rgba(7,86,78,0.28) 0%, rgba(238,102,90,0.1) 100%)",
};

const MAIN_POSITION_CLASSES: Record<HeroCompositionData["mainPosition"], string> = {
  // Logical (start/end), genuinely RTL-mirrored -- same convention as hero.tsx's own
  // FRAME_POSITION_ALIGN table (confirmed there against a live /ar render).
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
};

const BLEND_CLASSES: Record<HeroCompositionData["blendMode"], string> = {
  normal: "",
  multiply: "mix-blend-multiply",
  screen: "mix-blend-screen",
  "soft-light": "mix-blend-soft-light",
};

/** One-time fade(-slide) entrance, wrapping a layer's own continuous motion (nested, not merged --
 * same two-motion-layers-composing-independently pattern hero.tsx already uses for its
 * static rotate/scale + pointer-parallax pair). No-ops (renders children directly) when
 * `entrance === "none"` or reduced motion is active -- the wrapped layer still gets its own
 * ongoing float/Ken-Burns treatment, only the initial slide-in is skipped. */
function Entrance({
  mode,
  delay,
  reduce,
  className,
  style,
  children,
}: {
  mode: HeroCompositionData["entrance"];
  delay: number;
  reduce: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (mode === "none" || reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: mode === "fade-slide" ? 20 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, delay, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}

/** Continuous, independent float -- the exact `animate={{ y: [0, -distance, 0] }}` loop
 * HeroProductComposition already uses per layer, just parameterized by the composition's own
 * intensity/speed sliders. No-ops under reduced motion or when floating is disabled. */
function Float({
  distance,
  duration,
  delay,
  active,
  className,
  style,
  children,
}: {
  distance: number;
  duration: number;
  delay: number;
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (!active) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div className={className} style={style} animate={{ y: [0, -distance, 0] }} transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}

/** `locale` is part of the props type (not destructured -- unused) for API parity with
 * HeroProductComposition/HeroRender's other media components, every one of which takes `locale`;
 * this one doesn't need it yet since RTL is handled entirely via logical CSS properties
 * (start/end, inset-inline-*) rather than explicit branching. */
export function HeroComposition({ data }: { data: HeroRenderData; locale: string }) {
  const c = data.composition;
  const media = data.compositionMedia;
  const reduce = Boolean(useReducedMotion());
  const { ref: parallaxRef, x: parallaxX, y: parallaxY, enabled: parallaxSupported } = usePointerParallaxContainer<HTMLDivElement>();

  // Ordered arrays derived from the id-keyed maps, preserving the admin's chosen order and
  // silently skipping any id whose Media row no longer resolves (deleted/broken reference) --
  // never a broken-image icon.
  const productUrls = media ? c.productImageIds.map((id) => media.productUrls[id]).filter((url): url is string => Boolean(url)) : [];
  const decorativeUrls = media ? c.decorativeImageIds.map((id) => media.decorativeUrls[id]).filter((url): url is string => Boolean(url)) : [];

  const hasAny = media && (media.backgroundUrl || media.mainUrl || media.secondaryUrl || productUrls.length > 0 || decorativeUrls.length > 0);
  if (!media || !hasAny) return null;

  const floatingActive = !reduce && c.animationEnabled && c.floating;
  const parallaxActive = !reduce && c.animationEnabled && c.hoverInteraction && parallaxSupported;
  // 50 is the slider's own default/neutral point -> 1x; 0 -> 0.4x (barely moving), 100 -> 1.6x.
  const intensityScale = 0.4 + (c.intensity / 100) * 1.2;
  const speedScale = c.speed > 0 ? 1 / c.speed : 1; // higher "speed" setting => shorter duration

  const shape = c.frameStyle === "rounded-rectangle" ? { borderRadius: `${c.borderRadius}px` } : FRAME_SHAPE_CSS[c.frameStyle];
  const overlayBackground = OVERLAY_BACKGROUND[c.overlay];

  return (
    <div ref={parallaxRef} className="absolute inset-0 overflow-hidden">
      {/* Layer 1 — background: desktop/mobile split, Ken Burns via the existing animation system. */}
      {media.backgroundUrl ? (
        <HeroMediaMotion animation={c.animationEnabled ? "slow-zoom" : "none"} className="absolute inset-0">
          <Image
            src={media.backgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${media.mobileBackgroundUrl ? "hidden lg:block" : ""}`}
          />
          {media.mobileBackgroundUrl ? (
            <Image src={media.mobileBackgroundUrl} alt="" fill priority sizes="100vw" className="object-cover lg:hidden" />
          ) : null}
        </HeroMediaMotion>
      ) : null}

      {/* Layer 2 — decorative images: lowest opacity, slowest independent drift, hidden on mobile
          (composition.mobileLayout narrows to fewer layers there, matching every other Hero mode's
          own desktop/mobile split rather than shrinking the same dense scene). */}
      {c.mobileLayout !== "background-only" && decorativeUrls.length > 0 ? (
        <div className="absolute inset-0 z-10 hidden lg:block">
          {decorativeUrls.map((url, i) => {
            // Four corner-ish anchors, logical (inset-inline-*) so they mirror correctly under RTL.
            const corners = [
              { insetInlineStart: "2%", top: "8%" },
              { insetInlineEnd: "4%", bottom: "10%" },
              { insetInlineStart: "10%", bottom: "4%" },
              { insetInlineEnd: "10%", top: "4%" },
            ];
            return (
              <Entrance key={url} mode={c.entrance} delay={0.5 + i * 0.1} reduce={reduce}>
                <Float
                  distance={8 * intensityScale}
                  duration={(9 + i) * speedScale}
                  delay={i * 0.3}
                  active={floatingActive}
                  className="absolute h-[16%] w-[16%] opacity-40"
                  style={corners[i % corners.length]}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-md)]">
                    <Image src={url} alt="" fill sizes="20vw" className="object-cover" />
                  </div>
                </Float>
              </Entrance>
            );
          })}
        </div>
      ) : null}

      {/* Layer 3 — secondary image: mid float, offset opposite the main image. */}
      {c.mobileLayout === "simplified" && media.secondaryUrl ? (
        <Entrance mode={c.entrance} delay={0.3} reduce={reduce} className="absolute inset-0 z-20 hidden md:block">
          <Float distance={10 * intensityScale} duration={7 * speedScale} delay={0.4} active={floatingActive} className="absolute bottom-[6%] start-[4%] h-[38%] w-[38%]">
            <div className={`relative h-full w-full overflow-hidden ${SHADOW_CLASSES[c.shadow]}`} style={shape}>
              <Image src={media.secondaryUrl} alt="" fill sizes="(min-width: 1024px) 24vw, 40vw" className="object-cover" style={{ opacity: c.opacity / 100 }} />
              {overlayBackground ? <div className="pointer-events-none absolute inset-0" style={{ background: overlayBackground }} /> : null}
            </div>
          </Float>
        </Entrance>
      ) : null}

      {/* Layer 4 — main image: largest, positioned per mainPosition, sized by width/height, with
          optional pointer-parallax depth (a smaller, independent depth from the background's own
          Ken Burns above -- same "shared pointer position, per-layer depth" idea as hero.tsx's
          contentParallaxStyle vs. its background bgParallax). */}
      {media.mainUrl ? (
        <div className={`absolute inset-0 z-30 flex items-center ${MAIN_POSITION_CLASSES[c.mainPosition]}`}>
          <Entrance mode={c.entrance} delay={0.15} reduce={reduce} className="relative" style={{ width: `${c.width}%`, height: `${c.height}%` }}>
            <Float distance={12 * intensityScale} duration={6.5 * speedScale} delay={0} active={floatingActive} className="h-full w-full">
              <div className="h-full w-full transition-transform duration-300 ease-out" style={parallaxActive ? pointerParallaxStyle(parallaxX, parallaxY, 14) : undefined}>
                <div className={`relative h-full w-full overflow-hidden ${SHADOW_CLASSES[c.shadow]} ${BLEND_CLASSES[c.blendMode]}`} style={shape}>
                  <Image src={media.mainUrl} alt="" fill priority sizes="(min-width: 1024px) 50vw, 90vw" className="object-cover" style={{ opacity: c.opacity / 100 }} />
                  {overlayBackground ? <div className="pointer-events-none absolute inset-0" style={{ background: overlayBackground }} /> : null}
                </div>
              </div>
            </Float>
          </Entrance>
        </div>
      ) : null}

      {/* Layer 5 — product images: foreground, staggered scatter + float, same technique as
          HeroProductComposition's layered product scene. */}
      {c.mobileLayout === "simplified" && productUrls.length > 0 ? (
        <div className="absolute inset-0 z-40 hidden sm:block">
          {productUrls.map((url, i) => {
            const size = 26 - i * 2;
            const positions = [
              { insetInlineEnd: "2%", top: "4%" },
              { insetInlineStart: "0%", bottom: "0%" },
              { insetInlineEnd: "18%", bottom: "-2%" },
              { insetInlineStart: "20%", top: "0%" },
              { insetInlineEnd: "0%", top: "34%" },
              { insetInlineStart: "2%", top: "36%" },
            ];
            return (
              <Entrance key={url} mode={c.entrance} delay={0.6 + i * 0.12} reduce={reduce}>
                <Float
                  distance={9 * intensityScale}
                  duration={(6 + i * 0.7) * speedScale}
                  delay={0.2 + i * 0.2}
                  active={floatingActive}
                  className="absolute"
                  style={{ width: `${size}%`, height: `${size}%`, ...positions[i % positions.length] }}
                >
                  <div className={`relative h-full w-full overflow-hidden ${SHADOW_CLASSES[c.shadow]}`} style={shape}>
                    <Image src={url} alt="" fill sizes="(min-width: 1024px) 18vw, 30vw" className="object-cover" />
                  </div>
                </Float>
              </Entrance>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
