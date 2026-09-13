import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost-light" | "ghost-dark" | "gold" | "gold-outline" | "ghost-gold";
export type ButtonSize = "sm" | "md" | "lg";

// Phase 8 "Global Visual Control Center": radius/shadow now read the dedicated --button-radius/
// --button-shadow indirection variables (globals.css) instead of the shared --radius-sm/--shadow-
// flat tokens directly -- both default to those exact same values, so this is a zero-visual-change
// hookup until an admin's Buttons override redefines them (see resolve-css.ts). Every variant's own
// color is untouched here -- that's already covered by the Global Colors Primary/Secondary/Gold
// overrides re-pointing --color-coral/--color-petrol/--color-wheat directly.
const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--button-radius)] font-medium tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-premium)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:shadow-[var(--shadow-focus)]";

// Primary = Coral, Secondary = Petrol Green (spec's explicit CTA color assignment) -- kept as two
// distinct solid fills, never diluting Coral into a general-purpose accent used elsewhere. "gold"/
// "gold-outline" reuse the existing --color-wheat token (already the site's one gold accent, used
// for badges/focus rings/stat numbers) rather than inventing a second gold -- a solid fill and an
// outline-that-fills-on-hover, for a Hero CTA that wants to stand out from Primary/Secondary.
// "ghost-gold" is the Seven Eleven Premium Design System brief's own name for that exact same
// outline-that-fills-on-hover recipe -- added as an additional alias variant (reusing
// "gold-outline"'s class string verbatim, one definition, no drift) rather than renaming
// "gold-outline", since that value is already a persisted, selectable option in the Hero block's
// CTA style schema (heroButtonStyleSchema) -- renaming it would be a breaking change to already-
// editable content for zero benefit. Both names are intentionally kept, permanently.
const GOLD_OUTLINE_CLASSES = "border border-wheat text-wheat hover:bg-wheat hover:text-ink";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-coral text-paper shadow-[var(--button-shadow)] hover:bg-coral-strong hover:shadow-[var(--shadow-card)]",
  secondary: "bg-petrol text-paper shadow-[var(--button-shadow)] hover:bg-ink hover:shadow-[var(--shadow-card)]",
  "ghost-light": "border border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink",
  "ghost-dark": "text-ink hover:text-harbor",
  gold: "bg-wheat text-ink shadow-[var(--button-shadow)] hover:bg-wheat-strong hover:shadow-[var(--shadow-card)]",
  "gold-outline": GOLD_OUTLINE_CLASSES,
  "ghost-gold": GOLD_OUTLINE_CLASSES,
};

// Horizontal padding is wrapped in calc(<literal> * var(--button-padding-scale,1)) -- same
// JIT-safe literal-string pattern as style-tokens.ts's padding tables. Height/text size stay fixed
// (scaling those too would fight the padding scale and risk clipping label text), matching
// "Buttons > Padding" specifically rather than a full re-scale of every size dimension.
const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-[calc(1rem*var(--button-padding-scale,1))] text-sm",
  md: "h-11 px-[calc(1.5rem*var(--button-padding-scale,1))] text-sm",
  lg: "h-14 px-[calc(2rem*var(--button-padding-scale,1))] text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional trailing icon slot -- wrapped in `.btn-icon` so the global Buttons > Icon toggle
   * (Phase 8) can hide it site-wide via a plain CSS rule, without touching every ad-hoc CTA that
   * renders its own <Arrow/> alongside buttonClasses() directly (those remain section-level
   * content, unaffected -- see resolve-css.ts's showIcon handling). */
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", className, icon, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
      {icon ? <span className="btn-icon inline-flex">{icon}</span> : null}
    </button>
  );
}
