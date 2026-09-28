import { createHash, randomBytes } from "node:crypto";

/** 256-bit random session token, sent to the browser in the cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database stores. A leaked sessions table cannot be replayed as cookies. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const SESSION_TTL_DAYS = 30;
/** Sessions used within this many days of expiry are extended by a full TTL. */
export const SESSION_RENEW_WITHIN_DAYS = 15;

const DAY = 24 * 60 * 60 * 1000;

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_DAYS * DAY);
}

export function shouldRenewSession(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() - now.getTime() < SESSION_RENEW_WITHIN_DAYS * DAY;
}

/**
 * The session cookie is host-only on the root domain, so user portfolios on subdomains never receive it.
 * On https the `__Host-` prefix makes the browser enforce Secure, Path=/ and no Domain attribute.
 */
export function sessionCookieName(protocol: string): string {
  return protocol === "https:" ? "__Host-session" : "session";
}
