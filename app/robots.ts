import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

/** Private areas every crawler should skip. Portfolios (/<username>) and the landing page are public. */
export const PRIVATE_PATHS = [
  "/dashboard",
  "/api/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * AI search and assistant crawlers are named explicitly so it's unambiguous they're welcome:
 * being citable by assistants is part of how portfolios and the product get found (GEO).
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
