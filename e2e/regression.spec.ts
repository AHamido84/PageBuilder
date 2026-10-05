import { expect, test } from "@playwright/test";

/**
 * Screenshot regression (feat/products-page-builder): home, products, a product page and the contact
 * page at 390 / 768 / 1440 px in Arabic and English.
 *   1) baseline from the live site:  PLAYWRIGHT_BASE_URL=https://www.goldensevenfoods.com npx playwright test e2e/regression.spec.ts --project=desktop --update-snapshots
 *   2) compare a candidate:          PLAYWRIGHT_BASE_URL=<preview or local> npx playwright test e2e/regression.spec.ts --project=desktop
 * Only meaningful when both sides show the same data (e.g. dev restored from a production backup).
 * Runs only when E2E_REGRESSION=1 (it's slow and needs a baseline).
 */
const PRODUCT = process.env.E2E_PRODUCT_SLUG ?? "absher-french-fries";
const PAGES: [string, string][] = [
  ["home", ""],
  ["products", "/products"],
  ["product", `/products/${PRODUCT}`],
  ["contact", "/contact"],
];
const WIDTHS = [390, 768, 1440];

test.skip(process.env.E2E_REGRESSION !== "1", "set E2E_REGRESSION=1");
test.use({ reducedMotion: "reduce" });

for (const locale of ["ar", "en"] as const) {
  for (const [name, path] of PAGES) {
    for (const width of WIDTHS) {
      test(`${name} ${locale} ${width}`, async ({ page }) => {
        test.setTimeout(180_000);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
        // Reveal-on-scroll content and lazy images: walk the page once, then back to the top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot(`${name}-${locale}-${width}.png`, {
          fullPage: true,
          animations: "disabled",
          maxDiffPixelRatio: 0.002,
          // The dev overlay badge (local dev only) and the WhatsApp bubble position are not page content.
          mask: [page.locator("nextjs-portal")],
        });
      });
    }
  }
}
