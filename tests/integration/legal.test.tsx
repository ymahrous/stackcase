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
    expect(out).toContain("28 September 2026");
    const anchors = [...out.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]!);
    expect(anchors.length).toBeGreaterThan(3);
    for (const id of anchors) expect(out, id).toContain(`id="${id}"`);
  });

  it("warns the operator while no contact email is configured", () => {
    vi.stubEnv("LEGAL_CONTACT_EMAIL", "");
    vi.stubEnv("EMAIL_REPLY_TO", "");
    expect(html(<PrivacyPage />)).toMatch(/Contact details are incomplete/);
  });

  it("names Stackcase as operator, with international governing law and no postal address", () => {
    vi.stubEnv("LEGAL_CONTACT_EMAIL", "privacy@example.com");
    const privacy = html(<PrivacyPage />);
    expect(privacy).toContain("<b>Stackcase</b>");
    expect(privacy).toContain("mailto:privacy@example.com");
    expect(privacy).not.toMatch(/Contact details are incomplete|Post:/);
    for (const text of ["Vercel", "Resend", "GDPR", "CCPA", "LGPD", "PIPEDA"])
      expect(privacy).toContain(text);
    const terms = html(<TermsPage />);
    expect(terms).toContain("agreement between you and Stackcase");
    expect(terms).toContain("UNIDROIT Principles of International Commercial Contracts");
    expect(terms).toContain("mandatory laws of the country where you live");
    expect(terms).toContain("Digital Services Act");
    expect(terms).toContain("512(g)");
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
