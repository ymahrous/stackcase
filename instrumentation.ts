import { registerOTel } from "@vercel/otel";

/**
 * OpenTelemetry for Vercel Observability: every request, Server Action, fetch and render is traced, so slow
 * database calls or emails show up in the Observability tab (and in any trace drain you connect).
 */
export function register() {
  registerOTel({ serviceName: "stackcase" });
}
