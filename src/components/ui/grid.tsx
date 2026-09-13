import { cn } from "@/lib/cn";
import type { SpaceToken } from "./stack";

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6;

// Literal per-value class tables, not string concatenation -- Tailwind v4's JIT scanner needs the
// exact class substring physically present in source (same rule style-tokens.ts documents and
// relies on for the Page Builder's own responsive settings; kept consistent with that convention
// here rather than inventing a different approach for this new primitive).
const COLS_BASE: Record<GridCols, string> = { 1: "grid-cols-1", 2: "grid-cols-1", 3: "grid-cols-1", 4: "grid-cols-2", 5: "grid-cols-2", 6: "grid-cols-2" };
const COLS_SM: Record<GridCols, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2", 4: "sm:grid-cols-2", 5: "sm:grid-cols-3", 6: "sm:grid-cols-3" };
const COLS_LG: Record<GridCols, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/** Seven Eleven Premium Design System (Phase 1) layout primitive -- a responsive CSS grid with a
 * spacing-token gap (same `var(--space-*)` inline-style approach as Stack, for the same JIT-safety
 * reason). `cols` is the desktop (lg+) column count; mobile/tablet step down automatically via the
 * tables above unless overridden. Not wired into any existing page/component yet. */
export function Grid({
  cols = 3,
  gap = "md",
  className,
  style,
  ...props
}: {
  cols?: GridCols;
  gap?: SpaceToken;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid", COLS_BASE[cols], COLS_SM[cols], COLS_LG[cols], className)}
      style={{ gap: `var(--space-${gap})`, ...style }}
      {...props}
    />
  );
}
