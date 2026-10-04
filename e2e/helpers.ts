import type { Page } from "@playwright/test";

export const HOME_SUFFIX = process.env.E2E_HOME_SUFFIX ?? "";

/** Logs in to the local admin when credentials are provided (only needed for ?preview=draft). */
export async function maybeLogin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) return;
  await page.goto("/admin/login");
  if (!page.url().includes("/login")) return;
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator("form button").first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"));
}

export const home = (locale: "ar" | "en") => `/${locale}${HOME_SUFFIX}`;
