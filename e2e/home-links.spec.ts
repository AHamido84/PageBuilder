import { expect, test } from "@playwright/test";
import { home, maybeLogin } from "./helpers";

/**
 * Visual audit findings 04 + 05: every category card opens the products list pre-filtered to its
 * category, and every product card opens that product's own page.
 */
for (const locale of ["ar", "en"] as const) {
  test.describe(`homepage links (${locale})`, () => {
    test.beforeEach(async ({ page }) => {
      await maybeLogin(page);
    });

    test("each category card opens its filtered product list", async ({ page }) => {
      await page.goto(home(locale));
      const cards = page.locator("[data-g7-category-card]");
      const count = await cards.count();
      expect(count, "category cards on the homepage").toBeGreaterThan(0);
      const targets = await cards.evaluateAll((els) => els.map((el) => ({ href: el.getAttribute("href") ?? "", title: el.querySelector("p")?.textContent?.trim() ?? "" })));
      const slugs = new Set<string>();
      for (const { href, title } of targets) {
        const url = new URL(href, "http://x");
        expect(url.pathname, `"${title}" links to the products list`).toBe(`/${locale}/products`);
        const slug = url.searchParams.get("category");
        expect(slug, `"${title}" carries a category filter`).toBeTruthy();
        slugs.add(slug!);
        await page.goto(href);
        // The filter bar's category select shows the active category on load.
        await expect(page.locator('select:has(option[value="' + slug + '"])').first()).toHaveValue(slug!);
        await page.goBack();
      }
      expect(slugs.size, "every category card goes somewhere different").toBe(targets.length);
    });

    test("each product card opens its own product page", async ({ page }) => {
      await page.goto(home(locale));
      const hrefs = await page.locator("[data-g7-product-card]").evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      expect(hrefs.length, "product cards on the homepage").toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href, "product card links to a product detail page").toMatch(new RegExp(`^/${locale}/products/[^/?#]+$`));
        await page.goto(href);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("h1").first()).not.toHaveText(/^\s*$/);
      }
      expect(new Set(hrefs).size, "no two product cards share a page").toBe(hrefs.length);
    });
  });
}
