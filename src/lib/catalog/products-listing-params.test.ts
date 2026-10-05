import { test } from "node:test";
import assert from "node:assert/strict";
import { listingQuery, pageHref, parseListingParams } from "./products-listing-params";
import { canAddBlock, isRequiredSection, validateSystemPageSections } from "../page-builder/system-pages";

test("parses the /products URL like the built-in page", () => {
  const p = parseListingParams({ q: " فيليه ", category: "fish", temp: "FROZEN", sort: "name-asc", page: "3" }, { pageSize: 12 });
  assert.deepEqual(p, { q: "فيليه", category: "fish", categoryFromUrl: true, brand: null, temp: "FROZEN", sort: "name-asc", page: 3, show: 12 });
  const junk = parseListingParams({ temp: "HOT", sort: "price", page: "-2", show: "99999" }, { pageSize: 12 });
  assert.equal(junk.temp, null);
  assert.equal(junk.sort, "newest");
  assert.equal(junk.page, 1);
  assert.equal(junk.show, 240, "load-more is capped at 20 pages");
  assert.equal(parseListingParams({ show: "13" }, { pageSize: 12 }).show, 24, "rounded up to whole pages");
});

test("a block's default category applies only when the URL has none (and stays out of links)", () => {
  const p = parseListingParams({}, { pageSize: 12, defaultCategory: "fries" });
  assert.equal(p.category, "fries");
  assert.equal(p.categoryFromUrl, false);
  assert.equal(listingQuery(p, {}), "");
  assert.equal(parseListingParams({ category: "fish" }, { pageSize: 12, defaultCategory: "fries" }).category, "fish");
});

test("links keep every filter (incl. variant options) and patch page/show", () => {
  const p = parseListingParams({ category: "fries", brand: "absher", sort: "name-desc" }, { pageSize: 12 });
  assert.equal(pageHref(p, { size: "7mm" }, 2), "?category=fries&brand=absher&sort=name-desc&size=7mm&page=2");
  assert.equal(listingQuery(p, { size: "7mm" }, { show: 24, page: null }), "?category=fries&brand=absher&sort=name-desc&size=7mm&show=24");
});

test("system pages: template-only blocks, required product details", () => {
  assert.equal(canAddBlock("PRODUCT_DETAILS", "products", []), false);
  assert.equal(canAddBlock("PRODUCT_DETAILS", "__template__product", ["PRODUCT_DETAILS"]), false, "only once");
  assert.equal(canAddBlock("G7_QUOTE", "__template__product", ["PRODUCT_DETAILS"]), true);
  assert.equal(canAddBlock("PRODUCTS_CATALOG", "about", []), true);
  assert.ok(isRequiredSection("PRODUCT_DETAILS", "__template__product"));
  assert.ok(!isRequiredSection("PRODUCT_DETAILS", "about"));
  assert.equal(validateSystemPageSections("__template__product", ["G7_QUOTE"]) !== null, true);
  assert.equal(validateSystemPageSections("__template__product", ["CTA", "PRODUCT_DETAILS", "G7_QUOTE"]), null);
  assert.notEqual(validateSystemPageSections("about", ["PRODUCT_RELATED"]), null);
});
