import { describe, expect, it } from "vitest";
import {
  SiteUrlError,
  absoluteUrl,
  normalizeSiteUrl,
  portfolioAddress,
  portfolioUrl,
  resolveSiteUrl,
  siteConfig,
} from "@/lib/site";

describe("normalizeSiteUrl", () => {
  it("adds https:// and strips paths and trailing slashes", () => {
    expect(normalizeSiteUrl("stackcase.vercel.app")).toBe("https://stackcase.vercel.app");
    expect(normalizeSiteUrl(" https://stackcase.vercel.app/about/ ")).toBe("https://stackcase.vercel.app");
  });
  it("keeps http and ports for local development", () => {
    expect(normalizeSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });
  it("rejects invalid values and bare hostnames", () => {
    expect(() => normalizeSiteUrl("https://exa mple.com")).toThrow(SiteUrlError);
    expect(() => normalizeSiteUrl("portfolio")).toThrow(/full domain/);
  });
});

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "stackcase.vercel.app/", NODE_ENV: "production" })).toBe(
      "https://stackcase.vercel.app",
    );
  });
  it("fails production builds without it", () => {
    expect(() => resolveSiteUrl({ NODE_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });
  it("falls back to localhost in development", () => {
    expect(resolveSiteUrl({ NODE_ENV: "development", PORT: "4000" })).toBe("http://localhost:4000");
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});

describe("siteConfig", () => {
  it("reads the origin from NEXT_PUBLIC_SITE_URL and uses the Stackcase brand", () => {
    expect(siteConfig.url).toBe("https://stackcase.test");
    expect(siteConfig.host).toBe("stackcase.test");
    expect(siteConfig.name).toBe("Stackcase");
  });
});

describe("portfolio addresses", () => {
  it("put the username in the path", () => {
    expect(portfolioUrl("alice")).toBe("https://stackcase.test/alice");
    expect(portfolioUrl("alice", "/og")).toBe("https://stackcase.test/alice/og");
    expect(portfolioUrl("alice", "llms.txt")).toBe("https://stackcase.test/alice/llms.txt");
    expect(portfolioAddress("alice")).toBe("stackcase.test/alice");
    expect(absoluteUrl("/signup")).toBe("https://stackcase.test/signup");
  });
});
