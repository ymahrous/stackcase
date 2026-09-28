import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import { log } from "@/lib/log";
import { type EmailEnv, emailEnv, resolveFrom, resolveTransport } from "./config";
import type { RenderedEmail } from "./templates";

export interface OutgoingEmail extends RenderedEmail {
  to: string;
  /** Category for Resend analytics, e.g. "verify-email". Letters, numbers, - and _ only. */
  tag: string;
  /** Resend drops duplicate sends with the same key for 24 hours (e.g. a double-submitted form). */
  idempotencyKey?: string;
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

let client: Resend | null = null;
function resend(key: string) {
  client ??= new Resend(key);
  return client;
}

/**
 * Sends one transactional email. Never throws: account flows must not fail because email is down,
 * so callers get a result to log or surface instead.
 */
export async function sendEmail(email: OutgoingEmail, env: EmailEnv = emailEnv()): Promise<SendResult> {
  const transport = resolveTransport(env);
  const from = resolveFrom(env);
  try {
    switch (transport) {
      case "resend": {
        const { data, error } = await resend(env.RESEND_API_KEY!.trim()).emails.send(
          {
            from,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
            ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
            tags: [{ name: "category", value: email.tag }],
          },
          email.idempotencyKey ? { idempotencyKey: email.idempotencyKey } : undefined,
        );
        if (error || !data) {
          log("error", "email.rejected", { tag: email.tag, reason: error?.message ?? "no response" });
          return { ok: false, error: error?.message ?? "Email provider returned no response." };
        }
        log("info", "email.sent", { tag: email.tag, id: data.id });
        return { ok: true, id: data.id };
      }
      case "file": {
        const dir = env.EMAIL_OUTBOX_DIR!;
        await mkdir(dir, { recursive: true });
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writeFile(join(dir, `${id}.json`), JSON.stringify({ id, from, ...email }, null, 2));
        return { ok: true, id };
      }
      case "console":
        console.info(`[email] ${email.tag} → ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
        return { ok: true, id: "console" };
      default:
        log("warn", "email.skipped", { tag: email.tag, reason: "RESEND_API_KEY is not set" });
        return { ok: false, error: "Email is not configured." };
    }
  } catch (error) {
    log("error", "email.failed", { tag: email.tag, error });
    return { ok: false, error: "Email could not be sent." };
  }
}
