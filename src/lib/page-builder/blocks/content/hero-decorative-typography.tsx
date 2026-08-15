"use client";

import type { HeroDecorativePosition } from "../content-blocks";

const POSITION_CLASSES: Record<HeroDecorativePosition, string> = {
  behind: "inset-0 flex items-center justify-center",
  beside: "inset-y-0 -end-[10%] flex items-center justify-start",
  "overlap-start": "inset-y-0 -start-[8%] flex items-center justify-start",
  "overlap-end": "inset-y-0 -end-[8%] flex items-center justify-end",
};

/**
 * The oversized, very-low-opacity brand typography layer (brief §29-30) -- purely decorative depth,
 * never real content, so it's `aria-hidden` and never the only carrier of information. Renders
 * nothing when `text` is empty (an admin/preset must deliberately set it -- never invented copy).
 */
export function HeroDecorativeTypography({
  text,
  opacity,
  position,
  rotation,
  className,
}: {
  text: string;
  opacity: number;
  position: HeroDecorativePosition;
  rotation: number;
  className?: string;
}) {
  if (!text) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute z-0 overflow-hidden ${POSITION_CLASSES[position]} ${className ?? ""}`}>
      <span
        className="font-display whitespace-nowrap text-[18vw] leading-none text-current lg:text-[12vw]"
        style={{ opacity: opacity / 100, transform: `rotate(${rotation}deg)` }}
      >
        {text}
      </span>
    </div>
  );
}
