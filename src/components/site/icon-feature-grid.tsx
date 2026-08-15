"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Stagger, StaggerItem } from "@/lib/motion/primitives";

export interface IconFeatureItem {
  /** A rendered icon element (e.g. <CheckCircle2 />), not a component reference — component
   * references are functions and can't cross the Server->Client boundary as prop values. */
  icon: ReactNode;
  title: string;
  body: string;
}

export function IconFeatureGrid({
  items,
  columns = 4,
  className,
}: {
  items: IconFeatureItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <Stagger className={cn("grid grid-cols-1 gap-8 sm:gap-10", colsClass, className)}>
      {items.map((item) => (
        // "group" + cursor-default: a desktop hover-active state (brief's Why-Us "feature becomes
        // active" ask). Deliberately avoids any new fixed text/icon color -- a caller-set fixed
        // icon hue previously failed WCAG AA against paper/frost (see ICON_PROPS comments in
        // callers), and this grid renders on ink/paper/frost tones alike, so a fixed accent that's
        // safe on one tone could easily fail on another. The underline uses `bg-current`, which by
        // definition always matches whatever text color is already correct for the section.
        <StaggerItem key={item.title} className="group cursor-default">
          {/* Icon color is set by the caller via `text-current` inheritance (see ICON_PROPS in each
              caller) so it stays legible against whichever section tone this grid is used on. */}
          <div className="inline-block transition-transform duration-300 ease-[var(--ease-premium)] group-hover:-translate-y-1 group-hover:scale-110">
            {item.icon}
          </div>
          <p className="relative mt-4 inline-block font-display text-lg after:absolute after:-bottom-1 after:start-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 group-hover:after:w-8">
            {item.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed opacity-65 transition-opacity duration-300 group-hover:opacity-85">{item.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
