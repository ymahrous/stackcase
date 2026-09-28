import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";
import AuthLayout from "@/app/(auth)/layout";
import SignupPage from "@/app/(auth)/signup/page";
import HomePage, { SOCIAL_PROOF_MIN } from "@/app/(marketing)/page";
import DashboardLayout from "@/app/dashboard/layout";
import DashboardPage from "@/app/dashboard/page";
import PreviewPage from "@/app/dashboard/preview/page";
import ProfilePage from "@/app/dashboard/profile/page";
import ProjectsPage from "@/app/dashboard/projects/page";
import SettingsPage from "@/app/dashboard/settings/page";
import SkillsPage from "@/app/dashboard/skills/page";
import RootLayout from "@/app/layout";
import NotFound from "@/app/not-found";
import PortfolioNotFound from "@/app/[username]/not-found";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";
import { issueEmailToken } from "@/lib/auth/email-tokens";
import { db } from "@/lib/db";
import { expectRedirect } from "../setup/request-context";
import { addProject, createUser } from "./helpers";

const html = (el: ReactElement) => renderToStaticMarkup(el);
const sp = <T extends object>(v: T) => ({ searchParams: Promise.resolve(v) });

describe("marketing page", () => {
  it("renders the claim form, the fictional example and FAQ structured data", async () => {
    const out = html(await HomePage());
    expect(out).toContain('action="/signup"');
    expect(out).toContain("Maya is fictional");
    expect(out).toContain("What is Stackcase?");
    expect(out).toContain("stackcase.test/");
    expect(out).toContain('"@type":"HowTo"');
    expect(out).toContain('"@type":"FAQPage"');
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).not.toContain("portfolios published so far");
  });

  it("shows the published count only once it is meaningful", async () => {
    for (let i = 0; i < SOCIAL_PROOF_MIN; i++) {
      await db.user.create({
        data: {
          username: `user-${i}`,
          email: `u${i}@example.com`,
          passwordHash: "x",
          portfolio: { create: { displayName: "U", published: true } },
        },
      });
    }
    expect(html(await HomePage())).toContain(`${SOCIAL_PROOF_MIN} portfolios published so far`);
  });
});

describe("auth pages", () => {
  it("prefill the claimed username on sign-up", async () => {
    const out = html(<AuthLayout>{await SignupPage(sp({ username: " Kim " }))}</AuthLayout>);
    expect(out).toContain('value="kim"');
    expect(out).toContain("stackcase.test/");
  });
  it("render the password reset request form", () => {
    expect(html(ForgotPasswordPage())).toContain("Send reset link");
  });
  it("show the reset form only for a valid link", async () => {
    const user = await createUser("kim");
    const token = await issueEmailToken(user.id, "RESET_PASSWORD");
    expect(html(await ResetPasswordPage(sp({ token })))).toContain("Save new password");
    expect(html(await ResetPasswordPage(sp({ token: "bogus" })))).toContain("This link has expired");
    expect(html(await ResetPasswordPage(sp({})))).toContain("Send a new link");
  });
  it("ask for a click before confirming an email", async () => {
    const user = await createUser("kim");
    const token = await issueEmailToken(user.id, "VERIFY_EMAIL");
    expect(html(await VerifyEmailPage(sp({ token })))).toContain("Confirm my email");
    expect(html(await VerifyEmailPage(sp({ token: "bogus" })))).toContain("This link has expired");
  });
  it("show a confirmation notice on login and link to password reset", async () => {
    const out = html(await LoginPage(sp({ verified: "1" })));
    expect(out).toContain("Email confirmed");
    expect(out).toContain('href="/forgot-password"');
  });
  it("render the login form with the destination", async () => {
    const out = html(await LoginPage(sp({ next: "/dashboard/skills" })));
    expect(out).toContain('name="next" value="/dashboard/skills"');
  });
  it("send signed-in users to the dashboard", async () => {
    await createUser("kim", { signIn: true });
    expect(await expectRedirect(() => SignupPage(sp({})))).toBe("/dashboard");
    expect(await expectRedirect(() => LoginPage(sp({ next: "//evil" })))).toBe("/dashboard");
  });
});

describe("dashboard pages", () => {
  it("render every tab for a signed-in user", async () => {
    const user = await createUser("kim", { signIn: true, headline: "Engineer" });
    await addProject(user.portfolio!.id, "Alpha", 0);
    await db.skill.create({
      data: { portfolioId: user.portfolio!.id, area: "Backend", tools: "Go", position: 0 },
    });

    const layout = html(await DashboardLayout({ children: <p>child</p> }));
    expect(layout).toContain("stackcase.test/kim · draft");
    expect(layout).toContain("Log out");

    expect(html(await DashboardPage(sp({ verified: "1" })))).toContain("Email confirmed");
    expect(html(await DashboardPage(sp({ reset: "1" })))).toContain("Password changed");
    const overview = html(await DashboardPage(sp({ welcome: "1" })));
    expect(overview).toContain("Welcome, kim");
    expect(overview).toContain("Setup checklist");
    expect(overview).toContain("Publish portfolio");

    expect(html(await ProfilePage())).toContain('name="displayName"');
    const projects = html(await ProjectsPage());
    expect(projects).toContain("Alpha");
    expect(projects).toContain("Add a project");
    expect(html(await SkillsPage())).toContain("Backend");
    const settings = html(await SettingsPage());
    expect(settings).toContain("Change username");
    expect(settings).toContain("Delete account and portfolio");
    expect(settings).toContain("Cookies and analytics");
    expect(settings).toContain("doesn&#x27;t collect analytics");
    expect(settings).not.toContain('name="analyticsConsent"');
    vi.stubEnv("VERCEL", "1");
    const onVercel = html(await SettingsPage());
    vi.unstubAllEnvs();
    // The choice lives in the browser, so the server renders the switch disabled until it hydrates.
    expect(onVercel).toMatch(/<input(?=[^>]*name="analyticsConsent")(?=[^>]*disabled)[^>]*>/);
    expect(onVercel).toContain('href="/privacy#cookies"');
    const preview = html(await PreviewPage());
    expect(preview).toContain("not published yet");
    expect(preview).not.toContain("<main");
  });

  it("show the cooldown after a username change", async () => {
    const user = await createUser("kim", { signIn: true });
    await db.user.update({ where: { id: user.id }, data: { usernameChangedAt: new Date() } });
    expect(html(await SettingsPage())).toMatch(/You can change it again on/);
  });

  it("show a live address once published", async () => {
    const user = await createUser("kim", { signIn: true, headline: "Engineer", published: true });
    await addProject(user.portfolio!.id, "Alpha", 0);
    const out = html(await DashboardPage(sp({})));
    expect(out).toContain("● Live");
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    const live = html(await DashboardLayout({ children: null }));
    expect(live).toContain('href="https://stackcase.test/kim"');
    expect(live).not.toContain("Confirm your email.");
    expect(out).toContain("Unpublish");
  });

  it("redirect signed-out visitors", async () => {
    expect(await expectRedirect(() => DashboardLayout({ children: null }))).toBe("/login?next=%2Fdashboard");
  });
});

describe("layouts and 404s", () => {
  it("root layout sets the language and a skip link", () => {
    const out = html(RootLayout({ children: <main id="main" /> }));
    expect(out).toContain('<html lang="en">');
    expect(out).toContain('href="#main"');
  });
  it("404 pages point somewhere useful", () => {
    expect(html(NotFound())).toContain('href="/"');
    expect(html(PortfolioNotFound())).toContain("https://stackcase.test/signup");
  });
});
