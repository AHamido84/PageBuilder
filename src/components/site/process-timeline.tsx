"use client";

import { cn } from "@/lib/cn";
import { Stagger, StaggerItem } from "@/lib/motion/primitives";

export interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

/** A real sequence, not decoration — only use where order genuinely carries meaning (a process, a flow). */
export function ProcessTimeline({ steps, className }: { steps: ProcessStep[]; className?: string }) {
  return (
    <Stagger className={cn("space-y-10 border-s-2 border-current/15 ps-6", className)}>
      {steps.map((step) => (
        <StaggerItem key={step.number} className="relative">
          <span className="absolute -start-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-current" />
          <p className="font-mono-data text-xs opacity-45">{step.number}</p>
          <p className="font-display mt-2 text-h3">{step.title}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-70 sm:text-base">{step.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
