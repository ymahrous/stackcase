"use client";

import { useSyncExternalStore } from "react";
import { chooseConsent, getConsent, getServerConsent, subscribe } from "./consent-store";

/**
 * The analytics consent choice as a switch in Settings. Shares the store with the banner, so a change here
 * takes effect immediately (analytics load or stop) and the banner won't ask again.
 */
export function AnalyticsConsentToggle() {
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);
  const on = consent === "granted";
  return (
    <div className="ui-checks">
      <label className="ui-check">
        <input
          type="checkbox"
          name="analyticsConsent"
          checked={on}
          // The choice lives in this browser, so it's unknown until the page runs here.
          disabled={consent === "unknown"}
          onChange={(ev) => chooseConsent(ev.target.checked ? "granted" : "denied")}
        />
        <span>Allow anonymous analytics (Vercel Web Analytics and Speed Insights)</span>
      </label>
      <p className="ui-hint" role="status">
        {consent === "unknown"
          ? null
          : on
            ? "Analytics are on in this browser."
            : "Analytics are off in this browser."}
      </p>
    </div>
  );
}
