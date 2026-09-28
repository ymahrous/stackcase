import { expect, test, type Page } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, portfolio, uniqueName } from "./helpers";

/**
 * Customization end to end: a new user builds a portfolio, restyles it in the Design tab, and the public
 * page follows every choice while staying accessible. Also covers hostile input and a performance budget.
 */
test.describe.configure({ mode: "serial" });

const username = uniqueName("kai");
const email = `${username}@example.com`;
const password = "orange bicycle hums";

// One signed-in browser session for the whole spec: fewer logins, so the per-IP login limit isn't spent.
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();
});
test.afterAll(async () => {
  await page.context().close();
});

async function signUpAndBuild(page: Page) {
  await page.goto(`/signup?username=${username}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: "Create my portfolio" }).click();
  await expect(page).toHaveURL(/\/dashboard\?welcome=1$/);

  await page.goto("/dashboard/profile");
  await page.getByLabel("Name", { exact: true }).fill(`Kai <script>window.__xss=1</script> Moreno`);
  await page.getByLabel("Pronouns").fill("he/him");
  await page.getByLabel("Headline").fill("Data engineer");
  await page.getByLabel("Intro").fill(`Pipelines and dashboards. <img src=x onerror="window.__xss=2">`);
  await page.getByLabel("Résumé").fill("kai.example.com/cv.pdf");
  await page.getByLabel("Search title").fill("Kai Moreno, data engineer (dbt, Airflow)");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/dashboard/projects");
  // Saved projects render their own edit forms; the "new project" form sits in a disclosure that
  // closes once a project exists.
  const newProject = page.locator("details", { hasText: "Add a project" });
  for (const name of ["Warehouse", "Metrics API", "Backfill tool"]) {
    if ((await newProject.getAttribute("open")) === null) await newProject.locator("summary").click();
    await newProject.getByLabel("Project name").fill(name);
    await newProject.getByLabel("One-liner").fill(`${name} for the analytics team`);
    await newProject.getByLabel("Tech stack").fill("Python, dbt");
    await newProject.getByRole("button", { name: "Add project" }).click();
    await expect(page.getByText(name).first()).toBeVisible();
  }
  await page.goto("/dashboard/skills");
  await page.getByLabel("Area").fill("Data");
  await page.getByLabel("Tools").fill("dbt, Airflow, Postgres");
  await page.getByRole("button", { name: "Add skill" }).click();
  await expect(page.locator("summary").filter({ hasText: "Data" })).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Publish portfolio" }).click();
  await expect(page.getByText("Your portfolio is live.")).toBeVisible();
}

async function saveDesign(
  page: Page,
  choices: { mode: string; font: string; layout: string; accent: string },
) {
  await page.goto("/dashboard/design");
  await page.getByRole("radio", { name: choices.accent, exact: true }).check();
  await page.getByRole("radio", { name: new RegExp(`^${choices.mode}`) }).check();
  await page.getByRole("radio", { name: new RegExp(`^${choices.font}`) }).check();
  await page.getByRole("radio", { name: new RegExp(`^${choices.layout}`) }).check();
  await page.getByRole("button", { name: "Save design" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Design saved." })).toBeVisible();
}

test("build and publish a portfolio, with hostile text in the profile", async () => {
  await signUpAndBuild(page);
});

test("the Design tab previews choices live and is accessible", async () => {
  await page.goto("/dashboard/design");
  await expect(page.getByRole("heading", { level: 1, name: "Design" })).toBeVisible();
  await expectAccessible(page);

  const preview = page.locator(".dp");
  await expect(preview).toHaveAttribute("data-layout", "case-study");
  await page.getByRole("radio", { name: /^Card grid/ }).check();
  await page.getByRole("radio", { name: /^Dark/ }).check();
  await expect(preview).toHaveAttribute("data-layout", "grid");
  await expect(preview).toHaveAttribute("data-theme", "dark");
  await expect(preview).toHaveCSS("background-color", "rgb(13, 17, 16)");
  await expect(page.locator("#design-summary")).toContainText("dark, grotesk headings, card grid");

  // Keyboard: arrow keys move between options in a radio group.
  await page.getByRole("radio", { name: /^Grotesk/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /^Serif/ })).toBeChecked();
  await expect(preview).toHaveAttribute("data-font", "serif");

  await page.getByRole("checkbox", { name: "Skills table" }).uncheck();
  await expect(page.getByLabel("Order")).toBeDisabled();
  await page.getByRole("button", { name: "Save design" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Design saved." })).toBeVisible();
});

test("the public page follows the saved design", async () => {
  await page.goto(portfolio(username));
  const root = page.locator(".pf");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(root).toHaveAttribute("data-layout", "grid");
  await expect(root).toHaveCSS("background-color", "rgb(13, 17, 16)");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(
    "rgb(13, 17, 16)",
  );
  expect(await page.locator(".pf-name").evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(
    /Iowan|Palatino|Georgia|serif/,
  );
  await expect(page.locator(".proj-list")).toHaveCSS("display", "grid");
  await expect(page.locator("#skills")).toHaveCount(0);
  await expect(page.getByText("he/him")).toBeVisible();
  await expect(page.getByRole("link", { name: "Résumé" }).first()).toHaveAttribute(
    "href",
    "https://kai.example.com/cv.pdf",
  );
  await expect(page).toHaveTitle("Kai Moreno, data engineer (dbt, Airflow)");
  await expectAccessible(page);
});

test("hostile profile text is shown as text and never runs", async () => {
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  await page.goto(portfolio(username));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("<script>window.__xss=1</script>");
  await expect(page.getByText('<img src=x onerror="window.__xss=2">', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  expect(await page.locator(".pf img").count()).toBe(0);
  expect(dialogs).toEqual([]);
  // The JSON-LD stays valid JSON with the markup escaped.
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).not.toContain("</script");
  expect(() => JSON.parse(jsonLd!)).not.toThrow();
});

const combos = [
  { mode: "Light", font: "Mono", layout: "Compact list", accent: "Amber" },
  { mode: "Dark", font: "Grotesk", layout: "Case studies", accent: "Violet" },
  { mode: "Match device", font: "Serif", layout: "Card grid", accent: "Graphite" },
];

for (const combo of combos) {
  test(`meets WCAG 2.2 AA with ${combo.mode.toLowerCase()} · ${combo.font} · ${combo.layout} · ${combo.accent}`, async () => {
    await saveDesign(page, combo);
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(portfolio(username));
      await expectAccessible(page);
      await page.setViewportSize({ width: 360, height: 780 });
      await expectNoHorizontalScroll(page);
    }
  });
}

test("reset brings back the default design", async () => {
  await page.goto("/dashboard/design");
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect(page.getByText("Design reset to the defaults.")).toBeVisible();
  await page.goto(portfolio(username));
  await expect(page.locator(".pf")).toHaveAttribute("data-layout", "case-study");
  await expect(page.locator(".pf")).not.toHaveAttribute("data-theme", /.+/);
});

test("performance budget: a portfolio is light and fast", async ({ page: fresh }) => {
  // A fresh, signed-out visitor with an empty cache, like a recruiter opening the link.
  const page = fresh;
  await page.goto(portfolio(username), { waitUntil: "load" });
  const stats = await page.evaluate(() => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const kb = (test: RegExp) =>
      resources
        .filter((r) => test.test(new URL(r.name).pathname))
        .reduce((n, r) => n + r.encodedBodySize, 0) / 1024;
    return {
      scriptKb: kb(/\.js$/),
      cssKb: kb(/\.css$/),
      fontKb: kb(/\.woff2?$/),
      htmlKb: nav.encodedBodySize / 1024,
      requests: resources.length,
      images: resources.filter((r) => r.initiatorType === "img").length,
      domContentLoadedMs: nav.domContentLoadedEventEnd,
    };
  });
  // Budgets (compressed bytes) with headroom over today's numbers; raise them only on purpose.
  console.log("portfolio page budget", JSON.stringify(stats));
  expect(stats.scriptKb).toBeLessThan(200);
  expect(stats.cssKb).toBeLessThan(40);
  expect(stats.fontKb).toBeLessThan(160);
  expect(stats.htmlKb).toBeLessThan(40);
  expect(stats.requests).toBeLessThan(30);
  expect(stats.images).toBe(0);
  expect(stats.domContentLoadedMs).toBeLessThan(2000);
});
