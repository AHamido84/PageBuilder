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
        <StaggerItem key={item.title}>
          {/* Icon color is set by the caller via `text-current` inheritance (see ICON_PROPS in each
              caller) so it stays legible against whichever section tone this grid is used on. */}
          {item.icon}
          <p className="font-display mt-4 text-lg">{item.title}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-65">{item.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
