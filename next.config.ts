import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { securityHeaders } from "./lib/security-headers";
import { resolveSiteUrl } from "./lib/site-url";

export default function config(phase: string): NextConfig {
  // Fail the build up front, with a clear message, when the site URL is missing or invalid.
  if (phase === PHASE_PRODUCTION_BUILD) {
    resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NODE_ENV: "production" });
  }
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  const https = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().startsWith("https://");
  const headers = securityHeaders({ dev, https });

  return {
    reactStrictMode: true,
    poweredByHeader: false,
    images: { formats: ["image/avif", "image/webp"] },
    // Server Actions reject bodies over 1 MB; forms here are far smaller.
    experimental: { serverActions: { bodySizeLimit: "256kb" } },
    async headers() {
      return [{ source: "/:path*", headers }];
    },
  };
}
