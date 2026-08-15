"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FRAME_SHAPE_CSS, FRAME_MORPH_TARGET, type FrameStyle, type FrameBorderStyle, type FrameGlow } from "./frame-shapes";
import type { HeroFrameBorderColor } from "../content-blocks";

const BORDER_COLOR_VAR: Record<HeroFrameBorderColor, string> = {
  ink: "var(--color-ink)",
  harbor: "var(--color-harbor)",
  wheat: "var(--color-wheat)",
  paper: "var(--color-paper)",
};

const GLOW_COLOR_VAR: Record<Exclude<FrameGlow, "none">, string> = {
  navy: "var(--color-ink)",
  teal: "var(--color-harbor)",
  gold: "var(--color-wheat)",
};

const BORDER_WIDTH_BY_STYLE: Record<FrameBorderStyle, number> = { none: 0, thin: 1, medium: 1, accent: 1.5, gradient: 1.5 };

/**
 * The premium frame/mask itself -- not a rectangular card. `clip-path`/`border-radius` on the same
 * box as a plain CSS `border` doesn't compose for non-rectangular shapes (the border still draws
 * along the box's rectangular edge, then gets unevenly clipped). Instead this layers same-shaped
 * divs: a blurred glow behind, a blurred shadow behind that, a border-color shape at full size, and
 * the actual content shape inset by the border width -- works identically whether the shape is
 * `border-radius`-based (rounded-rectangle, blob, arch, capsule, ...) or `clip-path`-based (oval,
 * diagonal-cut, wave), and gives a real gradient "border" option for free (impossible with a plain
 * CSS `border`).
 */
export function HeroFrameShape({
  frameStyle,
  borderStyle,
  borderWidthPx,
  borderOpacity,
  borderColor,
  glow,
  animation,
  className,
  children,
}: {
  frameStyle: FrameStyle;
  borderStyle: FrameBorderStyle;
  borderWidthPx: number;
  borderOpacity: number;
  borderColor: HeroFrameBorderColor;
  glow: FrameGlow;
  /** Only "morph" is read here (the other HeroAnimation values are entrance/idle treatments applied by the caller to the whole frame, not the shape itself). */
  animation?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const shape = FRAME_SHAPE_CSS[frameStyle];
  const morphTarget = FRAME_MORPH_TARGET[frameStyle];
  const shouldMorph = animation === "morph" && !!morphTarget && !!shape.borderRadius && !reduce;
  const hasBorder = borderStyle !== "none";
  // React doesn't treat `inset` as one of its auto-`px` unitless properties, so a bare number here
  // renders as invalid CSS (`inset: 3;`, silently ignored -- confirmed live: the content box
  // collapsed to near-zero height, since an ignored `inset` leaves this absolutely-positioned div
  // unstretched, and the `fill` Image inside sizes to *that* undefined box). Always spell the unit.
  const insetPx = hasBorder ? `${BORDER_WIDTH_BY_STYLE[borderStyle] * borderWidthPx}px` : "0px";

  const borderBackground =
    borderStyle === "gradient"
      ? "linear-gradient(135deg, var(--color-ink) 0%, var(--color-harbor) 50%, var(--color-wheat) 100%)"
      : BORDER_COLOR_VAR[borderColor];

  return (
    // No inline `position` here on purpose: every layer inside is `position: absolute` and needs
    // *this* box to be their containing block, but an inline style would win the cascade over
    // whatever position utility the caller passes via `className` (confirmed live: an inline
    // `position: "relative"` silently overrode the caller's `absolute inset-0`, so this box never
    // stretched to fill its parent -- collapsed to near-zero, since a block whose only children are
    // all absolutely-positioned contributes ~nothing to its own intrinsic size). The caller's
    // `className` must always include a `position` value (every call site passes `absolute inset-0`).
    <div className={className}>
      {glow !== "none" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[12%]"
          style={{ ...shape, background: GLOW_COLOR_VAR[glow], opacity: 0.22, filter: "blur(48px)" }}
        />
      ) : null}
      {/* Ambient + contact shadow, following the same shape as the frame itself. Skipped for
          "full-bleed" -- that style has no edge for a contact shadow to read against, it fills
          the whole composition. */}
      {frameStyle !== "full-bleed" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-[6%]"
          style={{ ...shape, background: "var(--color-ink)", opacity: 0.28, filter: "blur(28px)" }}
        />
      ) : null}
      {hasBorder ? (
        <div aria-hidden="true" className="absolute inset-0" style={{ ...shape, background: borderBackground, opacity: borderOpacity / 100 }} />
      ) : null}
      {shouldMorph ? (
        <motion.div
          className="absolute overflow-hidden"
          style={{ inset: insetPx, clipPath: shape.clipPath }}
          // Non-null: `shouldMorph` already confirmed both are defined for this frameStyle.
          animate={{ borderRadius: [shape.borderRadius as string, morphTarget as string, shape.borderRadius as string] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      ) : (
        <div className="absolute overflow-hidden" style={{ inset: insetPx, ...shape }}>
          {children}
        </div>
      )}
    </div>
  );
}
