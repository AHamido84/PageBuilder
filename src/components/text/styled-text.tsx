import type { CSSProperties, ReactNode } from "react";
import { colorCss, type RichMark, type RichText, type SizeValue } from "@/lib/text-style/rich-text";
import { textAlignClasses } from "@/lib/align";

/**
 * Renders an admin-editable text: the plain string exactly as before, or -- when the field has a
 * RichText value -- its styled version as React elements (never HTML). Works in server and client
 * components (no hooks). Paragraphs of a long text become block spans, so it is valid inside the
 * <p>/<h1>/<span> the caller already renders.
 *
 * Callers pass `rich` only when text styling is enabled (the loaders / SectionRenderer drop it
 * otherwise), so "no rich" always means "exactly today's output".
 */
export function StyledText({ text, rich }: { text: string | null | undefined; rich?: RichText | null }): ReactNode {
  if (!rich) return text ?? null;
  const paragraphs = rich.content.content;
  const multi = paragraphs.length > 1;
  const body = paragraphs.map((p, i) => {
    const inline = (p.content ?? []).map((node, j) => (node.type === "hardBreak" ? <br key={j} /> : <Marked key={j} text={node.text} marks={node.marks ?? []} />));
    return multi ? (
      <span key={i} className="block min-h-[1em]">
        {inline}
      </span>
    ) : (
      <span key={i}>{inline}</span>
    );
  });

  const { style, className } = fieldStyle(rich);
  if (!style && !className) return <>{body}</>;
  return (
    <span data-styled-text className={className} style={style}>
      {body}
    </span>
  );
}

function sizeClass(size: SizeValue | undefined, mobile: boolean): { cls?: string; vars?: Record<string, string> } {
  if (!size) return {};
  if (typeof size === "string") return { cls: mobile ? `ts-m-${size}` : `ts-${size}` };
  return mobile ? { cls: "ts-m-px", vars: { "--ts-m-px": `${size.px}px` } } : { cls: "ts-px", vars: { "--ts-px": `${size.px}px` } };
}

function fieldStyle(rich: RichText): { style?: CSSProperties; className?: string } {
  const s = rich.style;
  if (!s) return {};
  const desktop = sizeClass(s.size, false);
  const mobile = sizeClass(s.sizeMobile, true);
  const style: Record<string, string> = { ...desktop.vars, ...mobile.vars };
  if (s.color) style.color = colorCss(s.color);
  if (s.bold) style.fontWeight = "700";
  if (s.italic) style.fontStyle = "italic";
  // Alignment needs a block box (the span sits inside the caller's <p>/<h2>, which keeps its own spacing).
  const align = textAlignClasses(s.align, s.alignMobile);
  const className = [desktop.cls, mobile.cls, align ? `block ${align}` : undefined].filter(Boolean).join(" ") || undefined;
  return { style: Object.keys(style).length ? (style as CSSProperties) : undefined, className };
}

function Marked({ text, marks }: { text: string; marks: RichMark[] }): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks) {
    if (mark.type === "bold") node = <strong className="font-bold">{node}</strong>;
    else if (mark.type === "italic") node = <em>{node}</em>;
    else {
      const { color, fontSize } = mark.attrs;
      if (!color && !fontSize) continue;
      const isToken = fontSize && !fontSize.endsWith("px");
      node = (
        <span className={isToken ? `ts-${fontSize}` : undefined} style={{ ...(color ? { color: colorCss(color) } : {}), ...(fontSize && !isToken ? { fontSize } : {}) }}>
          {node}
        </span>
      );
    }
  }
  return node;
}
