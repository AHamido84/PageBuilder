import { cn } from "@/lib/cn";

/**
 * Phase 10 reusable "Marquee" primitive -- continuous horizontal auto-scroll, extracted verbatim
 * from the Page Builder's Marquee block (`src/lib/page-builder/blocks/misc/marquee-render.tsx`,
 * which now imports this instead of hand-rolling the same two divs). Pure CSS (`@keyframes
 * marquee-scroll`, globals.css) -- no JS animation loop, so it's cheap and automatically frozen by
 * the global `prefers-reduced-motion` kill-switch (globals.css zeroes all animation/transition
 * durations under that media query). Direction reverses under RTL (`html[dir="rtl"] .animate-marquee`,
 * globals.css) so the scroll still reads as moving "forward." Pauses on hover so a user can actually
 * read/click an item.
 *
 * Not a "use client" component -- it has no hooks/interactivity, so it can be rendered directly from
 * a Server Component (as `MarqueeRender` does) without forcing an unnecessary client boundary.
 *
 * The caller owns content shape and duplication (e.g. `[...items, ...items]`) since that varies by
 * use case (logos, text, cards) -- this component only owns the scroll mechanism itself.
 */
export function Marquee({
  children,
  className,
  trackClassName,
  speedSec = 28,
}: {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  /** Seconds for one full loop -- lower is faster. Matches the pre-Phase-10 hardcoded 28s by default. */
  speedSec?: number;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className={cn("animate-marquee flex w-max items-center", trackClassName)} style={{ "--marquee-duration": `${speedSec}s` } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}
