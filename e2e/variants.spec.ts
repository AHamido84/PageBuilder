import { expect, test, type Page } from "@playwright/test";
import { home, maybeLogin } from "./helpers";

/**
 * Variant products (feat/admin-variant-products). Needs, on the target database:
 *   - variants enabled (Admin -> Product options), and
 *   - the merged Absher product from scripts/migrate-variants.ts (`absher-french-fries`, size 7mm/10mm).
 * The public suite skips itself otherwise. The admin flow additionally needs E2E_ADMIN_EMAIL /
 * E2E_ADMIN_PASSWORD and writes ONLY disposable data (slug e2e-frozen-beef*, removed by
 * `npx tsx scripts/qa-variants-dev-data.ts --cleanup`). No lead is ever submitted: the server-action
 * POST of the quote form is intercepted and aborted.
 */

const ABSHER = "/products/absher-french-fries";

async function variantsOn(page: Page): Promise<boolean> {
  const response = await page.goto(`/ar${ABSHER}`);
  return response?.status() === 200 && (await page.locator("[data-variant-selector]").count()) > 0;
}

const mainImageSrc = (page: Page) =>
  page.locator("[data-variant-gallery] img, main img").first().evaluate((img) => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src);

test.describe("variant products -- public site", () => {
  test.beforeEach(async ({ page }) => {
    await maybeLogin(page);
    test.skip(!(await variantsOn(page)), "variants are off or the merged Absher product doesn't exist on this database");
  });

  test("home -> Absher -> switch size -> image + URL update -> quote form prefilled", async ({ page }) => {
    const posts: string[] = [];
    await page.route("**/*", async (route) => {
      const req = route.request();
      if (req.method() === "POST" && req.headers()["next-action"]) {
        posts.push(req.postData() ?? "");
        await route.abort(); // never reaches the server -- no lead is created
        return;
      }
      await route.continue();
    });

    await page.goto(home("ar"));
    const card = page.locator(`a[href*="${ABSHER}"]`).first();
    await expect(card, "a home card links to the merged Absher product").toBeVisible();
    await card.click();
    await page.waitForURL(new RegExp(`/ar${ABSHER}`));

    const group = page.getByRole("radiogroup").first();
    await expect(group).toBeVisible();
    const seven = group.getByRole("radio", { name: "٧ مم" });
    const ten = group.getByRole("radio", { name: "١٠ مم" });

    await seven.click();
    await expect(seven).toHaveAttribute("aria-checked", "true");
    await expect(page).toHaveURL(/[?&]size=7mm/);
    const imageSeven = await mainImageSrc(page);

    await ten.click();
    await expect(ten).toHaveAttribute("aria-checked", "true");
    await expect(page).toHaveURL(/[?&]size=10mm/);
    await expect.poll(() => mainImageSrc(page), { message: "the gallery shows the 10 mm image" }).not.toBe(imageSeven);
    await expect(page.locator("[data-variant-name]")).toContainText("١٠ مم");

    // Keyboard: arrow keys move the selection inside the radiogroup.
    await ten.focus();
    await page.keyboard.press("ArrowRight"); // RTL: right = previous
    await expect(seven).toHaveAttribute("aria-checked", "true");
    await expect(page).toHaveURL(/[?&]size=7mm/);
    await page.keyboard.press("ArrowLeft");
    await expect(ten).toHaveAttribute("aria-checked", "true");

    // Refresh keeps the selection (it lives in the URL).
    await page.reload();
    await expect(page.getByRole("radio", { name: "١٠ مم" })).toHaveAttribute("aria-checked", "true");

    // «اطلب عرض سعر لهذا المنتج» -> home quote form with product + variant preselected.
    await page.locator("[data-quote-link]").click();
    await page.waitForURL(/[?&]product=absher-french-fries/);
    const pill = page.locator('input[name="productSlugs"][value="absher-french-fries"]');
    await expect(pill).toBeChecked();
    const variantSelect = page.locator('select[name="variant.absher-french-fries"]');
    await expect(variantSelect).toBeVisible();
    await expect(variantSelect.locator("option:checked")).toHaveText("١٠ مم");

    await page.locator("#g7q-name").fill("E2E test (not sent)");
    await page.locator("#g7q-phone").fill("+966500000000");
    await page.locator('[id="quote"] button[type="submit"]').first().click();
    await expect.poll(() => posts.length).toBeGreaterThan(0);
    expect(posts[0]).toContain("absher-french-fries");
  });

  test("invalid params fall back to the default variant", async ({ page }) => {
    await page.goto(`/ar${ABSHER}?size=99mm&color=red`);
    const checked = page.getByRole("radiogroup").first().locator('[aria-checked="true"]');
    await expect(checked).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${ABSHER}$`));
  });

  test("filter by size shows the matching variant's card", async ({ page }) => {
    await page.goto("/ar/products");
    const sizeFilter = page.locator('[data-option-filters] select[name="size"]');
    await expect(sizeFilter).toBeVisible();
    await sizeFilter.selectOption("10mm");
    await page.waitForURL(/[?&]size=10mm/);
    const card = page.locator(`a[href*="${ABSHER}"]`).first();
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", new RegExp(`${ABSHER}\\?size=10mm`));
    await expect(card.locator("[data-variant-summary]")).toContainText("مقاسان");
  });

  test("old Absher URLs redirect permanently to the right variant", async ({ page, request }) => {
    for (const [slug, size] of [["absher-frensh-fries-7mm", "7mm"], ["absher-frensh-fries-10mm", "10mm"]] as const) {
      const res = await request.get(`/ar/products/${slug}`, { maxRedirects: 0 });
      expect([301, 308], `${slug} is a permanent redirect`).toContain(res.status());
      expect(res.headers()["location"]).toContain(`${ABSHER}?size=${size}`);
      await page.goto(`/en/products/${slug}`);
      await expect(page).toHaveURL(new RegExp(`/en${ABSHER}\\?size=${size}`));
      await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
    }
  });

  test("JSON-LD is a ProductGroup with variants and no offers", async ({ page }) => {
    await page.goto(`/en${ABSHER}`);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const group = blocks.flatMap((b) => [JSON.parse(b)].flat()).find((d) => d["@type"] === "ProductGroup");
    expect(group, "ProductGroup present").toBeTruthy();
    expect(group.hasVariant.length).toBeGreaterThanOrEqual(2);
    expect(group.variesBy).toContain("https://schema.org/size");
    expect(JSON.stringify(group)).not.toContain("offers");
  });
});

test.describe("variant products -- admin", () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "admin credentials not set");
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("create «لحم بقري مجمد» (قطعية × وزن), generate, delete one, bulk edit, publish, view", async ({ page, isMobile }) => {
    test.skip(isMobile, "admin flow runs on desktop");
    await maybeLogin(page);
    const slug = `e2e-frozen-beef-${Date.now().toString(36)}`;

    // Create the product (the existing create form).
    await page.goto("/admin/products");
    await page.locator('input[name="sku"]').fill(slug.toUpperCase());
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('select[name="categoryId"]').selectOption({ index: 1 });
    await page.locator('input[name="nameEn"]').fill("Frozen beef (E2E)");
    await page.locator('input[name="nameAr"]').fill("لحم بقري مجمد");
    await page.getByRole("button", { name: "Create product" }).click();
    await page.waitForURL(/\/admin\/products\/[^/?]+$/);

    // «الأنواع» tab -> منتج بأنواع.
    await page.getByRole("button", { name: /الأنواع/ }).click();
    const editor = page.locator("[data-variants-editor]");
    await editor.getByRole("radio", { name: "منتج بأنواع" }).click();

    // Options: القطعية (Arabic values need their English value) × الوزن.
    await editor.getByTestId("add-option").selectOption({ label: "القطعية / Cut" });
    const cut = editor.locator('[data-option="cut"]');
    for (const [ar, en] of [["ريب آي", "Ribeye"], ["ستيك", "Steak"], ["مكعبات", "Cubes"]]) {
      await cut.getByPlaceholder("اكتب قيمة واضغط Enter").fill(ar);
      await cut.getByPlaceholder("اكتب قيمة واضغط Enter").press("Enter");
      await cut.locator('input[dir="ltr"]').first().fill(en);
    }
    await editor.getByTestId("add-option").selectOption({ label: "الوزن / Weight" });
    const weight = editor.locator('[data-option="weight"]');
    for (const value of ["1 kg", "5 kg"]) {
      await weight.getByPlaceholder("اكتب قيمة واضغط Enter").fill(value);
      await weight.getByPlaceholder("اكتب قيمة واضغط Enter").press("Enter");
    }

    // Generate the matrix: 3 × 2 = 6, then delete «ريب آي · 5 kg».
    await editor.getByTestId("generate-variants").click();
    await expect(editor.locator("[data-variant-row]")).toHaveCount(6);
    await editor.locator('[data-variant-row="ريب آي · 5 kg"]').getByRole("button", { name: "حذف النوع" }).click();
    await page.getByRole("button", { name: "حذف", exact: true }).click();
    await expect(editor.locator("[data-variant-row]")).toHaveCount(5);

    // Saving without images is refused, with the message next to the field.
    await editor.getByTestId("variants-publish").click();
    await expect(editor.getByText("أضف صورة واحدة على الأقل").first()).toBeVisible();

    // Bulk: select all -> same images + weight.
    await editor.getByRole("checkbox", { name: "تحديد الكل" }).check();
    const bulk = editor.getByTestId("bulk-bar");
    await bulk.getByRole("button", { name: "تعيين الصور للمحدد" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: /absher-frensh-fries-7mm/ }).first().click();
    await modal.getByRole("button", { name: /^Add 1 file$/ }).click();
    await bulk.getByLabel("الوزن بالعربية للمحدد").fill("كرتون ١٠ كجم");
    await bulk.getByLabel("Weight for selected").fill("10 kg carton");
    await bulk.getByRole("button", { name: "تطبيق الوزن" }).click();

    // Default variant: «ستيك · 1 kg».
    await editor.getByRole("radio", { name: "النوع الافتراضي: ستيك · 1 kg" }).check();
    await editor.getByTestId("variants-publish").click();
    await expect(page.getByText("تم الحفظ والنشر")).toBeVisible({ timeout: 30_000 });

    // Public page: selector, URL sync, disabled missing combination.
    await page.goto(`/ar/products/${slug}`);
    const groups = page.getByRole("radiogroup");
    await expect(groups).toHaveCount(2);
    await expect(groups.nth(0).getByRole("radio", { name: "ستيك" })).toHaveAttribute("aria-checked", "true");
    await groups.nth(0).getByRole("radio", { name: "ريب آي" }).click();
    await expect(page).toHaveURL(/cut=ribeye/);
    await expect(groups.nth(1).getByRole("radio", { name: "5 kg" })).toHaveAttribute("aria-disabled", "true");
    await groups.nth(0).getByRole("radio", { name: "مكعبات" }).click();
    await groups.nth(1).getByRole("radio", { name: "5 kg" }).click();
    await expect(page).toHaveURL(/cut=cubes&weight=5kg/);
    await expect(page.locator("[data-variants-table] tbody tr")).toHaveCount(5);
  });
});
