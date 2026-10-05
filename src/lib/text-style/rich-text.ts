import { z } from "zod";

/**
 * Admin text styling (feat/text-styling). Pure + client-safe.
 *
 * A styled field keeps its plain string exactly where it always was (DB column / page-builder data
 * key), so titles, SEO, search, name matching and emails never see markup. The styling lives NEXT to
 * it as a `RichText` value:
 *   - DB models:     `<Model>.rich = { <field>: RichText }`  (nullable Json column)
 *   - page builder:  `<any object>.__rich = { <key>: RichText }` inside dataEn / dataAr
 * No rich value = the field renders exactly as before. Only structured JSON is stored -- never HTML.
 */

export const SIZE_TOKENS = ["xs", "sm", "base", "lg", "xl", "h3", "h2", "h1", "display"] as const;
export type SizeToken = (typeof SIZE_TOKENS)[number];

/** Each token is a fluid size from the site's type scale (globals.css `.ts-*`). */
export const SIZE_LABELS: Record<SizeToken, string> = {
  xs: "صغير جدًا",
  sm: "صغير",
  base: "عادي",
  lg: "كبير",
  xl: "أكبر",
  h3: "عنوان ٣",
  h2: "عنوان ٢",
  h1: "عنوان ١",
  display: "عرض كبير",
};

/** Brand palette -- stored as the token key; rendered from the design tokens. */
export const COLOR_TOKENS = {
  teal: { hex: "#0F414C", css: "var(--g7-teal-900)", label: "تركوازي" },
  "teal-dark": { hex: "#123F49", css: "var(--g7-teal-800)", label: "تركوازي داكن" },
  gold: { hex: "#AF7D27", css: "var(--g7-gold-600)", label: "ذهبي" },
  "gold-light": { hex: "#B5852C", css: "var(--g7-gold-500)", label: "ذهبي فاتح" },
  cream: { hex: "#F7F0E6", css: "var(--g7-cream-50)", label: "كريمي" },
  white: { hex: "#FFFFFF", css: "#ffffff", label: "أبيض" },
} as const;
export type ColorToken = keyof typeof COLOR_TOKENS;

export const PX_MIN = 10;
export const PX_MAX = 96;

const HEX = /^#[0-9a-fA-F]{6}$/;

export const colorSchema = z.string().refine((v) => HEX.test(v) || v in COLOR_TOKENS, "لون غير صالح");
export const sizeSchema = z.union([z.enum(SIZE_TOKENS), z.object({ px: z.number().int().min(PX_MIN).max(PX_MAX) }).strict()]);

export const textStyleSchema = z
  .object({
    color: colorSchema.optional(),
    size: sizeSchema.optional(),
    sizeMobile: sizeSchema.optional(),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
  })
  .strict();
export type TextStyle = z.infer<typeof textStyleSchema>;
export type SizeValue = z.infer<typeof sizeSchema>;

/** Inline font size as TipTap stores it: a token key or "NNpx" (bounded). */
const inlineSizeSchema = z.string().refine((v) => (SIZE_TOKENS as readonly string[]).includes(v) || isBoundedPx(v), "حجم غير صالح");
function isBoundedPx(v: string): boolean {
  const m = /^(\d{1,3})px$/.exec(v);
  return Boolean(m) && Number(m![1]) >= PX_MIN && Number(m![1]) <= PX_MAX;
}

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z
    .object({
      type: z.literal("textStyle"),
      attrs: z
        .object({
          color: colorSchema.nullable().optional(),
          fontSize: inlineSizeSchema.nullable().optional(),
        })
        .strict(),
    })
    .strict(),
]);
export type RichMark = z.infer<typeof markSchema>;

const textNodeSchema = z.object({ type: z.literal("text"), text: z.string().min(1).max(5000), marks: z.array(markSchema).max(4).optional() }).strict();
const hardBreakSchema = z.object({ type: z.literal("hardBreak") }).strict();
const paragraphSchema = z
  .object({ type: z.literal("paragraph"), content: z.array(z.union([textNodeSchema, hardBreakSchema])).max(500).optional() })
  .strict();
const docSchema = z.object({ type: z.literal("doc"), content: z.array(paragraphSchema).min(1).max(100) }).strict();
export type RichDoc = z.infer<typeof docSchema>;

export const richTextSchema = z.object({ v: z.literal(1), style: textStyleSchema.optional(), content: docSchema }).strict();
export type RichText = z.infer<typeof richTextSchema>;

/** `{ field: RichText }` -- the sibling map stored next to plain fields. */
export const richMapSchema = z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/), richTextSchema);
export type RichMap = z.infer<typeof richMapSchema>;

/* ------------------------------------------------------------------------------------------------ */

/** Plain text of a rich value (paragraphs and hard breaks -> "\n"), for the plain column. */
export function richToPlain(rich: RichText): string {
  return rich.content.content
    .map((p) => (p.content ?? []).map((n) => (n.type === "text" ? n.text : "\n")).join(""))
    .join("\n");
}

/** A doc holding `text` as-is (lines -> paragraphs), used to start editing an old plain value. */
export function plainToDoc(text: string, multiline: boolean): RichDoc {
  const lines = multiline ? text.split(/\r?\n/) : [text.replace(/\r?\n/g, " ")];
  return { type: "doc", content: lines.map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" })) };
}

/**
 * Editor JSON -> exactly the allowed shape: doc > paragraph > text|hardBreak, marks bold / italic /
 * textStyle{color,fontSize}; everything else (unknown nodes, marks, attrs) is dropped. Single-line
 * fields collapse to one paragraph without breaks.
 */
export function normalizeDoc(json: unknown, multiline: boolean): RichDoc {
  const paragraphs: RichDoc["content"] = [];
  const blocks = (json as { content?: unknown[] })?.content ?? [];
  for (const block of blocks) {
    const inline: NonNullable<RichDoc["content"][number]["content"]> = [];
    for (const node of ((block as { content?: unknown[] })?.content ?? []) as Record<string, unknown>[]) {
      if (node.type === "hardBreak") {
        if (multiline) inline.push({ type: "hardBreak" });
        else inline.push({ type: "text", text: " " });
      } else if (node.type === "text" && typeof node.text === "string" && node.text) {
        const marks: RichMark[] = [];
        for (const m of (node.marks ?? []) as Record<string, unknown>[]) {
          if (m.type === "bold" || m.type === "italic") marks.push({ type: m.type });
          else if (m.type === "textStyle") {
            const attrs = (m.attrs ?? {}) as Record<string, unknown>;
            const color = typeof attrs.color === "string" && colorSchema.safeParse(attrs.color).success ? attrs.color : null;
            const fontSize = typeof attrs.fontSize === "string" && inlineSizeSchema.safeParse(attrs.fontSize).success ? attrs.fontSize : null;
            if (color || fontSize) marks.push({ type: "textStyle", attrs: { color, fontSize } });
          }
        }
        inline.push(marks.length ? { type: "text", text: node.text, marks } : { type: "text", text: node.text });
      }
    }
    paragraphs.push(inline.length ? { type: "paragraph", content: inline } : { type: "paragraph" });
  }
  if (!multiline && paragraphs.length > 1) {
    const merged = paragraphs.flatMap((p, i) => [...(i ? [{ type: "text" as const, text: " " }] : []), ...(p.content ?? [])]);
    return { type: "doc", content: [merged.length ? { type: "paragraph", content: merged } : { type: "paragraph" }] };
  }
  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
}

/** True when the value carries any styling at all (otherwise the field should stay a plain string). */
export function hasStyling(rich: RichText | null | undefined): rich is RichText {
  if (!rich) return false;
  const s = rich.style;
  if (s && (s.color || s.size || s.sizeMobile || s.bold || s.italic)) return true;
  return rich.content.content.some((p) =>
    (p.content ?? []).some((n) => n.type === "text" && (n.marks ?? []).some((m) => m.type !== "textStyle" || Boolean(m.attrs.color || m.attrs.fontSize)))
  );
}

/** Validates an unknown value as RichText; anything invalid is dropped (renders as plain). */
export function safeRich(value: unknown): RichText | undefined {
  const parsed = richTextSchema.safeParse(value);
  return parsed.success && hasStyling(parsed.data) ? parsed.data : undefined;
}

/** Validates a sibling map, keeping only valid, styled entries. */
export function safeRichMap(value: unknown): RichMap | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: RichMap = {};
  for (const [key, rich] of Object.entries(value)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) continue;
    const ok = safeRich(rich);
    if (ok) out[key] = ok;
  }
  return Object.keys(out).length ? out : undefined;
}

/** `obj.__rich[key]` (page-builder data) -- undefined when absent. */
export function richOf(obj: unknown, key: string): RichText | undefined {
  const map = obj && typeof obj === "object" ? (obj as { __rich?: Record<string, RichText> }).__rich : undefined;
  return map?.[key];
}

/** One validated entry of a stored `rich` map (DB Json column) -- undefined when absent/invalid. */
export function richMapOf(map: unknown, key: string): RichText | undefined {
  if (!map || typeof map !== "object" || Array.isArray(map)) return undefined;
  return safeRich((map as Record<string, unknown>)[key]);
}

/**
 * Server side of a form with styled fields: reads `<formName>__rich` for each field, validates it,
 * and merges it into the row's stored map (`{ field: RichText }`). A field submitted without styling
 * removes its entry. Returns the map to store (or null when empty).
 */
export function mergeRichFromForm(existing: unknown, formData: FormData, fields: Record<string, string>): RichMap | null {
  let map: RichMap | undefined = safeRichMap(existing);
  for (const [formName, field] of Object.entries(fields)) {
    if (!formData.has(`${formName}__rich`)) continue; // field not on this form -- keep what's stored
    const raw = String(formData.get(`${formName}__rich`) ?? "");
    let parsed: unknown = undefined;
    try {
      parsed = raw ? JSON.parse(raw) : undefined;
    } catch {
      parsed = undefined;
    }
    map = setRich(map, field, safeRich(parsed));
  }
  return map ?? null;
}

/** Sets/clears one key of a sibling map; returns undefined when the map ends up empty. */
export function setRich(map: RichMap | null | undefined, key: string, rich: RichText | undefined): RichMap | undefined {
  const next: RichMap = { ...(map ?? {}) };
  if (rich && hasStyling(rich)) next[key] = rich;
  else delete next[key];
  return Object.keys(next).length ? next : undefined;
}

export const colorCss = (color: string): string => (color in COLOR_TOKENS ? COLOR_TOKENS[color as ColorToken].css : color);
export const colorHex = (color: string): string => (color in COLOR_TOKENS ? COLOR_TOKENS[color as ColorToken].hex : color);
