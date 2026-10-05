import { expect, test } from "@playwright/test";

/**
 * Admin text styling (feat/text-styling). Needs text styles enabled (Admin -> Settings -> تنسيق
 * النصوص) and a styled product name on `absher-french-fries` (AR) -- on dev that is QA data; the
 * test skips itself otherwise. Plain (unstyled) output is covered by unit tests and the flag-off
 * page comparison.
 */
test("a styled word renders as a colored span, never as raw markup", async ({ page }) => {
  const response = await page.goto("/ar/products/absher-french-fries");
  test.skip(response?.status() !== 200, "product not on this database");
  const h1 = page.locator("h1").first();
  const styled = h1.locator('span[style*="color"]');
  test.skip((await styled.count()) === 0, "no styled name on this database (or text styles are off)");
  await expect(styled.first()).toBeVisible();
  const color = await styled.first().evaluate((el) => getComputedStyle(el).color);
  expect(color).not.toBe(await h1.evaluate((el) => getComputedStyle(el).color));
  await expect(h1).not.toContainText("<span");
  await expect(h1).not.toContainText('"type"');
});
