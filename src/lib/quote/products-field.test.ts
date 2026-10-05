import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesSearch, normalizeArabic } from "../text/arabic-normalize";
import {
  buildQuoteProductLines,
  filterCatalog,
  groupCatalog,
  keyLabel,
  parseKey,
  prefillKey,
  selectGroup,
  clearGroup,
  toggleKey,
  validKeys,
  variantKey,
  type QuoteCatalogItem,
} from "./products-field";

const catalog: QuoteCatalogItem[] = [
  { slug: "guava-pulp", label: "لب الجوافة جولدن سفن", categoryId: "pulp", variants: [] },
  { slug: "mango-totapuri", label: "لب المانجو توتابوري جولدن سفن", categoryId: "pulp", variants: [] },
  { slug: "absher-french-fries", label: "أبشر بالبطاطس", categoryId: "fries", variants: [{ id: "v7", label: "٧ مم" }, { id: "v10", label: "١٠ مم" }] },
  { slug: "sweet-corn", label: "الذرة الحلوة", categoryId: null, variants: [] },
];
const groups = groupCatalog(catalog, [{ id: "fries", label: "بطاطس مجمدة" }, { id: "pulp", label: "لب فواكه مجمد" }], true, "أخرى");

test("Arabic-normalized search: ة/ه, ى/ي, أ/إ/آ/ا, diacritics", () => {
  assert.ok(matchesSearch("لب الجوافة", "جوافه"));
  assert.ok(matchesSearch("الذرة الحلوة", "الذره الحلوه"));
  assert.ok(matchesSearch("لب المانجو توتابوري", "توتابورى"));
  assert.ok(matchesSearch("أبشر بالبطاطس", "ابشر"));
  assert.ok(matchesSearch("لُبّ الجوافة", "لب"));
  assert.ok(matchesSearch("Absher French Fries", "french ABSHER"));
  assert.ok(!matchesSearch("لب الجوافة", "مانجو"));
  assert.equal(normalizeArabic("١٠مم"), "10 مم");
});

test("catalog groups follow category order; uncategorized last; empty groups dropped", () => {
  assert.deepEqual(
    groups.map((g) => [g.label, g.items.map((i) => i.slug)]),
    [
      ["بطاطس مجمدة", ["absher-french-fries"]],
      ["لب فواكه مجمد", ["guava-pulp", "mango-totapuri"]],
      ["أخرى", ["sweet-corn"]],
    ]
  );
  assert.equal(groupCatalog(catalog, [], false, "المنتجات")[0].items.length, 4);
});

test("filter: «جوافه» finds «الجوافة»; a variant hit opens its product with only that variant", () => {
  const hit = filterCatalog(groups, "جوافه");
  assert.deepEqual(hit.map((g) => g.items.map((i) => i.item.slug)), [["guava-pulp"]]);
  const variantHit = filterCatalog(groups, "١٠");
  assert.equal(variantHit.length, 1);
  assert.equal(variantHit[0].items[0].autoExpand, true);
  assert.deepEqual(variantHit[0].items[0].variants.map((v) => v.id), ["v10"]);
  assert.equal(filterCatalog(groups, "").flatMap((g) => g.items).length, 4);
});

test("selection keys: «any» and specific variants of one product exclude each other", () => {
  const v7 = variantKey("absher-french-fries", "v7");
  const v10 = variantKey("absher-french-fries", "v10");
  let s = toggleKey([], "absher-french-fries");
  assert.deepEqual(s, ["absher-french-fries"]);
  s = toggleKey(s, v7);
  assert.deepEqual(s, [v7]);
  s = toggleKey(s, v10);
  assert.deepEqual(s, [v7, v10]);
  s = toggleKey(s, "absher-french-fries");
  assert.deepEqual(s, ["absher-french-fries"]);
  assert.deepEqual(toggleKey(s, "absher-french-fries"), []);
  assert.deepEqual(toggleKey(["a", "b"], "c", 2), ["a", "b"], "max reached");
  assert.equal(parseKey("x~y~z"), null);
  assert.equal(parseKey("<script>"), null);
});

test("group select/clear, labels, prefill and stale keys", () => {
  const pulp = groups[1];
  assert.deepEqual(selectGroup(["absher-french-fries"], pulp), ["absher-french-fries", "guava-pulp", "mango-totapuri"]);
  assert.deepEqual(clearGroup(["absher-french-fries", "guava-pulp"], pulp), ["absher-french-fries"]);
  assert.equal(keyLabel(catalog, variantKey("absher-french-fries", "v7")), "أبشر بالبطاطس — ٧ مم");
  assert.equal(prefillKey(catalog, "absher-french-fries", "v10"), variantKey("absher-french-fries", "v10"));
  assert.equal(prefillKey(catalog, "absher-french-fries", "nope"), "absher-french-fries");
  assert.equal(prefillKey(catalog, "missing", null), null);
  assert.deepEqual(validKeys(catalog, ["guava-pulp", "gone", "guava-pulp", variantKey("guava-pulp", "x")]), ["guava-pulp"]);
});

test("payload lines: readable AR and EN labels plus slug and variant id", () => {
  const items = [
    { productId: "p1", slug: "absher-french-fries", variantId: "v7", labelAr: "أبشر بالبطاطس — ٧ مم", labelEn: "Absher French Fries — 7 mm" },
    { productId: "p2", slug: "guava-pulp", variantId: null, labelAr: "لب الجوافة", labelEn: "لب الجوافة" },
  ];
  assert.deepEqual(buildQuoteProductLines(items, "ar"), [
    "المنتجات المطلوبة:",
    "- أبشر بالبطاطس — ٧ مم / Absher French Fries — 7 mm [absher-french-fries · v7]",
    "- لب الجوافة [guava-pulp]",
  ]);
  assert.equal(buildQuoteProductLines(items, "en")[1], "- Absher French Fries — 7 mm / أبشر بالبطاطس — ٧ مم [absher-french-fries · v7]");
  assert.deepEqual(buildQuoteProductLines([], "ar"), []);
});

test("chip collapse keeps as many chips as fit in two rows with the «+n» chip", async () => {
  const { fitChips } = await import("../chip-fit");
  assert.equal(fitChips([100, 100, 100], 30, 400, 6), 3, "all fit on one row");
  assert.equal(fitChips([150, 150, 150, 150, 150], 30, 320, 6), 3, "2 + (1 + «+n») over two rows");
  assert.equal(fitChips([300, 300, 300], 30, 320, 6), 1, "one per row: 1 chip + «+n»");
  assert.equal(fitChips([500], 30, 320, 6), 1, "an over-wide chip still shows (shortened)");
  assert.equal(fitChips([], 30, 320, 6), 0);
});
