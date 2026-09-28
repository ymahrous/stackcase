import { describe, expect, it } from "vitest";
import { decideRoute, safeNextPath } from "@/lib/routing";

const base = { search: "", hasSessionCookie: false };

describe("decideRoute", () => {
  it("lets portfolio and public paths through", () => {
    for (const pathname of ["/", "/alice", "/alice/og", "/alice/llms.txt", "/signup", "/robots.txt"]) {
      expect(decideRoute({ ...base, pathname })).toEqual({ type: "next" });
    }
  });

  it("redirects links from the subdomain era (/sites/alice) to /alice", () => {
    expect(decideRoute({ ...base, pathname: "/sites/Alice", search: "?x=1" })).toEqual({
      type: "redirect",
      url: "https://stackcase.test/alice?x=1",
      status: 308,
    });
    expect(decideRoute({ ...base, pathname: "/sites/alice/og" })).toMatchObject({
      url: "https://stackcase.test/alice/og",
    });
  });

  it("lowercases mixed-case usernames so each portfolio has one URL", () => {
    expect(decideRoute({ ...base, pathname: "/Alice" })).toEqual({
      type: "redirect",
      url: "https://stackcase.test/alice",
      status: 308,
    });
    expect(decideRoute({ ...base, pathname: "/Alice-Dev/llms.txt" })).toMatchObject({
      url: "https://stackcase.test/alice-dev/llms.txt",
    });
    expect(decideRoute({ ...base, pathname: "/Alice/other" })).toEqual({ type: "next" });
  });

  it("sends signed-out visitors from the dashboard to login, keeping their destination", () => {
    expect(decideRoute({ ...base, pathname: "/dashboard/skills", search: "?a=1" })).toEqual({
      type: "redirect",
      url: "https://stackcase.test/login?next=%2Fdashboard%2Fskills%3Fa%3D1",
      status: 307,
    });
    expect(decideRoute({ ...base, pathname: "/dashboard", hasSessionCookie: true })).toEqual({
      type: "next",
    });
  });
});

describe("safeNextPath", () => {
  it("allows same-site paths only", () => {
    expect(safeNextPath("/dashboard/skills")).toBe("/dashboard/skills");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("", "/x")).toBe("/x");
  });

  it("rejects tricks that browsers turn into another host", () => {
    for (const evil of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r\n/evil.com",
      "/ /evil.com",
      "/\u0000/evil.com",
      "/%09/evil.com/../",
    ]) {
      const out = safeNextPath(evil);
      expect(
        out === "/dashboard" || (out.startsWith("/") && !out.startsWith("//")),
        JSON.stringify(evil),
      ).toBe(true);
      expect(new URL(out, "https://stackcase.test").origin).toBe("https://stackcase.test");
    }
    expect(safeNextPath("/\t/evil.com")).toBe("/dashboard");
    expect(safeNextPath("/" + "a".repeat(600))).toBe("/dashboard");
    expect(safeNextPath("/dashboard/projects?tab=1#x")).toBe("/dashboard/projects?tab=1#x");
  });
});
