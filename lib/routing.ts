import { siteConfig } from "@/lib/site";

export type RouteDecision = { type: "next" } | { type: "redirect"; url: string; status: 301 | 307 | 308 };

export interface RouteInput {
  pathname: string;
  search: string;
  hasSessionCookie: boolean;
}

function startsWithSegment(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Paths a portfolio serves under /<username>. */
const PORTFOLIO_SUBPATHS = "(?:/og|/llms\\.txt)?";
const MIXED_CASE_PORTFOLIO = new RegExp(`^/([A-Za-z0-9-]{3,30})(${PORTFOLIO_SUBPATHS})$`);

/**
 * Decides what the proxy does with a request, from the path alone.
 * Kept free of Next.js types so it can be unit-tested directly.
 */
export function decideRoute({ pathname, search, hasSessionCookie }: RouteInput): RouteDecision {
  // Links from the subdomain era (/sites/alice) and mixed-case usernames (/Alice) get one canonical URL.
  const legacy = /^\/sites\/([^/]+)(\/.*)?$/.exec(pathname);
  if (legacy) {
    return {
      type: "redirect",
      url: `${siteConfig.url}/${legacy[1]!.toLowerCase()}${legacy[2] ?? ""}${search}`,
      status: 308,
    };
  }
  const mixed = MIXED_CASE_PORTFOLIO.exec(pathname);
  if (mixed && /[A-Z]/.test(mixed[1]!)) {
    return {
      type: "redirect",
      url: `${siteConfig.url}/${mixed[1]!.toLowerCase()}${mixed[2] ?? ""}${search}`,
      status: 308,
    };
  }

  if (startsWithSegment(pathname, "/dashboard") && !hasSessionCookie) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return { type: "redirect", url: `${siteConfig.url}/login?next=${next}`, status: 307 };
  }

  return { type: "next" };
}

/**
 * Only allow post-login redirects to paths on this site, never to another origin.
 * Browsers strip tabs and newlines from URLs, so "/\t/evil.com" would become "//evil.com" (another host):
 * any control character, whitespace or backslash is rejected, and the result must resolve to our own origin.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || next.length > 512 || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (/[\u0000-\u0020\u007f\\]/.test(next)) return fallback;
  try {
    const base = new URL(siteConfig.url);
    const resolved = new URL(next, base);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
