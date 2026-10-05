import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { StyledText } from "@/components/text/styled-text";
import { richOf } from "@/lib/text-style/rich-text";
import { resolveHref } from "../../href";

export interface GridPromo {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  position?: number;
}

/** The promo / quote card slotted into a product grid (Product Grid block, Products Catalog block). */
export function GridPromoCard({ promo, locale }: { promo: GridPromo; locale: string }) {
  return (
    <div className="flex flex-col justify-between gap-6 rounded-[var(--card-radius-lg)] bg-petrol p-6 text-paper sm:p-8" data-grid-promo>
      <div>
        {promo.eyebrow ? <p className="manifest-strip mb-3 text-wheat"><StyledText text={promo.eyebrow} rich={richOf(promo, "eyebrow")} /></p> : null}
        {promo.title ? <p className="font-display text-h3 leading-tight"><StyledText text={promo.title} rich={richOf(promo, "title")} /></p> : null}
        {promo.body ? <p className="mt-3 text-sm leading-relaxed text-paper/75"><StyledText text={promo.body} rich={richOf(promo, "body")} /></p> : null}
      </div>
      {promo.ctaLabel && promo.ctaUrl ? (
        <Link href={resolveHref(promo.ctaUrl, locale)} className={buttonClasses("gold", "md", "self-start whitespace-nowrap")}>
          <StyledText text={promo.ctaLabel} rich={richOf(promo, "ctaLabel")} />
        </Link>
      ) : null}
    </div>
  );
}

/** Inserts the promo card at its 1-based position (clamped to the grid). */
export function withPromo(items: React.ReactNode[], promo: GridPromo | undefined, locale: string): React.ReactNode[] {
  if (!promo?.enabled || !(promo.title || promo.body)) return items;
  const slot = Math.min(Math.max((promo.position ?? 4) - 1, 0), items.length);
  const next = [...items];
  next.splice(slot, 0, <GridPromoCard key="promo" promo={promo} locale={locale} />);
  return next;
}
