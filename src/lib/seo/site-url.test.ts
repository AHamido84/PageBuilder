import { test } from "node:test";
import assert from "node:assert/strict";
import { PRODUCTION_SITE_URL, resolveSiteUrl } from "./site-url";

test("site URL: empty or *.vercel.app env values fall back to the www domain", () => {
  assert.equal(resolveSiteUrl(undefined), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl(""), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("https://goldensevenfoods.vercel.app"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("https://goldensevenfoods-abc123-ahamido.vercel.app/"), PRODUCTION_SITE_URL);
});

test("site URL: other values are cleaned (BOM, whitespace, trailing slash) and kept", () => {
  assert.equal(resolveSiteUrl("﻿ https://www.goldensevenfoods.com/ "), "https://www.goldensevenfoods.com");
  assert.equal(resolveSiteUrl("http://localhost:3000"), "http://localhost:3000");
});
