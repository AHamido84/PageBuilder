import { expect, test, type Page, type Request } from "@playwright/test";
import { maybeLogin } from "./helpers";

/**
 * «المنتجات المطلوبة» multi-select dropdown (G7 quote form), at both projects' widths (1440 / 390)
 * in Arabic and English. Data-agnostic: works on any catalog. NEVER sends a lead -- every
 * server-action POST is intercepted, inspected and aborted.
 *   E2E_QUOTE_PATH  page with the quote form, without the locale (default "" = the homepage),
 *                   e.g. "/qa-text-styles-p2" on the dev database.
 */
const PATH = process.env.E2E_QUOTE_PATH ?? "";
const url = (locale: string, query = "") => `/${locale}${PATH}${query}#quote`;

test.beforeEach(async ({ page }) => {
  await maybeLogin(page);
});

async function interceptPosts(page: Page): Promise<Request[]> {
  const posts: Request[] = [];
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      posts.push(req);
      await route.abort(); // never reaches the server -- no lead is created
      return;
    }
    await route.continue();
  });
  return posts;
}

const picked = (page: Page) => page.locator('input[type="hidden"][name="productItems"]');
const options = (page: Page) => page.locator('[role="listbox"] [role="option"]');

async function open(page: Page) {
  const trigger = page.locator("#g7q-products");
  test.skip((await trigger.count()) === 0, "this page's quote form has no products dropdown");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ position: { x: 8, y: 8 } });
  await expect(page.locator('[role="listbox"]')).toBeVisible();
}

async function closePanel(page: Page, locale: string) {
  const done = page.getByRole("button", { name: locale === "ar" ? /^تم/ : /^Done/ });
  if (await done.isVisible().catch(() => false)) await done.click();
  else await page.keyboard.press("Escape");
  await expect(page.locator('[role="listbox"]')).toHaveCount(0);
}

for (const locale of ["ar", "en"] as const) {
  test.describe(`quote dropdown (${locale})`, () => {
    test("search is Arabic-normalized; picks show as chips; a chip can be removed", async ({ page }, info) => {
      await page.goto(url(locale));
      await open(page);
      const search = page.locator('[role="dialog"] input[type="search"]');
      await expect(search).toBeFocused();

      // Mobile opens a bottom sheet with a «تم (n)» button.
      if (info.project.name === "mobile") await expect(page.getByRole("button", { name: locale === "ar" ? /^تم/ : /^Done/ })).toBeVisible();

      // «جوافه» must find «الجوافة» (and the reverse) when the catalog has a guava product.
      const labels = await options(page).allInnerTexts();
      const guava = labels.find((l) => /جواف[ةه]/.test(l));
      if (guava) {
        await search.fill(guava.includes("ة") ? "جوافه" : "جوافة");
        await expect(options(page).first()).toContainText(/جواف[ةه]/);
      }
      // Generic check: a name searched with ة/ى swapped still matches.
      const sample = labels.find((l) => /[ةى]/.test(l));
      if (sample) {
        await search.fill(sample.split("\n")[0].replace(/ة/g, "ه").replace(/ى/g, "ي").slice(0, 12));
        expect(await options(page).count()).toBeGreaterThan(0);
      }
      await search.fill("");

      // Two products (plain rows) ...
      const plain = page.locator('[role="listbox"] [role="option"][data-level="1"]:not([aria-expanded])');
      expect(await plain.count()).toBeGreaterThanOrEqual(2);
      await plain.nth(0).click();
      await plain.nth(1).click();
      // ... and one variant, when the catalog has a variant product.
      const parent = page.locator('[role="listbox"] [role="option"][aria-expanded]').first();
      let expected = 2;
      if (await parent.count()) {
        await parent.locator("button").click();
        await page.locator('[role="listbox"] [role="option"][data-level="2"]').first().click();
        expected = 3;
      }
      await expect(picked(page)).toHaveCount(expected);
      await closePanel(page, locale);

      // Chips (+ the «+n» collapse) account for every pick, on at most two lines.
      const chips = page.locator("#g7q-products [data-chip]");
      const more = page.locator("#g7q-products [data-chip-more]");
      const moreCount = (await more.count()) ? Number((await more.innerText()).replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))) : 0;
      expect((await chips.count()) + moreCount).toBe(expected);
      const rows = new Set(await chips.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top))));
      expect(rows.size).toBeLessThanOrEqual(2);

      await chips.first().getByRole("button").click();
      await expect(picked(page)).toHaveCount(expected - 1);
    });

    test("many picks collapse into «+n» and the field stays within two lines", async ({ page }) => {
      await page.goto(url(locale));
      await open(page);
      const selectAll = page.getByRole("button", { name: locale === "ar" ? "تحديد الكل" : "Select all" });
      const groups = await selectAll.count();
      for (let i = 0; i < groups; i++) await selectAll.nth(0).click(); // each click turns that button into «إلغاء التحديد»
      await closePanel(page, locale);
      const count = await picked(page).count();
      test.skip(count < 4, "catalog too small to overflow");
      const box = await page.locator("#g7q-products").boundingBox();
      const chipHeight = await page.locator("#g7q-products [data-chip]").first().evaluate((el) => el.getBoundingClientRect().height);
      expect(box!.height).toBeLessThanOrEqual(chipHeight * 2 + 30);
      await expect(page.getByRole("button", { name: locale === "ar" ? "مسح الكل" : "Clear all" })).toBeVisible();
      await page.getByRole("button", { name: locale === "ar" ? "مسح الكل" : "Clear all" }).click();
      await expect(picked(page)).toHaveCount(0);
    });

    test("submitting without a product shows the error; with one, the payload carries it (never sent)", async ({ page }) => {
      await page.goto(url(locale));
      test.skip((await page.locator("#g7q-products").count()) === 0, "no products dropdown");
      const posts = await interceptPosts(page);
      await page.locator("#g7q-name").fill("E2E test (not sent)");
      await page.locator("#g7q-phone").fill("+966500000000");
      const submit = page.locator('[id="quote"] button[type="submit"]').first();
      await submit.click();
      await expect(page.locator("#g7q-products-error")).toHaveText(locale === "ar" ? "اختر منتجًا واحدًا على الأقل" : "Select at least one product");
      await expect(page.locator("#g7q-products")).toBeFocused();
      expect(posts.length).toBe(0);

      await open(page);
      await options(page).first().click();
      await closePanel(page, locale);
      await expect(page.locator("#g7q-products-error")).toHaveCount(0);
      const key = await picked(page).first().getAttribute("value");
      await submit.click();
      await expect.poll(() => posts.length).toBeGreaterThan(0);
      const body = posts[0].postData() ?? "";
      expect(body).toContain("productItems");
      expect(body).toContain(key!);
      expect(body).toContain("productsRequired");
    });

    test("?product= (the product page's quote link) preselects that product", async ({ page }) => {
      await page.goto(url(locale));
      await open(page);
      await options(page).first().click();
      const key = (await picked(page).first().getAttribute("value"))!;
      const [slug, variant] = key.split("~");
      await page.goto(url(locale, `?product=${slug}${variant ? `&variant=${variant}` : ""}`));
      await expect(picked(page)).toHaveCount(1);
      await expect(picked(page).first()).toHaveAttribute("value", key);
    });

    test("keyboard: arrows move, Enter toggles, Esc closes back to the field", async ({ page }) => {
      await page.goto(url(locale));
      await open(page);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(picked(page)).toHaveCount(1);
      await page.keyboard.press("Enter");
      await expect(picked(page)).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(page.locator('[role="listbox"]')).toHaveCount(0);
      await expect(page.locator("#g7q-products")).toBeFocused();
      await expect(page.locator("#g7q-products")).toHaveAttribute("aria-expanded", "false");
    });
  });
}
