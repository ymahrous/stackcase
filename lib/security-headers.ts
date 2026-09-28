// Standalone (no imports) so next.config.ts can load it.

export interface HeaderOptions {
  /** Development needs eval (React refresh) and websockets (HMR). */
  dev: boolean;
  /** Only an https site can ask browsers to upgrade requests; on http://localhost it would break everything. */
  https: boolean;
}

/**
 * Content Security Policy.
 * - No third-party origins at all: fonts are self-hosted, images and Open Graph cards are same-origin.
 * - Scripts keep 'unsafe-inline' because Next.js inlines its bootstrap scripts; a nonce-based policy would
 *   force every page to render per request and lose static/ISR caching. All user content is rendered as
 *   escaped text (never HTML), and the other directives below close the usual escalation paths.
 * - frame-ancestors, form-action, base-uri and object-src lock down clickjacking, form hijacking,
 *   <base> injection and plugins.
 */
export function contentSecurityPolicy({ dev, https }: HeaderOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Vercel Analytics and Speed Insights load from /_vercel/* on this origin in production;
    // in development they load debug builds from va.vercel-scripts.com.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'", "https://va.vercel-scripts.com"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(dev ? ["ws:", "wss:"] : [])],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (https) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(options: HeaderOptions): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
    },
  ];
}
