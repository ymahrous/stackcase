"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSyncExternalStore } from "react";
import { redactUrl } from "@/lib/telemetry";
import { ConsentBanner } from "./ConsentBanner";
import {
  analyticsAllowed,
  getConsent,
  getServerConsent,
  getServerSettingsOpen,
  isSettingsOpen,
  subscribe,
} from "./consent-store";

/** Drops an event unless the visitor allowed analytics, and cleans its URL (see lib/telemetry.ts). */
function clean<T extends { url: string }>(event: T): T | null {
  if (!analyticsAllowed()) return null;
  const url = redactUrl(event.url);
  return url ? { ...event, url } : null;
}

/**
 * Vercel Web Analytics (page views, referrers) and Speed Insights (Core Web Vitals from real visitors). Both are
 * cookieless and first-party (served from /_vercel/* on the same origin, so they fit the Content Security
 * Policy), and both load only after the visitor allows them in the consent banner. A Global Privacy Control
 * signal counts as a refusal. Every event is checked again before it's sent, so withdrawing consent is immediate.
 */
export function Telemetry() {
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);
  const settingsOpen = useSyncExternalStore(subscribe, isSettingsOpen, getServerSettingsOpen);
  return (
    <>
      {consent === "granted" ? (
        <>
          <Analytics beforeSend={clean} />
          <SpeedInsights beforeSend={clean} />
        </>
      ) : null}
      {consent === "ask" || settingsOpen ? <ConsentBanner reopened={settingsOpen} /> : null}
    </>
  );
}
