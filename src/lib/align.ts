/**
 * Text alignment shared by page-builder sections and styled text fields.
 *
 *  - "auto" (the default, also what a MISSING value means) = `text-align: start`: right in Arabic,
 *    left in English -- the browser resolves it from `dir`, so no locale check is needed.
 *  - "right" / "left" are PHYSICAL: the same side in both languages.
 *  - "justify" is for long text.
 * Pure + client-safe; class strings are literal so Tailwind sees them.
 */

export const TEXT_ALIGNS = ["auto", "right", "center", "left", "justify"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

export const TEXT_ALIGN_LABELS: Record<TextAlign, string> = {
  auto: "تلقائي (حسب اللغة)",
  right: "يمين",
  center: "وسط",
  left: "شمال",
  justify: "ضبط",
};

export type Dir = "rtl" | "ltr";
export type PhysicalAlign = "right" | "left" | "center" | "justify";

/** The physical result of an alignment value in a given direction ("auto" follows the language). */
export function resolveTextAlign(align: TextAlign | null | undefined, dir: Dir): PhysicalAlign {
  if (!align || align === "auto") return dir === "rtl" ? "right" : "left";
  return align;
}

/** Desktop + optional mobile value for one direction -- what a visitor sees at each width. */
export function resolveResponsiveAlign(desktop: TextAlign | null | undefined, mobile: TextAlign | null | undefined, dir: Dir): { desktop: PhysicalAlign; mobile: PhysicalAlign } {
  return { desktop: resolveTextAlign(desktop, dir), mobile: resolveTextAlign(mobile ?? desktop, dir) };
}

const BASE: Record<TextAlign, string> = { auto: "text-start", right: "text-right", center: "text-center", left: "text-left", justify: "text-justify" };
const MD: Record<TextAlign, string> = { auto: "md:text-start", right: "md:text-right", center: "md:text-center", left: "md:text-left", justify: "md:text-justify" };

/** Classes for a field's alignment: the mobile value below 768px (when set), the desktop value above. */
export function textAlignClasses(desktop: TextAlign | null | undefined, mobile?: TextAlign | null): string | undefined {
  if (!desktop && !mobile) return undefined;
  const d = desktop ?? "auto";
  if (!mobile || mobile === d) return BASE[d];
  return `${BASE[mobile]} ${MD[d]}`;
}
