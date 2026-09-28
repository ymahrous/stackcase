/**
 * Analytics consent. Vercel Web Analytics and Speed Insights load only after a visitor allows them; the choice is
 * kept in a first-party cookie so we don't ask on every page. The session cookie is strictly necessary and
 * needs no consent. Pure functions, safe in the browser and in tests.
 */
export type Consent = "granted" | "denied";

export const CONSENT_COOKIE = "analytics_consent";
/** How long a choice is remembered before we ask again (about six months). */
export const CONSENT_MAX_AGE_DAYS = 180;

/** Reads the stored choice from a `document.cookie` string. Anything unexpected counts as no choice. */
export function readConsent(cookies: string): Consent | null {
  for (const part of cookies.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === CONSENT_COOKIE && (value === "granted" || value === "denied")) return value;
  }
  return null;
}

/** The `document.cookie` assignment that stores a choice. Secure on https, readable site-wide. */
export function consentCookie(value: Consent, secure: boolean): string {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/**
 * The effective choice. An explicit choice wins; otherwise a Global Privacy Control signal counts as a refusal,
 * and without either we still have to ask (null).
 */
export function effectiveConsent(stored: Consent | null, globalPrivacyControl: boolean): Consent | null {
  return stored ?? (globalPrivacyControl ? "denied" : null);
}
