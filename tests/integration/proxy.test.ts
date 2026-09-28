import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function req(url: string, host: string, cookie?: string) {
  const headers = new Headers({ host });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(url, { headers });
}

describe("proxy", () => {
  it("passes portfolio paths through untouched", () => {
    const res = proxy(req("https://stackcase.test/alice", "stackcase.test"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects signed-out dashboard visits and lets signed-in ones through", () => {
    const out = proxy(req("https://stackcase.test/dashboard", "stackcase.test"));
    expect(out.status).toBe(307);
    expect(out.headers.get("location")).toBe("https://stackcase.test/login?next=%2Fdashboard");
    for (const cookie of ["__Host-session=abc", "session=abc"]) {
      expect(
        proxy(req("https://stackcase.test/dashboard", "stackcase.test", cookie)).headers.get(
          "x-middleware-next",
        ),
      ).toBe("1");
    }
  });

  it("canonicalizes old /sites links and mixed-case usernames", () => {
    const legacy = proxy(req("https://stackcase.test/sites/alice", "stackcase.test"));
    expect(legacy.status).toBe(308);
    expect(legacy.headers.get("location")).toBe("https://stackcase.test/alice");
    expect(proxy(req("https://stackcase.test/Alice", "stackcase.test")).headers.get("location")).toBe(
      "https://stackcase.test/alice",
    );
  });

  it("skips static assets", () => {
    const [pattern] = config.matcher;
    const re = new RegExp(`^${pattern}$`);
    expect(re.test("/_next/static/chunk.js")).toBe(false);
    expect(re.test("/logo.png")).toBe(false);
    expect(re.test("/dashboard")).toBe(true);
    expect(re.test("/")).toBe(true);
  });
});
