// Standalone (no imports) so next.config.ts can load it to validate the environment at build time.

/** Thrown when NEXT_PUBLIC_SITE_URL is missing or not a valid URL. */
export class SiteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteUrlError";
  }
}

/**
 * Normalizes a site origin: adds https:// when the protocol is missing and drops any path or trailing slash.
 * Throws SiteUrlError when the value cannot be parsed as an http(s) URL.
 */
export function normalizeSiteUrl(raw: string): string {
  const value = raw.trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new SiteUrlError(`NEXT_PUBLIC_SITE_URL is not a valid URL: "${raw}".`);
  }
  if (!url.hostname.includes(".") && url.hostname !== "localhost") {
    throw new SiteUrlError(`NEXT_PUBLIC_SITE_URL must include a full domain, got "${raw}".`);
  }
  return url.origin;
}

export interface SiteUrlEnv {
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  PORT?: string;
}

/**
 * Reads the platform origin from NEXT_PUBLIC_SITE_URL, the single source of truth for every absolute URL:
 * the marketing site, canonical tags, sitemaps, Open Graph, JSON-LD and each user's username.<domain> address.
 *
 * Production builds fail when it is missing. In development and tests it falls back to the local dev server.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return normalizeSiteUrl(raw);
  if (env.NODE_ENV === "production") {
    throw new SiteUrlError(
      "NEXT_PUBLIC_SITE_URL is not set. Add it to .env.local, your CI variables, or your host's environment " +
        "settings, e.g. NEXT_PUBLIC_SITE_URL=https://your-domain.com",
    );
  }
  return `http://localhost:${env.PORT || "3000"}`;
}
