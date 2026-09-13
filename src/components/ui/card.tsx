import { cn } from "@/lib/cn";

export type CardVariant = "default" | "product" | "category" | "brand" | "solution" | "article" | "testimonial";

// Seven Eleven Premium Design System (Phase 1): reusable card recipes for the six content types the
// brief names. "default" is the exact, unchanged class string this component already had -- every
// existing caller (e.g. ProductCard, which passes no variant) keeps its current appearance pixel for
// pixel. The rest are new, additive options nothing renders with yet (this phase creates the
// foundation only; wiring an actual CategoryCard/BrandCard/etc. over to one of these is later,
// deliberate redesign work, not implied by adding the recipe). Each recipe is a layout-and-motion
// judgment call, not an invented color: all reuse the same border/shadow/radius tokens already
// established (radius-md, shadow-flat/card/lifted, border-ink/10) rather than one-off values.
const variants: Record<CardVariant, string> = {
  // Phase 8 "Global Visual Control Center": the *default* variant's radius reads the dedicated
  // --card-radius indirection (defaults to --radius-md, so zero visual change until an admin's
  // Layout override redefines it) -- the other variants below keep their own literal per-variant
  // radii (session N's deliberate visual differentiation: solution gets -xl, brand stays -md,
  // product/category/article get -lg), left untouched per "do not destroy existing settings."
  default: "rounded-[var(--card-radius)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
  // Product/Category/Brand grids: clickable tiles, same lift as default but a touch more radius for
  // a premium feel and a slightly stronger resting shadow (they usually sit directly on a paper/frost
  // section background, so a flat shadow alone can under-separate from it).
  product: "rounded-[var(--radius-lg)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
  category: "rounded-[var(--radius-lg)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
  // Brand tiles are typically small, centered-logo squares (see BRAND_GRID's own render) -- no lift,
  // just a hover border strengthen, so a grid of six doesn't feel like it's all bouncing at once.
  brand: "rounded-[var(--radius-md)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-colors duration-300 ease-[var(--ease-premium)] hover:border-ink/25",
  // Solutions: editorial, larger card (icon + heading + short body), warmer resting shadow (card, not
  // flat) since these usually appear in small counts (3-7) rather than a dense grid.
  solution: "rounded-[var(--radius-xl)] border border-ink/10 bg-paper shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]",
  // Article (blog): image-forward, same lift language as product/category.
  article: "rounded-[var(--radius-lg)] border border-ink/10 bg-paper shadow-[var(--shadow-flat)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
  // Testimonials are never links/clickable, so no hover-lift (a lift affordance on something you
  // can't click reads as a mistake) -- flatter by design, matching the current TESTIMONIALS block's
  // own "quote card" treatment (border, no shadow) rather than the grid-tile look above.
  testimonial: "rounded-[var(--radius-md)] border border-ink/10 bg-paper",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
