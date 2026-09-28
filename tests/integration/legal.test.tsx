import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessibilityPage from "@/app/(legal)/accessibility/page";
import LegalLayout from "@/app/(legal)/layout";
import PrivacyPage from "@/app/(legal)/privacy/page";
import TermsPage from "@/app/(legal)/terms/page";
import { GET as exportData } from "@/app/dashboard/export/route";
import { db } from "@/lib/db";
import { addProject, createUser } from "./helpers";

const html = (el: ReactElement) => renderToStaticMarkup(el);
const pages = { privacy: PrivacyPage, terms: TermsPage, accessibility: AccessibilityPage };

describe("legal pages", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(Object.entries(pages))("/%s has one h1, a table of contents and breadcrumb data", (_name, Page) => {
    const out = html(<Page />);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('"@type":"BreadcrumbList"');
    expect(out).toContain("September 2026");
    const anchors = [...out.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]!);
    expect(anchors.length).toBeGreaterThan(3);
    for (const id of anchors) expect(out, id).toContain(`id="${id}"`);
  });

  it.each(Object.entries(pages))("/%s sends people to GitHub, never to an email address", (_name, Page) => {
    const out = html(<Page />);
    expect(out).not.toContain("mailto:");
    expect(out).not.toMatch(/Contact details are incomplete|representative \(|Post:/);
    expect(out).toContain('href="https://github.com/ymahrous/stackcase/issues/new"');
    expect(out).toContain('href="https://github.com/ymahrous/stackcase/security/advisories/new"');
    expect(out).toContain("GitHub issues are public.");
  });

  it("names Stackcase as operator under one worldwide policy and international governing law", () => {
    const privacy = html(<PrivacyPage />);
    expect(privacy).toContain("<b>Stackcase</b>");
    expect(privacy).toContain("isn&#x27;t directed at any particular country");
    expect(privacy).toContain("Wherever you live");
    expect(privacy).not.toMatch(/Egypt|Art\. 27|UK representative|EU representative/);
    for (const text of ["Vercel", "Resend", "GitHub, Inc.", "analytics_consent", "Global Privacy Control"])
      expect(privacy).toContain(text);
    expect(privacy).toContain("Analytics only run if you allow them.");
    const terms = html(<TermsPage />);
    expect(terms).toContain("agreement between you and Stackcase");
    expect(terms).toContain("UNIDROIT Principles of International Commercial Contracts");
    expect(terms).toContain("mandatory laws of the country where you live");
    expect(terms).toContain("no single country&#x27;s law is");
    expect(terms).not.toMatch(/Regulation 1215\/2012|Rome I|Digital Services Act/);
    expect(html(<AccessibilityPage />)).toContain("WCAG");
  });

  it("the layout links every legal document from the footer", () => {
    const out = html(<LegalLayout>content</LegalLayout>);
    for (const href of ["/privacy", "/terms", "/accessibility"]) expect(out).toContain(`href="${href}"`);
    expect(out).toContain(`© ${new Date().getFullYear()} Stackcase. All rights reserved.`);
  });
});

describe("GET /dashboard/export", () => {
  it("refuses anonymous requests", async () => {
    const res = await exportData();
    expect(res.status).toBe(401);
  });

  it("downloads the signed-in user's data without secrets", async () => {
    const user = await createUser("grace", { signIn: true, published: true });
    await addProject(user.portfolio!.id, "Compiler", 0);
    const res = await exportData();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="stackcase-grace-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(res.headers.get("cache-control")).toContain("no-store");
    const body = await res.text();
    const data = JSON.parse(body);
    expect(data.account).toMatchObject({ username: "grace", email: "grace@example.com" });
    expect(data.account.portfolio.projects.map((p: { name: string }) => p.name)).toEqual(["Compiler"]);
    expect(data.activeSessions).toHaveLength(1);
    const stored = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(body).not.toContain(stored.passwordHash);
    expect(body).not.toMatch(/passwordHash|"id":\s*"[0-9a-f]{64}"/);
  });

  it("is rate limited", async () => {
    await createUser("hopper", { signIn: true });
    let last = 200;
    for (let i = 0; i < 12; i++) last = (await exportData()).status;
    expect(last).toBe(429);
  });
});
