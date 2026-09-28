import { siteConfig } from "@/lib/site";

export type EmailTransport = "resend" | "file" | "console" | "disabled";

export interface EmailEnv {
  RESEND_API_KEY?: string;
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
 * Resend's shared test sender. Stackcase always sends from it, so no domain has to be verified.
 * Limitation: Resend delivers mail from this address only to the email address that owns the Resend account,
 * and rejects every other recipient with a 403 ("You can only send testing emails to your own email address").
 * Delivering to all users needs a domain verified in Resend and a sender on it.
 */
export const EMAIL_SENDER = "onboarding@resend.dev";

export function resolveFrom(): string {
  return `${siteConfig.name} <${EMAIL_SENDER}>`;
}

export function emailEnv(): EmailEnv {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT,
    EMAIL_OUTBOX_DIR: process.env.EMAIL_OUTBOX_DIR,
    NODE_ENV: process.env.NODE_ENV,
  };
}
