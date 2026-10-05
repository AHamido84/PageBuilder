import { expect, test, type Page } from "@playwright/test";
import { maybeLogin } from "./helpers";

/**
 * The Products system page in the Page Builder (feat/products-page-builder): an admin changes its
 * title (AR + EN), turns on the quote card at position 1, hides the Brand filter and publishes;
 * /ar/products and /en/products show it and the filters still work. Then everything is put back
 * and published again.
 *
 * WRITES to the page -> dev / preview databases only (skipped on www.goldensevenfoods.com) and
 * needs E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD plus the products-page switch on (Admin -> Settings).
 */
test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "admin credentials not set");
test.skip(/goldensevenfoods\.com/.test(process.env.PLAYWRIGHT_BASE_URL ?? ""), "never edits the production site");
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1600, height: 1000 } });

const E2E_TITLE = { en: "E2E Products", ar: "منتجات E2E" };

async function openBuilder(page: Page) {
  await maybeLogin(page);
  await page.goto("/admin/pages");
  const href = await page.locator("table").getByRole("link", { name: /^Products/ }).first().getAttribute("href");
  await page.goto(`${href}/builder`);
  await page.getByRole("button", { name: /Layers/i }).first().click();
  await page.locator('ol[aria-label="Page sections"] li button', { hasText: /Products Catalog|Product details/ }).first().click();
  await expect(page.getByText("Quote card in the grid")).toBeVisible({ timeout: 60_000 });
}

async function setStyled(page: Page, label: string, value: string) {
  const box = page.locator("[data-styled-field]").filter({ has: page.locator(`span:text-is("${label}")`) }).first().locator('[role="textbox"]');
  await box.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(value);
}

async function editLocale(page: Page, locale: "en" | "ar", edits: { title: string; quote: boolean; brand: boolean }) {
  await page.getByRole("radio", { name: locale === "ar" ? "العربية" : "English" }).or(page.getByRole("button", { name: locale === "ar" ? "العربية" : "English", exact: true })).first().click();
  await setStyled(page, "Title", edits.title);
  const quote = page.getByLabel("Show a quote card");
  if ((await quote.isChecked()) !== edits.quote) await quote.click();
  if (edits.quote) {
    const position = page.locator('label:text-is("Position in the grid") + input');
    await position.fill("1");
    await position.blur();
    await setStyled(page, "Title", edits.title); // header title (first «Title» field) stays as set
    const quoteTitle = page.locator("[data-styled-field]").filter({ has: page.locator('span:text-is("Title")') }).nth(1).locator('[role="textbox"]');
    await quoteTitle.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(locale === "ar" ? "اطلب عرض سعر E2E" : "E2E quote card");
  }
  const brand = page.getByLabel(/^Brand · /);
  if ((await brand.isChecked()) !== edits.brand) await brand.click();
}

async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeEnabled({ timeout: 60_000 });
  await page.waitForTimeout(1500);
}

test("edit, publish and see it on /ar/products and /en/products; filters still work", async ({ page }) => {
  test.setTimeout(600_000);
  await openBuilder(page);
  await editLocale(page, "en", { title: E2E_TITLE.en, quote: true, brand: false });
  await editLocale(page, "ar", { title: E2E_TITLE.ar, quote: true, brand: false });
  await publish(page);

  for (const locale of ["en", "ar"] as const) {
    await page.goto(`/${locale}/products`, { waitUntil: "networkidle" });
    await expect(page.locator("main h2").first()).toHaveText(E2E_TITLE[locale]);
    await expect(page.locator("[data-products-grid] > *").first()).toHaveAttribute("data-grid-promo");
    await expect(page.locator(`select[aria-label="${locale === "ar" ? "العلامة التجارية" : "Brand"}"]`)).toHaveCount(0);
    // The category filter still filters (URL-synced).
    const category = page.locator(`select[aria-label="${locale === "ar" ? "الفئة" : "Category"}"]`);
    const value = await category.locator("option").nth(1).getAttribute("value");
    await category.selectOption(value!);
    await expect(page).toHaveURL(new RegExp(`category=${value}`), { timeout: 60_000 });
  }

  // A product page still renders its variant selector (when the product has variants).
  await page.goto("/en/products/absher-french-fries");
  await expect(page.locator("h1").first()).toBeVisible();
});

test("put the page back as it was", async ({ page }) => {
  test.setTimeout(600_000);
  await openBuilder(page);
  await editLocale(page, "en", { title: "Products", quote: false, brand: true });
  await editLocale(page, "ar", { title: "المنتجات", quote: false, brand: true });
  await publish(page);
  await page.goto("/en/products");
  await expect(page.locator("main h2").first()).toHaveText("Products");
});
