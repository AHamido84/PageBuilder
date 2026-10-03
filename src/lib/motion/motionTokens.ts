/** Shared timing vocabulary for every Framer Motion usage in the app — mirrors --ease-premium in globals.css. */
export const DURATION = {
  micro: 0.2,
  standard: 0.4,
  large: 0.8,
} as const;

export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/** PHASE 9 section easing choices -> Framer Motion transition fields (and the matching CSS curve,
 * used by the CSS-driven element-level animations). "premium" is the existing default. */
export const EASING = {
  premium: { framer: { ease: EASE_PREMIUM }, css: "cubic-bezier(0.22, 1, 0.36, 1)" },
  smooth: { framer: { ease: [0.4, 0, 0.2, 1] as const }, css: "cubic-bezier(0.4, 0, 0.2, 1)" },
  out: { framer: { ease: "easeOut" as const }, css: "ease-out" },
  "in-out": { framer: { ease: "easeInOut" as const }, css: "ease-in-out" },
  linear: { framer: { ease: "linear" as const }, css: "linear" },
  // A gentle, non-bouncy spring; CSS has no spring, so element animations use a close curve.
  spring: { framer: { type: "spring" as const, stiffness: 140, damping: 22, mass: 0.9 }, css: "cubic-bezier(0.34, 1.2, 0.64, 1)" },
} as const;
export type EasingKey = keyof typeof EASING;
