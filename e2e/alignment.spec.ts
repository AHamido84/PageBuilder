import { expect, test, type Page } from "@playwright/test";

/**
 * «تواصل معنا» alignment: the contact-details card on /contact (CONTACT_INFO block) sits on the
 * start side -- right in Arabic, left in English -- with its text, icons and items following the
 * language. (It used to be centered in both.)
 */
async function cardBox(page: Page, locale: "ar" | "en") {
  await page.goto(`/${locale}/contact`);
  const heading = page.locator("main p.manifest-strip").first();
  await expect(heading).toBeVisible();
  // The card = the heading's nearest boxed ancestor; the container = the section's content box.
  return heading.evaluate((el) => {
    let card: HTMLElement | null = el as HTMLElement;
    while (card && !(card.className.includes("max-w-md"))) card = card.parentElement;
    const box = card!.getBoundingClientRect();
    const container = card!.parentElement!.getBoundingClientRect();
    return { left: box.left - container.left, right: container.right - box.right, textAlign: getComputedStyle(el).textAlign, dir: getComputedStyle(el).direction };
  });
}

test("Arabic: the contact card and its text are on the right", async ({ page }) => {
  const b = await cardBox(page, "ar");
  expect(b.dir).toBe("rtl");
  expect(b.right).toBeLessThan(2);
  // Narrow screens: the card fills the width (both gaps ~0); otherwise it hugs the right.
  expect(b.left >= b.right).toBe(true);
  expect(["start", "right"]).toContain(b.textAlign);
});

test("English: the contact card and its text are on the left", async ({ page }) => {
  const b = await cardBox(page, "en");
  expect(b.dir).toBe("ltr");
  expect(b.left).toBeLessThan(2);
  expect(b.right >= b.left).toBe(true);
  expect(["start", "left"]).toContain(b.textAlign);
});

/**
 * Builder control: switch the contact-details section to «وسط» (Layout -> Alignment) and publish;
 * the card centers. Then back to «تلقائي». WRITES to the contact page -> dev / preview only.
 */
test.describe("builder alignment", () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "admin credentials not set");
  test.skip(/goldensevenfoods\.com/.test(process.env.PLAYWRIGHT_BASE_URL ?? ""), "never edits the production site");
  test.use({ viewport: { width: 1600, height: 1000 } });

  async function setAlignment(page: Page, value: "center" | "left") {
    const { maybeLogin } = await import("./helpers");
    await maybeLogin(page);
    await page.goto("/admin/pages");
    const href = await page.locator("table").getByRole("link", { name: /^\/contact/ }).first().getAttribute("href");
    await page.goto(`${href}/builder`);
    await page.getByRole("button", { name: /Layers/i }).first().click();
    await page.locator('ol[aria-label="Page sections"] li button', { hasText: /Contact Details/ }).first().click();
    for (const locale of ["English", "العربية"]) {
      await page.getByRole("radio", { name: locale }).or(page.getByRole("button", { name: locale, exact: true })).first().click();
      await page.getByRole("button", { name: "Layout", exact: true }).or(page.getByRole("tab", { name: "Layout" })).first().click();
      await page.locator('label:text-is("Alignment") + select').selectOption(value);
    }
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeEnabled({ timeout: 60_000 });
    await page.waitForTimeout(1500);
  }

  test("«وسط» centers the card in AR and EN; «تلقائي» puts it back", async ({ page }) => {
    test.setTimeout(600_000);
    await setAlignment(page, "center");
    for (const locale of ["ar", "en"] as const) {
      const b = await cardBox(page, locale);
      expect(Math.abs(b.left - b.right)).toBeLessThan(2);
      expect(b.textAlign).toBe("center");
    }
    await setAlignment(page, "left"); // «تلقائي» (stored as the logical start value)
    const b = await cardBox(page, "ar");
    expect(b.right).toBeLessThan(2);
  });
});
