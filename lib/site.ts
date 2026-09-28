import { brand } from "@/lib/brand";

export { SiteUrlError, normalizeSiteUrl, resolveSiteUrl, type SiteUrlEnv } from "./site-url";
import { resolveSiteUrl } from "./site-url";

// Read each variable by its literal name so Next.js can inline NEXT_PUBLIC_* values.
const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
});
const parsed = new URL(siteUrl);

export const siteConfig = {
  /** Origin of the whole app: marketing site, dashboard and every portfolio, e.g. https://stackcase.vercel.app */
  url: siteUrl,
  /** Host without protocol, for display: stackcase.vercel.app */
  host: parsed.host,
  protocol: parsed.protocol,
  /** Brand name. NEXT_PUBLIC_APP_NAME overrides it, e.g. for a white-label deployment. */
  name: process.env.NEXT_PUBLIC_APP_NAME?.trim() || brand.name,
  locale: "en_US",
  themeColor: { light: "#F5F6F3", dark: "#0D1110" },
} as const;

/** Resolves a path against the site origin. */
export function absoluteUrl(path = "/", base: string = siteConfig.url): string {
  return new URL(path, `${base}/`).toString();
}

/**
 * Public address of a user's portfolio: https://stackcase.vercel.app/alice
 * Portfolios live under a path, not a subdomain: *.vercel.app addresses can't have wildcard subdomains,
 * and one host keeps the sitemap, cookies and certificates simple.
 */
export function portfolioUrl(username: string, path = "/"): string {
  const base = `${siteConfig.url}/${username}`;
  return path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The portfolio address for display, without protocol: stackcase.vercel.app/alice */
export function portfolioAddress(username: string): string {
  return `${siteConfig.host}/${username}`;
}
