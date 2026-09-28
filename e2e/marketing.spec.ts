import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll } from "./helpers";

test("landing page has complete SEO in the server HTML", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Stackcase: free portfolio builder for software engineers");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Free portfolio builder for software engineers/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /localhost:\d+$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og$/);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@graph"].map((n: { "@type": string }) => n["@type"])).toEqual([
    "Organization",
    "WebSite",
    "WebApplication",
    "HowTo",
    "FAQPage",
  ]);
  await expect(page.getByRole("heading", { level: 2, name: "What is Stackcase?" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("the example preview is not focusable or announced", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".mk-frame-body")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".mk-frame-body a").first()).not.toBeFocused();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`landing, sign-up and login meet WCAG 2.1 AA (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const path of [
      "/",
      "/signup",
      "/login",
      "/forgot-password",
      "/privacy",
      "/terms",
      "/accessibility",
    ]) {
      await page.goto(path);
      await expectAccessible(page);
      await expectNoHorizontalScroll(page);
    }
  });
}

test("crawler files and security headers on the main site", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
  expect(robots).toMatch(/Sitemap: http:\/\/localhost:\d+\/sitemap\.xml/);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/signup</loc>");
  const llms = await request.get("/llms.txt");
  expect(llms.headers()["content-type"]).toContain("text/plain");
  expect(await llms.text()).toMatch(/^# Stackcase\n\n> Stackcase is a free portfolio builder/);
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-powered-by"]).toBeUndefined();
  for (const path of [
    "/og",
    "/icon.svg",
    "/apple-icon.png",
    "/favicon.ico",
    "/logo.png",
    "/manifest.webmanifest",
  ]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("unknown portfolios show a claim prompt", async ({ page }) => {
  const res = await page.goto("/nobody-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /create your portfolio/i })).toBeVisible();
});

test("the Content Security Policy is sent and nothing on the main pages violates it", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  const res = await page.goto("/");
  expect(res?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(res?.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  await page.getByLabel("Username").first().fill("csp-check-name");
  await expect(page.getByText(/is available|is taken/).first()).toBeVisible();
  for (const path of ["/signup", "/login", "/forgot-password", "/privacy", "/og", "/nobody-here"])
    await page.goto(path);
  expect(violations).toEqual([]);
});

test("every platform page links the legal documents", async ({ page }) => {
  for (const path of ["/", "/signup", "/login", "/privacy", "/nobody-here"]) {
    await page.goto(path);
    for (const name of ["Privacy", "Terms", "Accessibility"]) {
      await expect(page.getByRole("link", { name, exact: true }).first(), `${path} ${name}`).toBeVisible();
    }
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await page
    .getByRole("link", { name: /Your rights/ })
    .first()
    .click();
  await expect(page).toHaveURL(/#rights$/);
});
