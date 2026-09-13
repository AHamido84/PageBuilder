import { cn } from "@/lib/cn";

export type DividerCurve = "wave" | "arc" | "tilt";

const PATHS: Record<DividerCurve, string> = {
  // Two gentle crests -- the least "template" of the three, reads as organic rather than a generic wave.
  wave: "M0,40 C 240,90 480,0 720,40 C 960,80 1200,10 1440,45 L1440,100 L0,100 Z",
  // Single broad crest -- calmer, for seams that shouldn't draw much attention.
  arc: "M0,60 Q 720,-20 1440,60 L1440,100 L0,100 Z",
  // Asymmetric diagonal-into-curve -- for a seam that wants an editorial, non-centered feel.
  tilt: "M0,20 C 480,20 640,90 1440,70 L1440,100 L0,100 Z",
};

/**
 * Phase 3 premium redesign: an organic curve transition between two stacked sections, in place of a
 * hard rectangular seam. `fill` is the color of the section BELOW the curve (the shape reads as that
 * section's top edge rising up over the one above it) -- pass a `text-*` class, e.g. `text-paper`.
 * Purely decorative (aria-hidden); used sparingly at 2-3 high-impact seams per the design brief, not
 * on every section boundary.
 */
export function SectionDivider({ curve = "wave", flip = false, className }: { curve?: DividerCurve; flip?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none w-full overflow-hidden leading-[0]", flip && "rotate-180", className)}>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="h-[clamp(2.5rem,6vw,6rem)] w-full">
        <path d={PATHS[curve]} fill="currentColor" />
      </svg>
    </div>
  );
}
