"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { BlockRenderProps } from "../../types";
import type { AccordionLikeData } from "./accordion";

export function TabsRender({ data, interactive }: BlockRenderProps<AccordionLikeData>) {
  const [active, setActive] = useState(0);
  const items = data.items ?? [];
  if (items.length === 0) return null;
  return (
    <div>
      {data.heading ? <h2 className="mb-6 font-display text-3xl">{data.heading}</h2> : null}
      <div className="flex flex-wrap gap-2 border-b border-current/10">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            data-pb-interactive="true"
            onClick={() => interactive && setActive(i)}
            className={cn("border-b-2 px-4 py-2.5 text-sm font-medium transition-colors", active === i ? "border-current opacity-100" : "border-transparent opacity-50 hover:opacity-80")}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="py-6 text-sm opacity-80">{items[active]?.body}</div>
    </div>
  );
}
