/**
 * Misspelled slugs renamed on 2026-10-07 (scripts/fix-seo-slugs.ts renames the DB rows). Old URLs
 * keep working through permanent redirects: products in next.config.ts, the category (a query
 * parameter) in src/proxy.ts. Keep entries forever -- external links and search engines still
 * hold the old URLs.
 */
export const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  "golden-sevengreen-peas": "golden-seven-green-peas",
  "golden-even-reen-peas-carrot": "golden-seven-green-peas-carrot",
};

export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  "frensh-fries": "french-fries",
};
