import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { afterEach, describe, expect, it, vi } from "vitest";
import manifest from "@/app/manifest";
import { metadata } from "@/app/layout";
import robots, { AI_CRAWLERS, PRIVATE_PATHS } from "@/app/robots";
import { db } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import config from "@/next.config";

describe("database constraints", () => {
  it("reject malformed usernames and mixed-case emails even when the app is bypassed", async () => {
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "User"(id,email,"passwordHash",username,"updatedAt") VALUES ('x','a@b.co','h','Bad_Name',now())`,
      ),
    ).rejects.toThrow(/User_username_format/);
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "User"(id,email,"passwordHash",username,"updatedAt") VALUES ('x','A@b.co','h','good',now())`,
      ),
    ).rejects.toThrow(/User_email_lowercase/);
  });
});

describe("consumeRateLimit", () => {
  it("counts within the window and resets after it", async () => {
    const rule = { limit: 2, windowSeconds: 60 };
    expect(await consumeRateLimit("t:1", rule)).toMatchObject({ ok: true, remaining: 1 });
    expect(await consumeRateLimit("t:1", rule)).toMatchObject({ ok: true, remaining: 0 });
    const blocked = await consumeRateLimit("t:1", rule);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(50);
    await db.rateLimit.update({ where: { key: "t:1" }, data: { resetAt: new Date(Date.now() - 1) } });
    expect(await consumeRateLimit("t:1", rule)).toMatchObject({ ok: true, remaining: 1 });
  });

  it("is atomic under concurrency", async () => {
    const rule = { limit: 5, windowSeconds: 60 };
    const results = await Promise.all(Array.from({ length: 12 }, () => consumeRateLimit("t:burst", rule)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });
});

describe("root SEO files", () => {
  it("robots.txt keeps private areas out and names AI crawlers explicitly", () => {
    const r = robots();
    expect(r.sitemap).toBe("https://stackcase.test/sitemap.xml");
    const rules = r.rules as { userAgent: string | string[]; allow: string; disallow: string[] }[];
    expect(rules[0]).toEqual({ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS });
    expect(rules[1]!.userAgent).toEqual([...AI_CRAWLERS]);
    expect(PRIVATE_PATHS).toEqual(expect.arrayContaining(["/dashboard", "/reset-password", "/verify-email"]));
  });
  it("metadata uses the Stackcase name, description and social image", () => {
    expect(String(metadata.metadataBase)).toBe("https://stackcase.test/");
    expect(metadata.title).toMatchObject({
      default: "Stackcase: free portfolio builder for software engineers",
    });
    expect(metadata.openGraph).toMatchObject({
      siteName: "Stackcase",
      images: [{ url: "https://stackcase.test/og" }],
    });
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(metadata.keywords).toContain("developer portfolio builder");
  });
  it("manifest opens the dashboard", () => {
    const m = manifest();
    expect(m).toMatchObject({ start_url: "/dashboard", short_name: "Stackcase" });
    expect(m.name).toMatch(/^Stackcase: /);
    const icons = m.icons!.map((i) => `${i.src} ${i.sizes ?? ""} ${i.purpose ?? "any"}`);
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\/icon-192\.png 192x192/),
        expect.stringMatching(/^\/icon-512\.png 512x512/),
        expect.stringMatching(/maskable$/),
      ]),
    );
  });
});

describe("next.config", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("fails production builds without NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });
  it("builds with it and sends security headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://folio.dev");
    expect(config(PHASE_PRODUCTION_BUILD).poweredByHeader).toBe(false);
    const headers = await config(PHASE_DEVELOPMENT_SERVER).headers!();
    expect(headers[0]!.headers.map((h) => h.key)).toContain("Strict-Transport-Security");
  });
});
