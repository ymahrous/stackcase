import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy({ dev: false, https: true });

  it("allows only this origin and blocks framing, plugins, <base> and foreign form targets", () => {
    for (const d of [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'none'",
      "connect-src 'self'",
    ]) {
      expect(prod).toContain(d);
    }
    expect(prod).not.toMatch(/https?:\/\//);
  });

  it("never allows eval in production and upgrades insecure requests on https", () => {
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).toContain("upgrade-insecure-requests");
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain("upgrade-insecure-requests");
  });

  it("relaxes only what the dev server needs", () => {
    const dev = contentSecurityPolicy({ dev: true, https: false });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
  });
});

describe("securityHeaders", () => {
  it("sets the standard hardening headers", () => {
    const keys = securityHeaders({ dev: false, https: true }).map((h) => h.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Cross-Origin-Opener-Policy",
      "Permissions-Policy",
    ]);
  });
});
