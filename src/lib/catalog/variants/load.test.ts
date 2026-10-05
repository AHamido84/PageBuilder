import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVariantsView, type VariantViewSource } from "./load";

const option = { id: "po1", productId: "p1", optionTypeId: "t1", sortOrder: 0, optionType: { id: "t1", key: "size", labelAr: "المقاس", labelEn: "Size", display: "PILL" as const, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }, values: [
  { id: "v7", productOptionId: "po1", key: "7mm", valueAr: "٧ مم", valueEn: "7 mm", swatchHex: null, imageUrl: null, sortOrder: 0 },
  { id: "v10", productOptionId: "po1", key: "10mm", valueAr: "١٠ مم", valueEn: "10 mm", swatchHex: null, imageUrl: null, sortOrder: 1 },
] };
const variant = (id: string, valueId: string, extra: Record<string, unknown> = {}) => ({
  id, productId: "p1", sku: null, nameAr: null, nameEn: null, shortDescriptionAr: null, shortDescriptionEn: null, descriptionAr: null, descriptionEn: null,
  weightAr: null, weightEn: null, packagingAr: null, packagingEn: null, storageAr: null, storageEn: null, available: true, sortOrder: 0,
  createdAt: new Date(), updatedAt: new Date(),
  optionValues: [{ variantId: id, optionValueId: valueId, optionValue: { id: valueId, key: valueId === "v7" ? "7mm" : "10mm", productOptionId: "po1" } }],
  images: [], specs: [], ...extra,
});

const source: VariantViewSource = {
  id: "p1",
  sku: "AB",
  type: "VARIANT",
  defaultVariantId: "a",
  weight: "2.5 kg",
  translations: [
    { locale: "AR", name: "أبشر بالبطاطس", shortDescription: "وصف المنتج", description: "تفاصيل المنتج", packagingInfo: null, storageInfo: null },
    { locale: "EN", name: "Absher Fries", shortDescription: "Product summary", description: null, packagingInfo: null, storageInfo: null },
  ],
  images: [{ url: "https://x/p.jpg" }],
  options: [option],
  variants: [variant("a", "v7", { shortDescriptionAr: "بطاطس رفيعة", descriptionEn: "Thin cut" }), variant("b", "v10")],
};

test("variant descriptions fall back to the product's, per locale", () => {
  const ar = buildVariantsView(source, "ar", true);
  assert.equal(ar.variants[0].shortDescription, "بطاطس رفيعة");
  assert.equal(ar.variants[0].description, "Thin cut"); // no Arabic -> the English one, not empty
  assert.equal(ar.variants[1].shortDescription, "وصف المنتج");
  assert.equal(ar.variants[1].description, "تفاصيل المنتج");
  const en = buildVariantsView(source, "en", true);
  assert.equal(en.variants[0].description, "Thin cut");
  assert.equal(en.variants[1].shortDescription, "Product summary");
  assert.equal(en.variants[1].weight, "2.5 kg");
  assert.equal(en.variants[1].images[0].url, "https://x/p.jpg");
});

test("flag off: one SIMPLE variant with the product's own fields", () => {
  const view = buildVariantsView(source, "ar", false);
  assert.equal(view.type, "SIMPLE");
  assert.equal(view.variants.length, 1);
  assert.equal(view.variants[0].shortDescription, "وصف المنتج");
});
