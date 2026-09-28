"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactUrl } from "@/lib/telemetry";

/**
 * Vercel Web Analytics (page views, referrers, custom events) and Speed Insights (Core Web Vitals from real
 * visitors). Both are cookieless and first-party (served from /_vercel/* on the same origin), so they need no
 * consent banner and fit the Content Security Policy. URLs are cleaned before sending (see lib/telemetry.ts).
 */
export function Telemetry() {
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          const url = redactUrl(event.url);
          return url ? { ...event, url } : null;
        }}
      />
      <SpeedInsights
        beforeSend={(data) => {
          const url = redactUrl(data.url);
          return url ? { ...data, url } : null;
        }}
      />
    </>
  );
}
