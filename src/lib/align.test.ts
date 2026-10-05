import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveResponsiveAlign, resolveTextAlign, textAlignClasses, TEXT_ALIGNS } from "./align";
import { resolveSectionClasses } from "./page-builder/style-tokens";
import { defaultSectionSettings } from "./page-builder/types";
import { g7PhysicalX } from "./page-builder/blocks/golden/shared";
import { StyledText } from "../components/text/styled-text";
import { textStyleSchema } from "./text-style/rich-text";

test("auto follows the language; right/left are physical (AR and EN)", () => {
  assert.equal(resolveTextAlign(undefined, "rtl"), "right");
  assert.equal(resolveTextAlign(undefined, "ltr"), "left");
  assert.equal(resolveTextAlign("auto", "rtl"), "right");
  assert.equal(resolveTextAlign("auto", "ltr"), "left");
  for (const dir of ["rtl", "ltr"] as const) {
    assert.equal(resolveTextAlign("right", dir), "right");
    assert.equal(resolveTextAlign("left", dir), "left");
    assert.equal(resolveTextAlign("center", dir), "center");
    assert.equal(resolveTextAlign("justify", dir), "justify");
  }
});

test("mobile falls back to desktop and can differ from it", () => {
  assert.deepEqual(resolveResponsiveAlign("center", undefined, "rtl"), { desktop: "center", mobile: "center" });
  assert.deepEqual(resolveResponsiveAlign(undefined, "center", "ltr"), { desktop: "left", mobile: "center" });
  assert.deepEqual(resolveResponsiveAlign("left", "auto", "rtl"), { desktop: "left", mobile: "right" });
});

test("field classes: logical by default, mobile-first with a desktop override", () => {
  assert.equal(textAlignClasses(undefined, undefined), undefined);
  assert.equal(textAlignClasses("auto"), "text-start");
  assert.equal(textAlignClasses("right"), "text-right");
  assert.equal(textAlignClasses("center", "right"), "text-right md:text-center");
  assert.equal(textAlignClasses(undefined, "center"), "text-center md:text-start");
});

test("styled text renders alignment as a block box; values are validated", () => {
  const rich = { v: 1 as const, style: { align: "center" as const, alignMobile: "right" as const }, content: { type: "doc" as const, content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: "تواصل معنا" }] }] } };
  const html = renderToStaticMarkup(createElement(StyledText, { text: "تواصل معنا", rich }));
  assert.match(html, /class="block text-right md:text-center"/);
  assert.ok(textStyleSchema.safeParse({ align: "justify" }).success);
  assert.equal(textStyleSchema.safeParse({ align: "start" }).success, false);
  assert.deepEqual([...TEXT_ALIGNS], ["auto", "right", "center", "left", "justify"]);
});

test("section tokens: saved 'left'/'right' stay logical; new physical values use rtl/ltr variants", () => {
  const cls = (align: string) => {
    const s = defaultSectionSettings();
    return resolveSectionClasses({ ...s, desktop: { ...s.desktop, align: align as typeof s.desktop.align } });
  };
  assert.match(cls("left"), /(^| )text-start /);
  assert.match(cls("right"), /(^| )text-end /);
  assert.match(cls("phys-right"), /(^| )text-right .*rtl:items-start/);
  assert.match(cls("phys-left"), /(^| )text-left .*rtl:items-end/);
  assert.match(cls("justify"), /(^| )text-justify /);
  // Boxed blocks (contact card) follow the alignment via the inline margin variables.
  assert.match(cls("left"), /\[--pb-box-s:0\] \[--pb-box-e:auto\]/);
  assert.match(cls("center"), /\[--pb-box-s:auto\] \[--pb-box-e:auto\]/);
});

test("G7 photo text start/end mirror per language", () => {
  assert.equal(g7PhysicalX("start", "ar"), "right");
  assert.equal(g7PhysicalX("start", "en"), "left");
  assert.equal(g7PhysicalX("end", "ar"), "left");
  assert.equal(g7PhysicalX("left", "ar"), "left");
});
