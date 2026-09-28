import { siteConfig } from "@/lib/site";

export type EmailTransport = "resend" | "file" | "console" | "disabled";

export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  EMAIL_TRANSPORT?: string;
  EMAIL_OUTBOX_DIR?: string;
  NODE_ENV?: string;
}

/**
 * Picks how emails leave the app:
 * - "resend" whenever RESEND_API_KEY is set (production).
 * - "file" when EMAIL_TRANSPORT=file: writes each email as JSON to EMAIL_OUTBOX_DIR (end-to-end tests).
 * - "console" in development: prints the email, links included, to the server log.
 * - "disabled" in production without a key: logs that an email was skipped, never its contents.
 */
export function resolveTransport(env: EmailEnv): EmailTransport {
  if (env.RESEND_API_KEY?.trim()) return "resend";
  if (env.EMAIL_TRANSPORT === "file" && env.EMAIL_OUTBOX_DIR) return "file";
  return env.NODE_ENV === "production" ? "disabled" : "console";
}

/**
 * Sender address. Resend only delivers to other people from a domain you have verified in Resend.
 * The fallback, onboarding@resend.dev, only delivers to the email address that owns the Resend account.
 */
export function resolveFrom(env: EmailEnv): string {
  return env.EMAIL_FROM?.trim() || `${siteConfig.name} <onboarding@resend.dev>`;
}

export function emailEnv(): EmailEnv {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT,
    EMAIL_OUTBOX_DIR: process.env.EMAIL_OUTBOX_DIR,
    NODE_ENV: process.env.NODE_ENV,
  };
}
