"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASE_PREMIUM } from "./motionTokens";

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

export type ScrollRevealVariant = "none" | "fade-up" | "fade-in" | "zoom-in";

const SCROLL_VARIANTS: Record<Exclude<ScrollRevealVariant, "none">, Variants> = {
  "fade-up": { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } },
  "fade-in": { hidden: { opacity: 0 }, show: { opacity: 1 } },
  "zoom-in": { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1 } },
};

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
  if (variant === "none" || reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={SCROLL_VARIANTS[variant]}
      transition={{ duration: DURATION.large, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}
