import { resolveColumnsClasses } from "../../style-tokens";
import { ScrollReveal } from "@/lib/motion/primitives";
import type { BlockRenderProps } from "../../types";
import type { FeatureCardsData } from "../social-proof-blocks";

/** Phase 3 premium redesign: airier bordered cards with a large decorative index number (01/02/...)
 * standing in for an icon this block's schema doesn't have. Column count stays settings-driven
 * (`supportsColumns: true`, admin Style panel) -- only the card treatment itself changed. */
export function FeatureCardsRender({ data, settings }: BlockRenderProps<FeatureCardsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-10 font-display text-h2">{data.heading}</h2> : null}
      <div className={`grid gap-6 lg:gap-8 ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => (
          <ScrollReveal key={i} variant="fade-up" className="rounded-[var(--card-radius-lg)] border border-current/10 p-8" data-ui-card="">
            <p className="font-mono-data text-wheat-strong opacity-60">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-4 font-display text-h4">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed opacity-65">{item.body}</p>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
