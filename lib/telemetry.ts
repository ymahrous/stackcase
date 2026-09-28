/**
 * What analytics may see. Vercel Web Analytics and Speed Insights are cookieless and don't store IPs,
 * but the URL of every page view is recorded, so it's cleaned before it leaves the browser:
 * - query strings are dropped except campaign parameters we use (ref, utm_*),
 * - one-time pages (password reset, email confirmation) are not recorded at all, since their links carry secrets.
 */
export const ALLOWED_QUERY_PARAMS = new Set(["ref", "utm_source", "utm_medium", "utm_campaign"]);
export const UNTRACKED_PATHS = ["/reset-password", "/verify-email"];

export function redactUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (UNTRACKED_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null;
  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) if (ALLOWED_QUERY_PARAMS.has(key)) kept.set(key, value);
  url.search = kept.toString();
  url.hash = "";
  return url.toString();
}
