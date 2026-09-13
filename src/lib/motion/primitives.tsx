"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ElementType, type RefObject } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { DURATION, EASE_PREMIUM } from "./motionTokens";
import { useDesignAnimationSettings } from "@/components/site/design-animation-context";

/** Phase 10 `ScrollReveal`'s `as` prop: a fixed, module-scope set of motion-enhanced elements
 * (never created inside a render function -- React's compiler/lint rules require component
 * identities to be stable across renders, not built on the fly via `motion.create()` per call).
 * Covers every current call site (a plain div, Next.js `Link`, or a plain `<a>`) -- add another
 * fixed entry here if a future call site needs a different root element, rather than making this
 * dynamic again. */
const MotionDiv = motion.div;
const MotionLink = motion.create(Link);
const MotionAnchor = motion.a;

/** Neither value ever changes after mount, so the subscription is a no-op — this only exists to
 * read an external (non-React-owned) value safely across server/client without an effect+setState
 * mount-detection dance (which the project's lint config flags as a cascading-render risk). */
function subscribeNever() {
  return () => {};
}

/** True once we know the document is RTL. False (LTR) during SSR/first paint — direction-aware
 * primitives below only affect a one-shot entrance transform, so a same-frame correction on
 * mount is imperceptible and avoids needing a locale prop threaded through every call site. */
export function useIsRtl(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => document.documentElement.dir === "rtl",
    () => false,
  );
}

/** True only on devices with real hover + a precise pointer (desktop mouse/trackpad) — gates
 * parallax and cursor-follow effects off on touch, matching the brief's "disable on touch" rule. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );
}

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobileViewport(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** Phase 10 "Mobile: reduce animation complexity" -- unlike `useFinePointer`/`useIsRtl` above,
 * viewport width genuinely changes during a session (resize, rotation), so this actually
 * subscribes to changes rather than reading once at mount. Matches Tailwind's `sm` breakpoint
 * (640px) so it lines up with every other mobile/desktop split in this codebase. Used to gently
 * scale down (never fully remove) scroll-reveal travel distance and Ken Burns zoom on small
 * screens -- a different axis from `prefers-reduced-motion`, which callers still respect separately. */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeMobileViewport,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/** Phase 10 "Image Zoom" reusable primitive -- the exact recipe already hand-rolled at several call
 * sites (`ProductCard`, Category/Brand Grid cards): a slow, premium-feeling scale-up on the
 * ancestor's hover, GPU-friendly (transform only), CSS-only (no JS). Callers still own their own
 * `.group`/`.group/name` ancestor and `overflow-hidden` clipping -- this is just the image's own
 * class recipe, centralized so the scale/duration/easing values live in exactly one place. */
export const IMAGE_ZOOM_CLASS = "transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105";

/**
 * Phase 10 "Hover" reusable reference -- this project has three independent, deliberately-scoped
 * card-lift implementations that predate this file (the standalone `.hover-lift` CSS utility,
 * `Card`'s own per-variant inline `hover:-translate-y-*`, and `ProductCard`'s `hoverEffect="lift"`
 * enum) -- each already tuned for its own context, not consolidated here to avoid an unrelated
 * mass-refactor. `HOVER_LIFT_CLASS` exists so any NEW call site has one canonical set of distances
 * to reach for instead of inventing a fourth magic number.
 */
export const HOVER_LIFT_CLASS = {
  sm: "transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5",
  md: "transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-1",
  lg: "transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-2",
} as const;

/** One-shot entrance animation, e.g. for a staggered hero sequence. Respects prefers-reduced-motion. */
export function FadeUp({
  children,
  delay = 0,
  y = 20,
  duration = DURATION.standard,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE_PREMIUM } },
};

/** Wraps a sequence of StaggerItem children in a coordinated entrance (e.g. hero eyebrow -> headline -> CTA). */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? "show" : "hidden"} animate="show" variants={staggerContainer}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

export type ScrollRevealVariant =
  | "none"
  | "fade-up"
  | "fade-down"
  | "fade-in"
  | "zoom-in"
  | "scale"
  | "slide-start"
  | "slide-end"
  | "fade-left"
  | "fade-right";

/** Phase 9 "Animation > Intensity" -- scales every variant's travel distance (px offset / scale
 * delta) around its existing hand-tuned default (1 = unchanged, exactly today's values). Kept as a
 * multiplier rather than per-variant absolute overrides so "Subtle"/"Strong" reads consistently
 * across all 10 variants without re-tuning each one individually. */
const INTENSITY_SCALE: Record<"subtle" | "normal" | "strong", number> = {
  subtle: 0.5,
  normal: 1,
  strong: 1.7,
};

/** Built per-render (not module-level) because slide-start/slide-end need to know text direction,
 * and Phase 9's `intensityScale` varies per section. */
function getScrollVariants(isRtl: boolean, intensityScale = 1): Record<Exclude<ScrollRevealVariant, "none">, Variants> {
  const startX = isRtl ? 32 * intensityScale : -32 * intensityScale;
  const y = 28 * intensityScale;
  const scaleUp = 1 + 0.08 * intensityScale;
  const scaleDown = 1 - 0.04 * intensityScale;
  const slideX = 32 * intensityScale;
  return {
    "fade-up": { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0 } },
    "fade-down": { hidden: { opacity: 0, y: -y }, show: { opacity: 1, y: 0 } },
    "fade-in": { hidden: { opacity: 0 }, show: { opacity: 1 } },
    "zoom-in": { hidden: { opacity: 0, scale: scaleDown }, show: { opacity: 1, scale: 1 } },
    // Distinct flavor from zoom-in: scales down into place rather than up, better suited to
    // hero/image moments where the element should feel like it's settling rather than growing.
    scale: { hidden: { opacity: 0, scale: scaleUp }, show: { opacity: 1, scale: 1 } },
    // Logical/RTL-mirrored: "start" is the reading-start edge (right in Arabic), so content always
    // enters from where the eye naturally begins reading. Use these for in-flow content elements.
    "slide-start": { hidden: { opacity: 0, x: startX }, show: { opacity: 1, x: 0 } },
    "slide-end": { hidden: { opacity: 0, x: -startX }, show: { opacity: 1, x: 0 } },
    // Physical/screen-relative -- deliberately NOT mirrored for RTL, unlike slide-start/slide-end
    // above. For Design System Phase 1's named motion tokens ("fade-left"/"fade-right"): a
    // composition where an element should always enter from the same physical screen edge
    // regardless of language (e.g. an image panning in from screen-right as a camera move, not a
    // reading-direction cue). Pick slide-start/slide-end instead for anything tied to reading order.
    "fade-left": { hidden: { opacity: 0, x: -slideX }, show: { opacity: 1, x: 0 } },
    "fade-right": { hidden: { opacity: 0, x: slideX }, show: { opacity: 1, x: 0 } },
  };
}

/** Phase 10 "Mobile: reduce animation complexity" -- multiplies whatever intensity was already
 * chosen (including an explicit per-section admin override, Phase 9) further down on small
 * viewports, rather than overriding it outright -- "Strong" stays visibly stronger than "Subtle" on
 * a phone, just gentler than its own desktop self. A different axis from `prefers-reduced-motion`,
 * which callers still check separately (and which wins outright, same as before this constant existed). */
const MOBILE_INTENSITY_FACTOR = 0.7;

interface ScrollRevealProps {
  variant: ScrollRevealVariant;
  children: React.ReactNode;
  className?: string;
  durationSec?: number;
  delaySec?: number;
  trigger?: "onScroll" | "onLoad";
  intensity?: "subtle" | "normal" | "strong";
  /** Phase 10: render as something other than a plain `div` -- e.g. `Link` (Next.js) or `"a"` -- so
   * a card that's itself a link can reveal-on-scroll in place, with zero extra wrapper element and
   * zero risk to CSS Grid item sizing/`col-span`/`row-span` (the wrapper WOULD be the grid's direct
   * child otherwise). Defaults to `"div"`, matching every pre-Phase-10 call site's exact behavior.
   * Extra props (e.g. `href`) pass straight through to the underlying element. */
  as?: ElementType;
  [extra: string]: unknown;
}

/** Viewport-triggered entrance, once. Used by the Page Builder's SectionShell for every public block.
 * Phase 9 additions (all optional, all defaulting to today's exact prior behavior): `durationSec`/
 * `delaySec` override the hardcoded `DURATION.large * speed` timing; `trigger: "onLoad"` animates
 * immediately on mount instead of waiting for the viewport (via `animate` instead of `whileInView`);
 * `intensity` scales the variant's travel distance (see INTENSITY_SCALE). Phase 10 added `as` (see
 * above) and automatic mobile-intensity scaling (MOBILE_INTENSITY_FACTOR). */
export function ScrollReveal({ variant, children, className, durationSec, delaySec = 0, trigger = "onScroll", intensity = "normal", as, ...rest }: ScrollRevealProps) {
  const reduce = useReducedMotion();
  const isRtl = useIsRtl();
  const isMobile = useIsMobileViewport();
  const { scrollRevealEnabled, speed } = useDesignAnimationSettings();
  // Resolved once, used by both the early-return AND the animated path below, so a `Link`'s `href`
  // (or any other passthrough prop) is never silently dropped just because motion is disabled --
  // that would otherwise turn a real navigation link into an inert `<div>`. A plain ternary over
  // fixed, module-scope constants (never a `motion.create()` call inside render, which React's
  // static-components lint rule correctly rejects -- a freshly created component type would reset
  // its internal state on every render).
  const Component = as === Link ? MotionLink : as === "a" ? MotionAnchor : MotionDiv;
  if (variant === "none" || reduce || !scrollRevealEnabled) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    );
  }
  const transition = { duration: durationSec ?? DURATION.large * speed, delay: delaySec, ease: EASE_PREMIUM };
  const intensityScale = INTENSITY_SCALE[intensity] * (isMobile ? MOBILE_INTENSITY_FACTOR : 1);
  const variants = getScrollVariants(isRtl, intensityScale)[variant];
  if (trigger === "onLoad") {
    return (
      <Component className={className} initial="hidden" animate="show" variants={variants} transition={transition} {...rest}>
        {children}
      </Component>
    );
  }
  return (
    <Component className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={variants} transition={transition} {...rest}>
      {children}
    </Component>
  );
}

/**
 * Continuous scroll-linked vertical drift, subtle by design (default ±36px total travel).
 * Disabled under prefers-reduced-motion and on touch/coarse-pointer devices (brief §33) — both
 * checks resolve after mount, so this renders a plain div through the first paint on every device.
 */
export function Parallax({
  children,
  offset = 36,
  className,
}: {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const finePointer = useFinePointer();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  if (reduce || !finePointer) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/**
 * Tracks normalized pointer position (-1..1 on each axis) within `ref`'s bounding box, for a
 * multi-layer depth-parallax composition (e.g. a hero scene where background/product/text drift
 * at different rates as the pointer moves). One shared listener on the container rather than one
 * per layer — each layer then calls `pointerParallaxStyle(x, y, depthPx)` with its own depth.
 * Disabled under prefers-reduced-motion and on touch/coarse-pointer devices (brief §17), both of
 * which resolve after mount, so `enabled` is always false through first paint.
 */
export function usePointerParallaxContainer<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = finePointer && !reduce;
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      setPos({ x, y });
    };
    const handleLeave = () => setPos({ x: 0, y: 0 });
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [enabled]);

  return { ref, x: pos.x, y: pos.y, enabled };
}

/**
 * Continuous, gentle scale-breathing background treatment ("Ken Burns") -- generalizes the same
 * technique Hero's own `HeroMediaMotion` ("cinematic-loop"/"slow-zoom" animation values, in
 * hero-shared.tsx) already uses privately for its media layer, as a standalone primitive any future
 * image/video block can reach for without depending on Hero's internals. Infinite by design (unlike
 * ScrollReveal's one-shot entrance) -- scales between 1 and 1+`zoomAmount`%, easing both ways,
 * forever, at `speedSec` per full cycle. No-ops (renders a plain div) under prefers-reduced-motion.
 * Phase 10 "Mobile: reduce animation complexity": `zoomAmount` is further scaled down on small
 * viewports (a continuous, infinitely-repeating transform is more visible/costly there) -- still
 * running, just a subtler breathe, same reasoning as `ScrollReveal`'s `MOBILE_INTENSITY_FACTOR`.
 */
export function KenBurns({
  children,
  zoomAmount = 6,
  speedSec = 22,
  className,
}: {
  children: React.ReactNode;
  /** Percent scale increase for one breath (e.g. 6 => 1.00 -> 1.06 -> 1.00). */
  zoomAmount?: number;
  /** Seconds for one full out-and-back cycle. */
  speedSec?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileViewport();
  if (reduce) return <div className={className}>{children}</div>;
  const effectiveZoom = isMobile ? zoomAmount * 0.6 : zoomAmount;
  return (
    <div className={className}>
      <motion.div
        className="h-full w-full"
        animate={{ scale: [1, 1 + effectiveZoom / 100, 1] }}
        transition={{ duration: speedSec, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** GPU-friendly (`transform` only) per-layer offset for `usePointerParallaxContainer`'s tracked position. `depthPx` is that layer's own max travel — keep every layer within the brief's 10-15px ceiling. */
export function pointerParallaxStyle(x: number, y: number, depthPx: number): React.CSSProperties {
  return { transform: `translate3d(${(x * depthPx).toFixed(2)}px, ${(y * depthPx).toFixed(2)}px, 0)` };
}

/**
 * Curtain-style clip-path wipe reveal for images — the mask retreats toward the writing
 * direction's end edge, so the image appears to unveil starting from the start edge. RTL-aware.
 */
export function ClipReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const isRtl = useIsRtl();
  const hiddenClip = isRtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: hiddenClip }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: DURATION.large, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word vertical mask reveal for large typographic moments. Vertical motion is direction-agnostic, so no RTL handling is needed — word order already follows the ancestor's `dir`. */
export function KineticText({
  text,
  className,
  wordClassName,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.6 });
  if (reduce) return <Tag className={className}>{text}</Tag>;
  const words = text.split(" ");
  return (
    <Tag ref={containerRef as React.Ref<never>} className={className}>
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
          <motion.span
            className={wordClassName}
            style={{ display: "inline-block" }}
            initial={{ y: "100%" }}
            animate={inView ? { y: "0%" } : undefined}
            transition={{ duration: DURATION.standard, delay: i * 0.04, ease: EASE_PREMIUM }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Counts up to `value` once it scrolls into view. Caller must only pass real, already-verified numeric data — never invented stats. */
export function CountUp({ value, duration = 1.2, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/** Draws an SVG path on scroll via stroke-dashoffset, tracking `target`'s position (an HTML container wrapping the SVG — an SVG-native ref isn't usable as a Framer Motion scroll target). */
export function DrawLine({
  d,
  target,
  className,
  strokeWidth = 2,
}: {
  d: string;
  target: RefObject<HTMLElement | null>;
  className?: string;
  strokeWidth?: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start 0.85", "end 0.35"] });
  if (reduce) {
    return <path ref={pathRef} d={d} fill="none" strokeWidth={strokeWidth} className={className} pathLength={1} />;
  }
  return <motion.path ref={pathRef} d={d} fill="none" strokeWidth={strokeWidth} className={className} style={{ pathLength: scrollYProgress }} />;
}

/** Tiny magnetic-hover offset for a button/card — desktop only, no-ops elsewhere. Spread `style` onto a `motion.*` element and `ref` onto its DOM node. */
export function useMagneticHover(strength = 10) {
  const ref = useRef<HTMLElement>(null);
  const finePointer = useFinePointer();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!finePointer) return;
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setOffset({
        x: ((e.clientX - rect.left - rect.width / 2) / rect.width) * strength,
        y: ((e.clientY - rect.top - rect.height / 2) / rect.height) * strength,
      });
    };
    const handleLeave = () => setOffset({ x: 0, y: 0 });
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [finePointer, strength]);

  return { ref, style: { x: offset.x, y: offset.y }, transition: { duration: DURATION.micro, ease: EASE_PREMIUM } };
}

/** Small floating label that follows the cursor within `containerRef` — e.g. "View"/"Explore" over a product or category card. Desktop-only, renders nothing on touch. Parent must be `position: relative`. */
export function CursorLabel({ containerRef, label }: { containerRef: RefObject<HTMLElement | null>; label: string }) {
  const finePointer = useFinePointer();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!finePointer) return;
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const handleLeave = () => setPos(null);
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [finePointer, containerRef]);

  if (!finePointer || !pos) return null;
  return (
    <div
      className="font-mono-data pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-paper"
      style={{ left: pos.x, top: pos.y }}
    >
      {label}
    </div>
  );
}
