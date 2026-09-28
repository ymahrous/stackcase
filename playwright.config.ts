import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres@localhost:5432/stackcase_e2e";
/** Emails the app "sends" during e2e runs are written here as JSON, so tests can follow the links in them. */
export const OUTBOX_DIR = join(process.cwd(), "test-results", "outbox");

/**
 * Runs against a production build (`npm run build` first) with NEXT_PUBLIC_SITE_URL=http://localhost:PORT,
 * so portfolios are served at http://localhost:PORT/<username>.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Serial account journeys run once, on desktop; they check mobile widths themselves where it matters.
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /journey|design/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      EMAIL_TRANSPORT: "file",
      EMAIL_OUTBOX_DIR: OUTBOX_DIR,
      RESEND_API_KEY: "",
    },
  },
});
