import { test } from "node:test";
import assert from "node:assert/strict";
import { issuesToFieldErrors, saveVariantsInput } from "./schema";

const img = [{ url: "https://example.com/a.webp" }];
const base = {
  productId: "p1",
  type: "VARIANT" as const,
  options: [
    { optionTypeId: "opt_cut", key: "cut", values: [
      { key: "ribeye", valueAr: "ريب آي", valueEn: "Ribeye" },
      { key: "steak", valueAr: "ستيك", valueEn: "Steak" },
    ] },
    { optionTypeId: "opt_weight", key: "weight", values: [{ key: "1kg", valueAr: "١ كجم", valueEn: "1 kg" }] },
  ],
  variants: [
    { clientId: "a", options: { cut: "ribeye", weight: "1kg" }, available: true, images: img, specs: [] },
    { clientId: "b", options: { cut: "steak", weight: "1kg" }, available: true, images: img, specs: [] },
  ],
  defaultVariantClientId: "a",
};

function errors(input: unknown) {
  const parsed = saveVariantsInput.safeParse(input);
  return parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);
}

test("a valid variant product passes", () => {
  assert.deepEqual(errors(base), {});
});

test("duplicate combination is rejected on the duplicate row", () => {
  const e = errors({ ...base, variants: [base.variants[0], { ...base.variants[1], options: { cut: "ribeye", weight: "1kg" } }] });
  assert.equal(e["variants.1.options"], "هذه التركيبة مكررة");
});

test("each variant needs an image", () => {
  const e = errors({ ...base, variants: [base.variants[0], { ...base.variants[1], images: [] }] });
  assert.equal(e["variants.1.images"], "أضف صورة واحدة على الأقل");
});

test("default variant must exist", () => {
  assert.equal(errors({ ...base, defaultVariantClientId: "zzz" }).defaultVariantClientId, "حدد النوع الافتراضي");
  assert.equal(errors({ ...base, defaultVariantClientId: null }).defaultVariantClientId, "حدد النوع الافتراضي");
});

test("every option needs a known value per variant", () => {
  const e = errors({ ...base, variants: [{ ...base.variants[0], options: { cut: "ribeye" } }, base.variants[1]] });
  assert.equal(e["variants.0.options.weight"], "اختر قيمة لهذا الخيار");
  const e2 = errors({ ...base, variants: [{ ...base.variants[0], options: { cut: "wagyu", weight: "1kg" } }, base.variants[1]] });
  assert.equal(e2["variants.0.options.cut"], "قيمة غير موجودة في الخيار");
});

test("duplicate SKUs and duplicate value keys are rejected", () => {
  const e = errors({ ...base, variants: base.variants.map((v) => ({ ...v, sku: "SAME" })) });
  assert.equal(e["variants.1.sku"], "رمز SKU مكرر");
  const dupValues = structuredClone(base);
  dupValues.options[0].values[1].key = "ribeye";
  assert.equal(errors(dupValues)["options.0.values.1.key"], "قيمة مكررة في هذا الخيار");
});

test("bad keys, colors and image URLs are rejected", () => {
  const bad = structuredClone(base) as Record<string, unknown> & typeof base;
  bad.options[0].values[0].key = "Rib Eye!";
  assert.ok(errors(bad)["options.0.values.0.key"]);
  assert.ok(errors({ ...base, options: [{ ...base.options[0], values: [{ ...base.options[0].values[0], swatchHex: "red" }, base.options[0].values[1]] }, base.options[1]] })["options.0.values.0.swatchHex"]);
  assert.ok(errors({ ...base, variants: [{ ...base.variants[0], images: [{ url: "javascript:alert(1)" }] }, base.variants[1]] })["variants.0.images.0.url"]);
});

test("SIMPLE products carry no options", () => {
  assert.deepEqual(errors({ productId: "p1", type: "SIMPLE", options: [], variants: [] }), {});
  assert.ok(errors({ ...base, type: "SIMPLE" }).options);
});

test("unknown fields are stripped (no mass assignment)", () => {
  const parsed = saveVariantsInput.parse({ ...base, isFeatured: true, variants: [{ ...base.variants[0], productId: "other" }, base.variants[1]] });
  assert.equal("isFeatured" in parsed, false);
  assert.equal("productId" in parsed.variants[0], false);
});
