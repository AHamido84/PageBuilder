/**
 * System pages: Page Builder pages that back a built-in route instead of their own URL. They can't
 * be deleted, their slug is locked, and the admin shows a «صفحة نظام» badge (Page.isSystem).
 *
 *   products            -> /[locale]/products (the catalog listing)
 *   __template__product -> /[locale]/products/[slug] (one template for every product page)
 *
 * Both render only while the products-page switch is on (products-flag.ts) and the page is
 * published; otherwise the routes keep their built-in pages.
 */

export const PRODUCTS_PAGE_SLUG = "products";
export const PRODUCT_TEMPLATE_SLUG = "__template__product";

export interface SystemPageInfo {
  slug: string;
  labelAr: string;
  labelEn: string;
  /** Block types the page must keep exactly once (can't be deleted or duplicated). */
  requiredBlocks: string[];
}

export const SYSTEM_PAGES: Record<string, SystemPageInfo> = {
  [PRODUCTS_PAGE_SLUG]: { slug: PRODUCTS_PAGE_SLUG, labelAr: "المنتجات", labelEn: "Products", requiredBlocks: [] },
  [PRODUCT_TEMPLATE_SLUG]: { slug: PRODUCT_TEMPLATE_SLUG, labelAr: "قالب صفحة المنتج", labelEn: "Product page template", requiredBlocks: ["PRODUCT_DETAILS"] },
};

export const isSystemPageSlug = (slug: string) => slug in SYSTEM_PAGES;

/**
 * Which pages a block may be added to: blocks that read the product page's context only make
 * sense on the template, and the template only takes those plus regular content blocks.
 */
export const TEMPLATE_ONLY_BLOCKS = new Set(["PRODUCT_DETAILS", "PRODUCT_RELATED"]);

export function canAddBlock(type: string, pageSlug: string, existingTypes: string[]): boolean {
  if (TEMPLATE_ONLY_BLOCKS.has(type) && pageSlug !== PRODUCT_TEMPLATE_SLUG) return false;
  // A required block exists exactly once.
  if (SYSTEM_PAGES[pageSlug]?.requiredBlocks.includes(type) && existingTypes.includes(type)) return false;
  return true;
}

/** A section the editor may not delete or duplicate on this page. */
export const isRequiredSection = (type: string, pageSlug: string) => Boolean(SYSTEM_PAGES[pageSlug]?.requiredBlocks.includes(type));

/** Server-side check before saving a system page's draft. */
export function validateSystemPageSections(pageSlug: string, types: string[]): string | null {
  const info = SYSTEM_PAGES[pageSlug];
  for (const type of types) if (TEMPLATE_ONLY_BLOCKS.has(type) && pageSlug !== PRODUCT_TEMPLATE_SLUG) return `"${type}" can only be used on the product page template.`;
  if (!info) return null;
  for (const required of info.requiredBlocks) {
    const n = types.filter((t) => t === required).length;
    if (n !== 1) return `The ${info.labelEn} must contain exactly one "${required}" section.`;
  }
  return null;
}
