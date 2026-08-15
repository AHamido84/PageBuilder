"use client";

import { useRef } from "react";
import { DrawLine } from "@/lib/motion/primitives";

interface RouteLineProps {
  /** SVG path `d`, authored against `viewBox`'s coordinate space. */
  d: string;
  viewBox?: string;
  className?: string;
  strokeWidth?: number;
}

/**
 * An abstract route/journey line — the site's recurring "logistics" graphic motif (sourcing,
 * transport, distribution). Draws progressively via stroke-dashoffset as its container scrolls
 * into view. Purely decorative (aria-hidden) — never load-bearing for content. If the path is
 * directional (e.g. left-to-right), wrap in a parent with the existing `.flip-rtl` utility so it
 * mirrors correctly under `dir="rtl"`.
 */
export function RouteLine({ d, viewBox = "0 0 100 100", className, strokeWidth = 1.5 }: RouteLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      <svg viewBox={viewBox} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <DrawLine d={d} target={containerRef} strokeWidth={strokeWidth} className="stroke-current" />
      </svg>
    </div>
  );
}

/** A checkpoint marker meant to sit inside the same SVG coordinate space as a RouteLine's path. */
export function RouteMarker({ cx, cy, active = false, className }: { cx: number; cy: number; active?: boolean; className?: string }) {
  return <circle cx={cx} cy={cy} r={active ? 4 : 2.5} className={className ?? (active ? "fill-wheat" : "fill-current opacity-40")} />;
}
