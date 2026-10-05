import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comboKey,
  findOrphans,
  generateCombinations,
  mergeGeneratedCombinations,
  pluralizeAr,
  OPTION_NOUNS,
  resolveVariantFromParams,
  selectValue,
  slugifyKey,
  valueStates,
  variantQuery,
  variantSummaryLine,
  type ProductVariantsView,
  type VariantView,
} from "./core";

const v = (id: string, options: Record<string, string>, available = true): VariantView => ({
  id,
  sku: null,
  name: id,
  label: "",
  options,
  images: [],
  shortDescription: null,
  description: null,
  weight: null,
  packaging: null,
  storage: null,
  specs: [],
  available,
});

/** لحم بقري مجمد: cut × weight, with ribeye/5kg missing and steak/5kg unavailable. */
const meat: ProductVariantsView = {
  type: "VARIANT",
  options: [
    { key: "cut", label: "القطعية", display: "PILL", values: [
      { key: "ribeye", label: "ريب آي", swatchHex: null, imageUrl: null },
      { key: "steak", label: "ستيك", swatchHex: null, imageUrl: null },
      { key: "cubes", label: "مكعبات", swatchHex: null, imageUrl: null },
    ] },
    { key: "weight", label: "الوزن", display: "PILL", values: [
      { key: "1kg", label: "١ كجم", swatchHex: null, imageUrl: null },
      { key: "5kg", label: "٥ كجم", swatchHex: null, imageUrl: null },
    ] },
  ],
  variants: [
    v("ribeye-1", { cut: "ribeye", weight: "1kg" }),
    v("steak-1", { cut: "steak", weight: "1kg" }),
    v("steak-5", { cut: "steak", weight: "5kg" }, false),
    v("cubes-1", { cut: "cubes", weight: "1kg" }),
    v("cubes-5", { cut: "cubes", weight: "5kg" }),
  ],
  defaultVariantId: "steak-1",
};

test("pluralizeAr: واحد / مثنى / جمع (3–10) / مفرد (11+)", () => {
  const size = OPTION_NOUNS.size.ar;
  assert.equal(pluralizeAr(1, size), "مقاس واحد");
  assert.equal(pluralizeAr(2, size), "مقاسان");
  assert.equal(pluralizeAr(3, size), "٣ مقاسات");
  assert.equal(pluralizeAr(10, size), "١٠ مقاسات");
  assert.equal(pluralizeAr(11, size), "١١ مقاسًا");
  assert.equal(pluralizeAr(25, size), "٢٥ مقاسًا");
  assert.equal(pluralizeAr(103, size), "١٠٣ مقاسات");
});

test("summary line: ≤ 3 values are listed, more are counted", () => {
  assert.equal(variantSummaryLine(meat, "ar"), "٣ قطعيات: ريب آي · ستيك · مكعبات");
  assert.equal(variantSummaryLine(meat, "en"), "3 cuts: ريب آي · ستيك · مكعبات");
  const fries: ProductVariantsView = {
    type: "VARIANT",
    options: [{ key: "size", label: "المقاس", display: "PILL", values: [
      { key: "7mm", label: "٧ مم", swatchHex: null, imageUrl: null },
      { key: "10mm", label: "١٠ مم", swatchHex: null, imageUrl: null },
    ] }],
    variants: [v("a", { size: "7mm" }), v("b", { size: "10mm" })],
    defaultVariantId: "a",
  };
  assert.equal(variantSummaryLine(fries, "ar"), "مقاسان: ٧ مم · ١٠ مم");
  const many = { ...meat, options: [{ ...meat.options[0], values: [...meat.options[0].values, { key: "mince", label: "مفروم", swatchHex: null, imageUrl: null }] }] };
  many.variants = ["ribeye", "steak", "cubes", "mince"].map((c) => v(c, { cut: c }));
  assert.equal(variantSummaryLine(many, "ar"), "٤ قطعيات");
});

test("summary line: none for SIMPLE products", () => {
  assert.equal(variantSummaryLine({ type: "SIMPLE", options: [], variants: [v("x", {})], defaultVariantId: "x" }, "ar"), null);
});

test("generateCombinations: cartesian product in option/value order", () => {
  const combos = generateCombinations([
    { key: "cut", valueKeys: ["ribeye", "steak"] },
    { key: "weight", valueKeys: ["1kg", "5kg"] },
  ]);
  assert.deepEqual(combos, [
    { cut: "ribeye", weight: "1kg" },
    { cut: "ribeye", weight: "5kg" },
    { cut: "steak", weight: "1kg" },
    { cut: "steak", weight: "5kg" },
  ]);
  assert.deepEqual(generateCombinations([]), []);
  assert.deepEqual(generateCombinations([{ key: "cut", valueKeys: [] }]), []);
});

test("comboKey is independent of key order", () => {
  assert.equal(comboKey({ weight: "1kg", cut: "ribeye" }), comboKey({ cut: "ribeye", weight: "1kg" }));
});

test("findOrphans: removed value, removed option, added option", () => {
  const options = [{ key: "cut", valueKeys: ["steak"] }, { key: "weight", valueKeys: ["1kg"] }];
  const result = findOrphans(options, [
    { options: { cut: "steak", weight: "1kg" } },
    { options: { cut: "ribeye", weight: "1kg" } },
    { options: { cut: "steak", weight: "1kg", color: "red" } },
    { options: { cut: "steak" } },
  ]);
  assert.deepEqual(result.map((r) => r.reason), ["unknown-value", "unknown-option", "missing-option"]);
});

test("mergeGeneratedCombinations keeps existing data, adds missing combos, flags orphans", () => {
  const existing = [
    { id: "keep", options: { cut: "steak", weight: "1kg" }, weight: "custom" },
    { id: "orphan", options: { cut: "ribeye", weight: "1kg" }, weight: "x" },
  ];
  const { variants, added, orphans } = mergeGeneratedCombinations(
    [{ key: "cut", valueKeys: ["steak"] }, { key: "weight", valueKeys: ["1kg", "5kg"] }],
    existing,
    (options) => ({ id: "new", options, weight: "" })
  );
  assert.equal(added, 1);
  assert.equal(orphans.length, 1);
  assert.equal(orphans[0].variant.id, "orphan");
  assert.deepEqual(variants.map((x) => x.id), ["keep", "orphan", "new"]);
  assert.equal(variants[0].weight, "custom");
});

test("resolveVariantFromParams: exact, partial, invalid, empty", () => {
  assert.equal(resolveVariantFromParams(meat, { cut: "cubes", weight: "5kg" }).id, "cubes-5");
  assert.equal(resolveVariantFromParams(meat, new URLSearchParams("cut=ribeye&weight=1kg")).id, "ribeye-1");
  // partial: the default (steak-1) agrees with cut=steak
  assert.equal(resolveVariantFromParams(meat, { cut: "steak" }).id, "steak-1");
  // partial: weight=5kg -> prefer an available match
  assert.equal(resolveVariantFromParams(meat, { weight: "5kg" }).id, "cubes-5");
  // missing combination -> default
  assert.equal(resolveVariantFromParams(meat, { cut: "ribeye", weight: "5kg" }).id, "steak-1");
  // unknown value / unknown key are ignored
  assert.equal(resolveVariantFromParams(meat, { cut: "wagyu" }).id, "steak-1");
  assert.equal(resolveVariantFromParams(meat, { color: "red", cut: "cubes" }).id, "cubes-1");
  assert.equal(resolveVariantFromParams(meat, {}).id, "steak-1");
  assert.equal(resolveVariantFromParams(meat, { cut: ["cubes", "steak"], weight: "5kg" }).id, "cubes-5");
});

test("variantQuery round-trips through resolveVariantFromParams", () => {
  for (const variant of meat.variants) {
    const qs = variantQuery(meat, variant);
    assert.equal(resolveVariantFromParams(meat, new URLSearchParams(qs)).id, variant.id);
  }
  assert.equal(variantQuery(meat, meat.variants[0]), "cut=ribeye&weight=1kg");
});

test("valueStates: first option never blocked; later options follow earlier selections", () => {
  const ribeye = meat.variants[0];
  assert.deepEqual(valueStates(meat, ribeye, "cut"), { ribeye: "selected", steak: "enabled", cubes: "enabled" });
  assert.deepEqual(valueStates(meat, ribeye, "weight"), { "1kg": "selected", "5kg": "disabled" });
  assert.deepEqual(valueStates(meat, meat.variants[3], "weight"), { "1kg": "selected", "5kg": "enabled" });
});

test("selectValue keeps later options when possible, else moves to a valid variant", () => {
  const cubes5 = meat.variants[4];
  assert.equal(selectValue(meat, cubes5, "cut", "steak").id, "steak-5");
  assert.equal(selectValue(meat, cubes5, "cut", "ribeye").id, "ribeye-1");
  assert.equal(selectValue(meat, meat.variants[3], "weight", "5kg").id, "cubes-5");
});

test("slugifyKey makes URL-safe keys", () => {
  assert.equal(slugifyKey("2.5 kg"), "2.5kg");
  assert.equal(slugifyKey("Rib Eye"), "rib-eye");
  assert.equal(slugifyKey("٧ مم"), "7");
  assert.equal(slugifyKey("10 mm"), "10mm");
  assert.equal(slugifyKey("مانجو"), "");
});
