import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StyledText } from "../../components/text/styled-text";
import { liftRich, parseWithRich, restoreRich, stripRich } from "./block-rich";
import { z } from "zod";
import { hasStyling, normalizeDoc, plainToDoc, richTextSchema, richToPlain, safeRich, setRich, type RichText } from "./rich-text";

/** «مذاق يليق بضيافتك» with «يليق» in gold, bold. */
const gold: RichText = {
  v: 1,
  content: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "مذاق " }, { type: "text", text: "يليق", marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "gold", fontSize: null } }] }, { type: "text", text: " بضيافتك" }] }],
  },
};

test("valid rich text passes; plain text is recovered exactly", () => {
  assert.ok(richTextSchema.safeParse(gold).success);
  assert.equal(richToPlain(gold), "مذاق يليق بضيافتك");
  assert.equal(richToPlain({ v: 1, content: plainToDoc("سطر ١\nسطر ٢", true) }), "سطر ١\nسطر ٢");
});

test("rejects unknown marks, attributes, nodes and bad values", () => {
  const bad = (patch: unknown) => richTextSchema.safeParse(patch).success;
  const withMark = (mark: unknown) => ({ v: 1, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [mark] }] }] } });
  assert.equal(bad(withMark({ type: "link", attrs: { href: "javascript:alert(1)" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { color: "red" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { color: "#fff" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { fontSize: "200px" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { fontSize: "9px" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { color: "#AF7D27", style: "x" } })), false);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { color: "#AF7D27", fontSize: "24px" } })), true);
  assert.equal(bad(withMark({ type: "textStyle", attrs: { fontSize: "h2" } })), true);
  assert.equal(bad({ v: 1, content: { type: "doc", content: [{ type: "heading", content: [] }] } }), false);
  assert.equal(bad({ v: 1, style: { size: { px: 200 } }, content: plainToDoc("x", false) }), false);
  assert.equal(bad({ v: 1, style: { size: "huge" }, content: plainToDoc("x", false) }), false);
  assert.equal(bad({ v: 1, style: { color: "gold", sizeMobile: { px: 14 }, bold: true }, content: plainToDoc("x", false) }), true);
  assert.equal(bad({ v: 2, content: plainToDoc("x", false) }), false);
});

test("hasStyling: plain docs and empty textStyle marks are not styling", () => {
  assert.equal(hasStyling({ v: 1, content: plainToDoc("x", false) }), false);
  assert.equal(hasStyling({ v: 1, style: {}, content: plainToDoc("x", false) }), false);
  assert.equal(hasStyling(gold), true);
  assert.equal(hasStyling({ v: 1, style: { italic: true }, content: plainToDoc("x", false) }), true);
  assert.equal(safeRich({ v: 1, content: plainToDoc("x", false) }), undefined);
});

test("normalizeDoc keeps only allowed nodes/marks and enforces single line", () => {
  const editorJson = {
    type: "doc",
    content: [
      { type: "paragraph", attrs: { textAlign: "left" }, content: [{ type: "text", text: "a", marks: [{ type: "strike" }, { type: "italic" }] }, { type: "hardBreak" }, { type: "text", text: "b", marks: [{ type: "textStyle", attrs: { color: "javascript:x", fontSize: "18px" } }] }] },
      { type: "heading", content: [{ type: "text", text: "c" }] },
    ],
  };
  const multi = normalizeDoc(editorJson, true);
  assert.ok(richTextSchema.safeParse({ v: 1, content: multi }).success);
  assert.deepEqual(multi.content[0].content, [
    { type: "text", text: "a", marks: [{ type: "italic" }] },
    { type: "hardBreak" },
    { type: "text", text: "b", marks: [{ type: "textStyle", attrs: { color: null, fontSize: "18px" } }] },
  ]);
  const single = normalizeDoc(editorJson, false);
  assert.equal(single.content.length, 1);
  assert.equal(richToPlain({ v: 1, content: single }), "a b c");
});

test("setRich adds/removes keys and drops empty maps", () => {
  const map = setRich(undefined, "heading", gold);
  assert.deepEqual(Object.keys(map!), ["heading"]);
  assert.equal(setRich(map, "heading", undefined), undefined);
  assert.equal(setRich(undefined, "x", { v: 1, content: plainToDoc("x", false) }), undefined);
});

test("page builder: __rich survives schema validation at every level, invalid maps are dropped", () => {
  const schema = z.object({ heading: z.string(), items: z.array(z.object({ name: z.string() })) });
  const data = {
    heading: "مذاق يليق بضيافتك",
    __rich: { heading: gold, missing: gold },
    items: [{ name: "a", __rich: { name: gold } }, { name: "b", __rich: { name: { v: 1, content: { type: "doc", content: [{ type: "script" }] } } } }],
  };
  const parsed = parseWithRich(schema, data);
  assert.ok(parsed.success);
  const out = parsed.data as Record<string, unknown> & { items: Record<string, unknown>[] };
  assert.deepEqual(Object.keys(out.__rich as object), ["heading"]); // "missing" isn't a string field
  assert.ok((out.items[0].__rich as Record<string, unknown>).name);
  assert.equal("__rich" in out.items[1], false);
  assert.deepEqual(stripRich(data), { heading: data.heading, items: [{ name: "a" }, { name: "b" }] });
  const { lifted } = liftRich(data);
  assert.equal(lifted.length, 3);
  assert.equal(restoreRich({ heading: 1 }, lifted).heading, 1);
});

test("renderer: plain stays byte-identical; styled renders spans, never HTML from data", () => {
  assert.equal(renderToStaticMarkup(createElement(StyledText, { text: "نص <b>عادي</b>" })), "نص &lt;b&gt;عادي&lt;/b&gt;");
  const html = renderToStaticMarkup(createElement(StyledText, { text: "x", rich: gold }));
  assert.equal(html, '<span>مذاق <span style="color:var(--g7-gold-600)"><strong class="font-bold">يليق</strong></span> بضيافتك</span>');
  const field = renderToStaticMarkup(createElement(StyledText, { text: "x", rich: { v: 1, style: { color: "#123456", size: "h2", sizeMobile: { px: 18 }, italic: true }, content: plainToDoc("سطر\nثاني", true) } }));
  assert.match(field, /class="ts-h2 ts-m-px"/);
  assert.match(field, /--ts-m-px:18px/);
  assert.match(field, /color:#123456/);
  assert.match(field, /font-style:italic/);
  assert.equal((field.match(/class="block min-h-\[1em\]"/g) ?? []).length, 2);
});
