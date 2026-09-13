"use client";

import { HeroFrameShape } from "@/lib/page-builder/blocks/content/hero-frame-shape";
import type { FrameStyle, FrameBorderStyle, FrameGlow } from "@/lib/page-builder/blocks/content/frame-shapes";
import type { HeroFrameBorderColor } from "@/lib/page-builder/blocks/content-blocks";

export type { FrameStyle, FrameBorderStyle, FrameGlow };

/**
 * Phase 3 premium redesign: a friendlier, non-Hero-specific entry point onto Hero's own organic
 * frame/mask system (`HeroFrameShape` + `frame-shapes.ts`) -- the site's one blob/oval/arch/wave
 * clip-path system, reused here rather than re-implemented, so Categories/Testimonials/Solutions
 * imagery shares the exact same organic-curve visual language the Hero block already established.
 * Caller must still position this absolutely (`className` needs a `position` value) -- see
 * HeroFrameShape's own note on why that can't be defaulted here.
 */
export function OrganicFrame({
  frameStyle = "organic-blob",
  borderStyle = "none",
  borderWidthPx = 2,
  borderOpacity = 60,
  borderColor = "wheat",
  glow = "none",
  animation,
  className,
  children,
}: {
  frameStyle?: FrameStyle;
  borderStyle?: FrameBorderStyle;
  borderWidthPx?: number;
  borderOpacity?: number;
  borderColor?: HeroFrameBorderColor;
  glow?: FrameGlow;
  animation?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <HeroFrameShape
      frameStyle={frameStyle}
      borderStyle={borderStyle}
      borderWidthPx={borderWidthPx}
      borderOpacity={borderOpacity}
      borderColor={borderColor}
      glow={glow}
      animation={animation}
      className={className}
    >
      {children}
    </HeroFrameShape>
  );
}
