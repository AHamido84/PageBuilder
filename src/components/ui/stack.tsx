import { cn } from "@/lib/cn";

export type SpaceToken = "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/** Seven Eleven Premium Design System (Phase 1) layout primitive -- a flex row/column with a
 * spacing-token gap. Gap is applied via inline style referencing the `--space-*` custom properties
 * in globals.css directly (`var(--space-md)`), not a Tailwind `gap-*` utility -- this sidesteps
 * Tailwind v4's JIT literal-class-scanning requirement entirely (see style-tokens.ts's own warning
 * about that) without needing a second lookup table duplicating the one already in globals.css.
 * Not wired into any existing page/component yet -- foundation only, per this phase's scope. */
export function Stack({
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap = false,
  className,
  style,
  ...props
}: {
  direction?: "row" | "column";
  gap?: SpaceToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const alignClass = align ? { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" }[align] : undefined;
  const justifyClass = justify ? { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" }[justify] : undefined;

  return (
    <div
      className={cn("flex", direction === "row" ? "flex-row" : "flex-col", wrap && "flex-wrap", alignClass, justifyClass, className)}
      style={{ gap: `var(--space-${gap})`, ...style }}
      {...props}
    />
  );
}
