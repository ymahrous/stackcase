// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("@vercel/analytics/server", () => ({ track }));

const { redactUrl } = await import("@/lib/telemetry");
const { trackEvent } = await import("@/lib/events");
const { GOVERNING_LAW, resolveOperator, legalLinks, MINIMUM_AGE } = await import("@/lib/legal");
const { MARK, markSvg } = await import("@/lib/brand-mark");

describe("redactUrl (analytics privacy)", () => {
  it("drops query strings and fragments except campaign parameters", () => {
    expect(redactUrl("https://s.test/alice?ref=stackcase&email=a%40b.co&utm_source=x#top")).toBe(
      "https://s.test/alice?ref=stackcase&utm_source=x",
    );
    expect(redactUrl("https://s.test/login?next=%2Fdashboard")).toBe("https://s.test/login");
  });
  it("never records pages whose links carry one-time secrets", () => {
    expect(redactUrl("https://s.test/reset-password?token=secret")).toBeNull();
    expect(redactUrl("https://s.test/verify-email?token=secret")).toBeNull();
  });
  it("ignores unparseable input", () => {
    expect(redactUrl("not a url")).toBeNull();
  });
});

describe("trackEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    track.mockReset();
  });
  it("is a no-op outside Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    await trackEvent("signup_completed");
    expect(track).not.toHaveBeenCalled();
  });
  it("sends on Vercel and swallows failures", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    track.mockRejectedValueOnce(new Error("quota"));
    await expect(trackEvent("portfolio_published", { projects: 2 })).resolves.toBeUndefined();
    expect(track).toHaveBeenCalledWith("portfolio_published", { projects: 2 });
  });
});

describe("resolveOperator", () => {
  it("names Stackcase as the operator and is complete once a contact email is set", () => {
    const op = resolveOperator({
      LEGAL_CONTACT_EMAIL: " legal@example.com ",
      LEGAL_BACKUP_RETENTION_DAYS: "7",
    });
    expect(op).toMatchObject({
      name: "Stackcase",
      email: "legal@example.com",
      contactConfigured: true,
      backupRetentionDays: 7,
      complete: true,
    });
    expect(op).not.toHaveProperty("address");
  });
  it("falls back to the reply-to address, then flags the missing contact", () => {
    expect(resolveOperator({ EMAIL_REPLY_TO: "help@example.com" })).toMatchObject({
      email: "help@example.com",
      complete: true,
    });
    const op = resolveOperator({ LEGAL_BACKUP_RETENTION_DAYS: "-3" });
    expect(op).toMatchObject({
      name: "Stackcase",
      contactConfigured: false,
      complete: false,
      backupRetentionDays: 30,
    });
  });
  it("governs the Terms by international contract principles", () => {
    expect(GOVERNING_LAW).toMatch(/UNIDROIT Principles of International Commercial Contracts/);
  });
  it("links all three documents and uses the GDPR digital-consent age", () => {
    expect(legalLinks.map((l) => l.href)).toEqual(["/privacy", "/terms", "/accessibility"]);
    expect(MINIMUM_AGE).toBeGreaterThanOrEqual(16);
  });
});

describe("brand mark", () => {
  it("renders a standalone, titled SVG using the brand colors", () => {
    const svg = markSvg({ size: 64 });
    expect(svg).toMatch(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('width="64"');
    for (const color of Object.values(MARK.colors)) expect(svg.toLowerCase()).toContain(color.toLowerCase());
  });
  it("ships every generated icon and logo file", () => {
    const files = [
      "app/icon.svg",
      "app/apple-icon.png",
      "app/favicon.ico",
      "public/logo.svg",
      "public/logo.png",
    ];
    files.push(
      "public/icon-192.png",
      "public/icon-512.png",
      "public/icon-maskable-512.png",
      "public/email-logo.png",
    );
    for (const f of files) expect(existsSync(join(process.cwd(), f)), f).toBe(true);
    expect(readFileSync(join(process.cwd(), "app/icon.svg"), "utf8").toLowerCase()).toContain(
      MARK.colors.accent.toLowerCase(),
    );
  });
});
