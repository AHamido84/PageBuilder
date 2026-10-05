import { expect, test, type Request } from "@playwright/test";
import { home, maybeLogin } from "./helpers";

/**
 * Visual audit findings 09, 11, 12 + the quote form, WITHOUT creating a lead: the server-action
 * POST is intercepted, inspected and aborted.
 */
test.beforeEach(async ({ page }) => {
  await maybeLogin(page);
});

test("quote links land on the form heading, not the image", async ({ page }) => {
  await page.goto(home("ar"));
  await expect(page.locator("#quote-form")).toHaveCount(1);
  const quoteLinks = page.locator('a[href$="#quote"], a[href$="#quote-form"]');
  expect(await quoteLinks.count()).toBeGreaterThan(0);
  await quoteLinks.first().click();
  const heading = page.locator("#quote-form");
  await expect(heading).toBeInViewport();
  // The sticky header must not cover the heading.
  const headerBottom = await page.locator("header").first().evaluate((el) => el.getBoundingClientRect().bottom);
  const headingTop = await heading.evaluate((el) => el.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(headerBottom - 1);
});

test("product pills share one row", async ({ page }) => {
  await page.goto(home("ar"));
  // With variant products enabled the pills come from the catalog instead (see variants.spec.ts).
  test.skip((await page.locator("[data-quote-catalog]").count()) > 0, "catalog pills are on");
  test.skip((await page.locator("[data-quote-products]").count()) > 0, "the products field is the dropdown (see quote-dropdown.spec.ts)");
  const tops = await page.locator('input[name="products"] + span').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(tops.length).toBe(3);
  expect(new Set(tops).size).toBe(1);
});

test("'other city' asks for the city name and sends it instead of 'other'", async ({ page }) => {
  await page.goto(home("ar"));
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

  const city = page.locator("#g7q-city");
  const otherLabel = await city.locator("option").evaluateAll((opts) => (opts as HTMLOptionElement[]).map((o) => o.value).find((v) => /أخرى|other/i.test(v)) ?? "");
  expect(otherLabel, "the city list has an 'other city' option").not.toBe("");

  await expect(page.locator("#g7q-city-other")).toHaveCount(0);
  await city.selectOption(otherLabel);
  await expect(page.locator("#g7q-city-other")).toBeVisible();

  // Picking a real city hides and clears it again.
  const firstCity = await city.locator("option").nth(1).getAttribute("value");
  await city.selectOption(firstCity!);
  await expect(page.locator("#g7q-city-other")).toHaveCount(0);
  await city.selectOption(otherLabel);

  await page.locator("#g7q-name").fill("E2E test (not sent)");
  await page.locator("#g7q-phone").fill("+966500000000");
  await page.locator('#quote button[type="submit"], [id="quote"] button[type="submit"]').first().click();
  await expect(page.locator("#g7q-cityOther-error")).toBeVisible();
  expect(posts.length, "nothing is sent while the city name is missing").toBe(0);

  await page.locator("#g7q-city-other").fill("ينبع");
  // The products dropdown requires a pick (quote-dropdown.spec.ts covers it in detail).
  if (await page.locator("#g7q-products").count()) {
    await page.locator("#g7q-products").click({ position: { x: 8, y: 8 } });
    await page.locator('[role="listbox"] [role="option"]').first().click();
    await page.keyboard.press("Escape");
  }
  await page.locator('[id="quote"] button[type="submit"]').first().click();
  await expect.poll(() => posts.length).toBeGreaterThan(0);
  const body = posts[0].postData() ?? "";
  expect(body).toContain("ينبع");
});
