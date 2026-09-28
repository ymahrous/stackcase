import "server-only";
import { track } from "@vercel/analytics/server";
import { log } from "@/lib/log";

/** Product events for conversion funnels in Vercel Web Analytics. Properties never include personal data. */
export type ProductEvent =
  "signup_completed" | "email_confirmed" | "portfolio_published" | "username_changed" | "account_deleted";

/**
 * Records a server-side custom event. Custom events show in Vercel Web Analytics on plans that include them;
 * elsewhere (local, tests, other hosts) this is a no-op. Failures are logged and never affect the user.
 */
export async function trackEvent(
  event: ProductEvent,
  properties: Record<string, string | number | boolean> = {},
) {
  if (!process.env.VERCEL) return;
  try {
    await track(event, properties);
  } catch (error) {
    log("warn", "analytics.track_failed", { name: event, error });
  }
}
