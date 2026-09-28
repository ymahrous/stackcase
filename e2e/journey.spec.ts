import { expect, test, type Page } from "@playwright/test";
import { ORIGIN, expectAccessible, linkIn, portfolio, uniqueName, waitForEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

const username = uniqueName("ada");
const renamed = `${username}-dev`;
const email = `${username}@example.com`;
let password = "purple tractor sings";

async function logIn(page: Page, next = "/dashboard") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/\//g, "\\/").replace(/\?/g, "\\?")}$`));
}

test("claim a username from the landing page and sign up", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").first().fill(username);
  await expect(page.getByText(`✓ localhost:3100/${username} is available`)).toBeVisible();
  await page.getByRole("button", { name: "Claim it" }).click();

  await expect(page).toHaveURL(new RegExp(`/signup\\?username=${username}$`));
  await expect(page.getByLabel("Your address")).toHaveValue(username);
  await expectAccessible(page);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: "Create my portfolio" }).click();
  await expect(page.getByText(/too common/)).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);

  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create my portfolio" }).click();
  await expect(page).toHaveURL(/\/dashboard\?welcome=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Welcome, /);
  await expect(page.getByText("Confirm your email.")).toBeVisible();
});

test("confirm the email from the link that was sent", async ({ page }) => {
  const sent = await waitForEmail(email, "verify-email");
  expect(sent.subject).toBe("Confirm your email for Stackcase");
  await logIn(page);
  await page.goto(linkIn(sent));
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page).toHaveURL(/\/dashboard\?verified=1$/);
  await expect(page.getByText("Email confirmed. Thanks!")).toBeVisible();
  await expect(page.getByText("Confirm your email.")).toHaveCount(0);
});

test("unpublished portfolios are not public", async ({ page, request }) => {
  const res = await page.goto(portfolio(username));
  expect(res?.status()).toBe(404);
  // Crawlers receive metadata in the initial HTML (browsers get it streamed), so check what Googlebot sees.
  const crawler = await request.get(portfolio(username), { headers: { "User-Agent": "Googlebot/2.1" } });
  expect(crawler.status()).toBe(404);
  expect(await crawler.text()).toMatch(/<meta name="robots" content="noindex/);
});

test("fill in the portfolio and publish it", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: "Publish portfolio" }).click();
  await expect(page.locator(".ui-msg.error")).toHaveText(
    "Almost there: Add a headline. Add at least one project.",
  );

  await page.getByRole("link", { name: "Profile" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Ada Quinn");
  await page.getByLabel("Headline").fill("Backend engineer");
  await page.getByLabel("Location").fill("Dublin");
  await page.getByLabel("Intro").fill("I build reliable APIs and the data pipelines behind them.");
  await page.getByLabel("LinkedIn").fill("linkedin.com/in/ada");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: "Design" }).click();
  await page.getByText("Emerald").click();
  await page.getByRole("button", { name: "Save design" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Design saved." })).toBeVisible();

  await page.getByRole("link", { name: "Projects" }).click();
  await page.getByLabel("Project name").fill("Ledger API");
  await page.getByLabel("One-liner").fill("Double-entry bookkeeping as a service");
  await page.getByLabel("Tech stack").fill("Go, Postgres");
  await page.getByLabel("Highlights").fill("Zero duplicate writes\nHandles 2k rps");
  await page.getByLabel("Source code URL").fill("github.com/ada/ledger");
  await page.getByRole("button", { name: "Add project" }).click();
  await expect(page.getByText("Ledger API").first()).toBeVisible();

  await page.getByRole("link", { name: "Skills" }).click();
  await page.getByLabel("Area").fill("Backend");
  await page.getByLabel("Tools").fill("Go, Postgres, Kafka");
  await page.getByRole("button", { name: "Add skill" }).click();
  await expect(page.locator("summary").filter({ hasText: "Backend" })).toBeVisible();

  await page.getByRole("link", { name: "Overview" }).click();
  await page.getByRole("button", { name: "Publish portfolio" }).click();
  await expect(page.getByText("Your portfolio is live.")).toBeVisible();
  await expect(page.getByText("● Live")).toBeVisible();
  await expectAccessible(page);
});

test("the published portfolio is live at /username with full SEO", async ({ page }) => {
  await page.goto(portfolio(username));
  await expect(page).toHaveTitle("Ada Quinn · Backend engineer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ada Quinn");
  await expect(page.getByRole("link", { name: /message on linkedin/i }).first()).toHaveAttribute(
    "href",
    "https://linkedin.com/in/ada",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", portfolio(username));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "profile");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    portfolio(username, "/og"),
  );
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@graph"][0]).toMatchObject({
    "@type": "Person",
    name: "Ada Quinn",
    jobTitle: "Backend engineer",
  });
  await expect(page.locator("[data-accent]")).toHaveAttribute("data-accent", "EMERALD");
  await expect(page.getByRole("link", { name: /made with stackcase/i })).toHaveAttribute(
    "href",
    `${ORIGIN}/?ref=${username}`,
  );
  await expectAccessible(page);

  const llms = await page.goto(portfolio(username, "/llms.txt"));
  expect(await llms!.text()).toContain("# Ada Quinn");
  const og = await page.goto(portfolio(username, "/og"));
  expect(og?.headers()["content-type"]).toBe("image/png");
  const sitemap = await page.goto("/sitemap.xml");
  expect(await sitemap!.text()).toContain(`<loc>${portfolio(username)}</loc>`);
});

test("mixed-case links resolve to the one canonical address", async ({ page }) => {
  await page.goto(`/${username.toUpperCase()}`);
  await expect(page).toHaveURL(portfolio(username));
});

test("download a copy of my data from settings", async ({ page }) => {
  await logIn(page, "/dashboard/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("link", { name: /Download/ })
      .first()
      .click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    new RegExp(`^stackcase-${username}-\\d{4}-\\d{2}-\\d{2}\\.json$`),
  );
  const data = JSON.parse(
    await (await import("node:fs/promises")).readFile((await download.path())!, "utf8"),
  );
  expect(data.account).toMatchObject({ username, email });
  expect(JSON.stringify(data)).not.toMatch(/passwordHash|scrypt/);
});

test("change the username in settings; the old link redirects and an email confirms it", async ({ page }) => {
  await logIn(page, "/dashboard/settings");
  const field = page.getByRole("textbox", { name: "Username" });
  await field.fill("dashboard");
  await expect(page.getByText("That name is reserved. Try another.")).toBeVisible();
  await field.fill(renamed);
  await expect(page.getByText("✓ Available")).toBeVisible();
  await page.getByRole("button", { name: "Change username" }).click();
  await expect(page.getByText(`Your address is now ${renamed}.`)).toBeVisible();
  await expect(page.getByText(/change it again on/)).toBeVisible();
  await expectAccessible(page);

  const notice = await waitForEmail(email, "username-changed");
  expect(notice.subject).toBe(`Your portfolio link is now localhost:3100/${renamed}`);

  await page.goto(portfolio(username));
  await expect(page).toHaveURL(portfolio(renamed));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ada Quinn");
});

test("forgot password: request a link by email and choose a new password", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expectAccessible(page);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If an account uses that email/)).toBeVisible();

  const reset = await waitForEmail(email, "password-reset");
  await page.goto(linkIn(reset));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose a new password");
  await expectAccessible(page);
  password = "a brand new passphrase";
  await page.getByLabel("New password").fill(password);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/dashboard\?reset=1$/);
  await expect(page.getByText("Password changed. You're signed in.")).toBeVisible();
  await waitForEmail(email, "password-changed");

  await page.goto(linkIn(reset));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This link has expired");
});

test("log out, and the dashboard needs a login again", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fprojects$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong password!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator(".ui-msg.error")).toHaveText("Email or password is incorrect.");
});
