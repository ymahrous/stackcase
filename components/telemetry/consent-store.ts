import { type Consent, consentCookie, effectiveConsent, readConsent } from "@/lib/consent";

/**
 * Browser-side consent state for useSyncExternalStore. The server snapshot is "unknown", so server HTML never
 * depends on the visitor and nothing flashes during hydration; the browser then reads the cookie.
 */
export type ConsentState = Consent | "ask" | "unknown";

const listeners = new Set<() => void>();
let settingsOpen = false;

const emit = () => listeners.forEach((listener) => listener());

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConsent(): ConsentState {
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  return effectiveConsent(readConsent(document.cookie), gpc) ?? "ask";
}
export const getServerConsent = (): ConsentState => "unknown";

export const isSettingsOpen = () => settingsOpen;
export const getServerSettingsOpen = () => false;

/** True only after an explicit "Allow". Checked for every analytics event, so withdrawing takes effect at once. */
export function analyticsAllowed(): boolean {
  return readConsent(document.cookie) === "granted";
}

export function chooseConsent(value: Consent) {
  document.cookie = consentCookie(value, window.location.protocol === "https:");
  settingsOpen = false;
  emit();
}

/** Shows the consent panel again, so a choice can be changed as easily as it was made. */
export function openConsentSettings() {
  settingsOpen = true;
  emit();
}
