import { expect, test, type Page } from "@playwright/test";

/**
 * Product vs variant images: the product CARD shows the product's own image (never a variant's);
 * the product PAGE shows every variant with its own image, switching the gallery per variant, and a
 * deep link (?cut=…) opens that variant's image. Read-only.
 *   E2E_VARIANT_PRODUCT  slug of a variant product whose own image differs from its variants'
 *                        (default golden-seven-meat)
 */
const SLUG = process.env.E2E_VARIANT_PRODUCT ?? "golden-seven-meat";
const imageId = (src: string | null) => (decodeURIComponent(src ?? "").match(/uploads\/[^&?]*\/([0-9a-f]{8})/) ?? [])[1] ?? null;

async function galleryImage(page: Page) {
  const img = page.locator("[data-variant-gallery] img").first();
  await expect(img).toBeVisible();
  return imageId(await img.evaluate((el: HTMLImageElement) => el.currentSrc || el.src));
}

async function variantRows(page: Page, locale: string, query = "") {
  await page.goto(`/${locale}/products/${SLUG}${query}`);
  const table = page.locator("[data-variants-table]");
  test.skip((await table.count()) === 0, "variants are off or this product has none");
  const rows = table.locator("tbody tr");
  const thumbs = await rows.locator("[data-variant-thumb]").evaluateAll((els) => els.map((el) => (el as HTMLImageElement).src));
  return { rows, thumbs: thumbs.map(imageId) };
}

for (const locale of ["en", "ar"] as const) {
  test(`${locale}: every variant shows its own image and the gallery follows the selection`, async ({ page }) => {
    const { rows, thumbs } = await variantRows(page, locale);
    expect(thumbs.length).toBeGreaterThan(1);
    expect(thumbs.every(Boolean)).toBe(true);
    for (let i = 0; i < thumbs.length; i++) {
      await rows.nth(i).getByRole("button").dispatchEvent("click"); // the table scrolls sideways on phones
      await expect.poll(() => galleryImage(page)).toBe(thumbs[i]);
      await expect(page).toHaveURL(/\?.+=/); // the selection is in the URL, no reload
    }
  });

  test(`${locale}: a deep link opens that variant's image`, async ({ page }) => {
    const { rows, thumbs } = await variantRows(page, locale);
    await rows.last().getByRole("button").dispatchEvent("click"); // the table scrolls sideways on phones
    const url = page.url();
    await page.goto(url);
    await expect.poll(() => galleryImage(page)).toBe(thumbs[thumbs.length - 1]);
  });

  test(`${locale}: the product card shows the product's own image, not a variant's`, async ({ page }) => {
    const { thumbs } = await variantRows(page, locale);
    await page.goto(`/${locale}/products`);
    const card = page.locator(`a[href*="/products/${SLUG}"] img`).first();
    test.skip((await card.count()) === 0, "product not on the first listing page");
    const cardImage = imageId(await card.evaluate((el: HTMLImageElement) => el.currentSrc || el.src));
    expect(cardImage).not.toBeNull();
    expect(thumbs).not.toContain(cardImage);
  });
}
