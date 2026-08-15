"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { ScrollReveal, DrawLine } from "@/lib/motion/primitives";
import { TemperatureIndicator } from "./graphics/temperature-indicator";

export interface JourneyStep {
  date?: string;
  title: string;
  body: string;
}

/**
 * The site's signature scroll-driven story — used for the homepage's "sourcing to loading dock"
 * TIMELINE section and the /distribution-logistics page. A route line draws itself as the
 * container scrolls into view (natural scroll, no scroll-jacking — see brief §40), and each
 * checkpoint fades/rises into place as it's reached. Vertical on mobile, horizontal on desktop.
 */
export function ColdChainJourney({ heading, steps, className }: { heading?: string; steps: JourneyStep[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="texture-grain pointer-events-none absolute inset-0" aria-hidden="true" />
      {heading ? <h2 className="relative mb-12 font-display text-3xl">{heading}</h2> : null}

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
              {step.date ? <p className="font-mono-data text-xs uppercase tracking-wide opacity-50">{step.date}</p> : null}
              <p className="mt-1 font-display text-lg">{step.title}</p>
              <p className="mt-1 text-sm opacity-70">{step.body}</p>
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
              {step.date ? <p className="font-mono-data text-xs uppercase tracking-wide opacity-50">{step.date}</p> : null}
              <p className="mt-1 font-display text-lg">{step.title}</p>
              <p className="mt-1 text-sm opacity-70">{step.body}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
