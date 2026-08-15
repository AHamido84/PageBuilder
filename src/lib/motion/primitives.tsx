"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { DURATION, EASE_PREMIUM } from "./motionTokens";

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

export type ScrollRevealVariant = "none" | "fade-up" | "fade-down" | "fade-in" | "zoom-in" | "scale" | "slide-start" | "slide-end";

/** Built per-render (not module-level) because slide-start/slide-end need to know text direction. */
function getScrollVariants(isRtl: boolean): Record<Exclude<ScrollRevealVariant, "none">, Variants> {
  const startX = isRtl ? 32 : -32;
  return {
    "fade-up": { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } },
    "fade-down": { hidden: { opacity: 0, y: -28 }, show: { opacity: 1, y: 0 } },
    "fade-in": { hidden: { opacity: 0 }, show: { opacity: 1 } },
    "zoom-in": { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1 } },
    // Distinct flavor from zoom-in: scales down into place rather than up, better suited to
    // hero/image moments where the element should feel like it's settling rather than growing.
    scale: { hidden: { opacity: 0, scale: 1.08 }, show: { opacity: 1, scale: 1 } },
    "slide-start": { hidden: { opacity: 0, x: startX }, show: { opacity: 1, x: 0 } },
    "slide-end": { hidden: { opacity: 0, x: -startX }, show: { opacity: 1, x: 0 } },
  };
}

/** Viewport-triggered entrance, once. Used by the Page Builder's SectionShell for every public block. */
export function ScrollReveal({
  variant,
  children,
  className,
}: {
  variant: ScrollRevealVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const isRtl = useIsRtl();
  if (variant === "none" || reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={getScrollVariants(isRtl)[variant]}
      transition={{ duration: DURATION.large, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
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
  if (reduce) return <Tag className={className}>{text}</Tag>;
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
          <motion.span
            className={wordClassName}
            style={{ display: "inline-block" }}
            initial={{ y: "100%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, amount: 0.6 }}
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
