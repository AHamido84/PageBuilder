import { defineConfig, devices } from "@playwright/test";

/**
 * E2E checks for the Golden Seven homepage (visual audit 2026-10-04).
 *   PLAYWRIGHT_BASE_URL  site to test (default http://localhost:3000; a Vercel preview works too)
 *   E2E_HOME_SUFFIX      appended to /ar and /en, e.g. "?preview=draft" for a local unpublished draft
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD  optional local admin login (needed for ?preview=draft)
 * Uses the installed Google Chrome (channel "chrome"), so no browser download is needed.
 * The form test never submits a lead: the server-action request is intercepted and aborted.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome", viewport: { width: 390, height: 844 } } },
  ],
});
