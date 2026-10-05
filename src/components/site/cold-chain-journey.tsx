"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { ScrollReveal, DrawLine } from "@/lib/motion/primitives";
import { TemperatureIndicator } from "./graphics/temperature-indicator";
import { CmsFillImage } from "@/components/media/cms-image";
import { OrganicFrame } from "@/components/ui/organic-frame";
import { StyledText } from "@/components/text/styled-text";
import { richOf, type RichText } from "@/lib/text-style/rich-text";

export interface JourneyStep {
  date?: string;
  title: string;
  body: string;
  /** Phase 3 premium redesign: optional real photography for a step, shown instead of the plain
   * TemperatureIndicator icon. Additive -- a step with no image keeps the original icon-only look. */
  image?: { id: string; url: string } | null;
}

/** Optional real photography for a step, rendered in the text flow below the connecting-line icon
 * (which stays exactly as-is regardless) -- additive, so a step with no image is unaffected. */
function StepImage({ step }: { step: JourneyStep }) {
  if (!step.image?.url) return null;
  return (
    <div className="relative mb-4 aspect-[4/3] w-full max-w-[220px]">
      <OrganicFrame frameStyle="curved-rectangle" className="absolute inset-0">
        <CmsFillImage src={step.image.url} alt="" sizes="220px" className="object-cover" context={{ mediaId: step.image.id, component: "TIMELINE" }} />
      </OrganicFrame>
    </div>
  );
}

/**
 * The site's signature scroll-driven story — used for the homepage's "sourcing to loading dock"
 * TIMELINE section and the /distribution-logistics page. A route line draws itself as the
 * container scrolls into view (natural scroll, no scroll-jacking — see brief §40), and each
 * checkpoint fades/rises into place as it's reached. Vertical on mobile, horizontal on desktop.
 */
export function ColdChainJourney({ heading, headingRich, steps, className }: { heading?: string; headingRich?: RichText; steps: JourneyStep[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="texture-grain pointer-events-none absolute inset-0" aria-hidden="true" />
      {heading ? <h2 className="relative mb-12 font-display text-3xl"><StyledText text={heading} rich={headingRich} /></h2> : null}

      {/* Mobile / tablet: vertical journey */}
      <div className="relative lg:hidden">
        <svg viewBox={`0 0 24 ${steps.length * 100}`} preserveAspectRatio="none" className="absolute inset-y-0 start-3 h-full w-6 overflow-visible" aria-hidden="true">
          <DrawLine
            d={`M12 4 L12 ${steps.length * 100 - 4}`}
            target={containerRef}
            strokeWidth={1.5}
            className="stroke-current opacity-25"
          />
        </svg>
        <div className="relative space-y-10 ps-12">
          {steps.map((step, i) => (
            <ScrollReveal key={i} variant="fade-up" className="relative">
              <TemperatureIndicator className="absolute -start-12 top-0 h-8 text-wheat" />
              <StepImage step={step} />
              {step.date ? <p className="font-mono-data text-xs uppercase tracking-wide opacity-50"><StyledText text={step.date} rich={richOf(step, "date")} /></p> : null}
              <p className="mt-1 font-display text-lg"><StyledText text={step.title} rich={richOf(step, "title")} /></p>
              <p className="mt-1 text-sm opacity-70"><StyledText text={step.body} rich={richOf(step, "body")} /></p>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Desktop: horizontal journey */}
      <div className="relative hidden lg:block">
        {/* flip-rtl: the grid's items already reflow right-to-left under dir="rtl" (CSS Grid
            auto-placement follows writing mode), but this SVG path is drawn in a fixed
            left-to-right coordinate space, so it needs an explicit mirror to match. */}
        <svg viewBox={`0 0 ${steps.length * 100} 24`} preserveAspectRatio="none" className="absolute inset-x-0 top-3 h-6 w-full overflow-visible flip-rtl" aria-hidden="true">
          <DrawLine
            d={`M4 12 L${steps.length * 100 - 4} 12`}
            target={containerRef}
            strokeWidth={1.5}
            className="stroke-current opacity-25"
          />
        </svg>
        <div className="relative grid gap-8" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step, i) => (
            <ScrollReveal key={i} variant="fade-up" className="relative pt-14">
              <TemperatureIndicator className="absolute start-0 top-0 h-10 text-wheat" />
              <StepImage step={step} />
              {step.date ? <p className="font-mono-data text-xs uppercase tracking-wide opacity-50"><StyledText text={step.date} rich={richOf(step, "date")} /></p> : null}
              <p className="mt-1 font-display text-lg"><StyledText text={step.title} rich={richOf(step, "title")} /></p>
              <p className="mt-1 text-sm opacity-70"><StyledText text={step.body} rich={richOf(step, "body")} /></p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
