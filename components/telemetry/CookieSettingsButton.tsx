"use client";

import { openConsentSettings } from "./consent-store";

/** Reopens the analytics consent panel. Rendered only where analytics run (see SiteFooter). */
export function CookieSettingsButton() {
  return (
    <button type="button" className="linklike" onClick={openConsentSettings}>
      Cookie settings
    </button>
  );
}
