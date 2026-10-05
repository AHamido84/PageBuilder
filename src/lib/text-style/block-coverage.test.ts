import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_BLOCK_TYPES, getBlock } from "../page-builder/registry";
import { parseWithRich } from "./block-rich";
import type { RichText } from "./rich-text";

/**
 * Text styling P2: every page-builder block keeps `__rich` maps through validation -- at the top
 * level and inside list items / nested objects -- so a styled field is never silently dropped on save.
 */

const styled = (text: string): RichText => ({ v: 1, style: { color: "gold", bold: true }, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] } });

/** Adds `__rich` for the first string key of every object in `value` (deep); returns the paths touched. */
function addRich(value: unknown, path: string[] = [], touched: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v, i) => addRich(v, [...path, String(i)], touched));
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const key = Object.keys(obj).find((k) => typeof obj[k] === "string");
    if (key) {
      if (obj[key] === "") obj[key] = "x";
      obj.__rich = { [key]: styled(obj[key] as string) };
      touched.push([...path, key].join("."));
    }
    for (const [k, v] of Object.entries(obj)) if (k !== "__rich") addRich(v, [...path, k], touched);
  }
  return touched;
}

function richAt(value: unknown, dotted: string): unknown {
  const parts = dotted.split(".");
  const key = parts.pop()!;
  let target: unknown = value;
  for (const p of parts) target = (target as Record<string, unknown>)?.[p];
  return (target as { __rich?: Record<string, unknown> })?.__rich?.[key];
}

test("every block keeps __rich maps (top level and nested) through parseWithRich", () => {
  const checked: string[] = [];
  for (const type of ALL_BLOCK_TYPES) {
    const block = getBlock(type)!;
    const data = structuredClone(block.defaultData) as Record<string, unknown>;
    // A few blocks' defaults leave required strings empty (the editor fills them) -- fill those in.
    const plain = block.dataSchema.safeParse(data);
    if (!plain.success) for (const issue of (plain.error as { issues: { path: (string | number)[] }[] }).issues) if (issue.path.length === 1) data[issue.path[0]] = "x";
    const touched = addRich(data);
    const parsed = parseWithRich(block.dataSchema, data);
    assert.ok(parsed.success, `${type}: default data with __rich should validate`);
    for (const path of touched) {
      // Keys the schema strips (unknown to it) correctly lose their styling with them.
      if (typeof path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], parsed.data) !== "string") continue;
      assert.ok(richAt(parsed.data, path), `${type}: lost __rich at ${path}`);
      checked.push(`${type}:${path}`);
    }
  }
  assert.ok(checked.length > 0);
});

test("a styled field inside a list item / nested object survives", () => {
  const cases: [string, Record<string, unknown>, string][] = [
    ["TESTIMONIALS", { heading: "", items: [{ quote: "Great", authorName: "A", __rich: { quote: styled("Great") } }] }, "items.0.quote"],
    ["STATISTICS", { heading: "", items: [{ value: "Great", label: "L", icon: "none", __rich: { value: styled("Great") } }] }, "items.0.value"],
    ["TIMELINE", { heading: "", layout: "list", items: [{ date: "", title: "Great", body: "", image: null, __rich: { title: styled("Great") } }] }, "items.0.title"],
    ["FAQ", { heading: "", items: [{ title: "Great", body: "", __rich: { title: styled("Great") } }] }, "items.0.title"],
    ["TWO_COLUMNS", { items: [{ heading: "Great", body: "", image: null, linkUrl: "", linkLabel: "", __rich: { heading: styled("Great") } }] }, "items.0.heading"],
    ["QUOTE_FORM", { aside: { image: null, eyebrow: "E", heading: "H", body: "", __rich: { heading: styled("H") } } }, "aside.heading"],
    ["PRODUCT_GRID", { promo: { enabled: true, eyebrow: "", title: "Promo", body: "", ctaLabel: "", ctaUrl: "", position: 4, __rich: { title: styled("Promo") } } }, "promo.title"],
  ];
  for (const [type, patch, path] of cases) {
    const block = getBlock(type)!;
    const data = { ...structuredClone(block.defaultData), ...patch };
    const parsed = parseWithRich(block.dataSchema, data);
    assert.ok(parsed.success, `${type} should validate`);
    const text = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], data) as string;
    assert.deepEqual(richAt(parsed.data, path), styled(text), `${type}: ${path}`);
  }
});

test("block renders show the styled text, and are unchanged without __rich", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  for (const type of ["STATISTICS", "TIMELINE", "FAQ"]) {
    const block = getBlock(type)!;
    const item = type === "STATISTICS" ? { value: "120+", label: "Partners", icon: "none" } : { date: "", title: "Cold chain", body: "Body", image: null };
    const plainData = { ...structuredClone(block.defaultData), heading: "Title", layout: "list", items: [item] };
    const styledData = { ...plainData, __rich: { heading: styled("Title") } };
    const render = (data: unknown) => renderToStaticMarkup(createElement(block.Render, { data, settings: block.defaultSettings, locale: "ar", interactive: false } as never));
    const plainHtml = render(plainData);
    assert.ok(!plainHtml.includes("data-styled-text"), `${type}: no styling without __rich`);
    assert.match(render(styledData), /data-styled-text[^>]*style="[^"]*var\(--g7-gold-600\)[^"]*font-weight:700/, `${type}: styled heading`);
  }
});
