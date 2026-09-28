import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { log } from "@/lib/log";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export const limits = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 5, windowSeconds: 15 * 60 },
  signup: { limit: 5, windowSeconds: 60 * 60 },
  usernameCheck: { limit: 60, windowSeconds: 60 },
  sensitive: { limit: 10, windowSeconds: 15 * 60 },
  resetPerIp: { limit: 5, windowSeconds: 15 * 60 },
  resetPerEmail: { limit: 3, windowSeconds: 60 * 60 },
  verifyResend: { limit: 3, windowSeconds: 60 * 60 },
} as const;

/**
 * Fixed-window counter in one atomic statement, so concurrent serverless instances share the same budget.
 * The window resets when `resetAt` has passed.
 */
export async function consumeRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN now() + make_interval(secs => ${windowSeconds})
                       ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0]!;
  const count = Number(row.count);
  if (Math.random() < PRUNE_PROBABILITY) {
    pruneExpired().catch((error) => log("error", "prune.failed", { error }));
  }
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(0, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000)),
  };
}

/** Reads a counter without adding to it, e.g. to block login before checking the password. */
export async function peekRateLimit(
  key: string,
  { limit }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt.getTime() <= Date.now())
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  return {
    ok: row.count < limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
  };
}

/**
 * Deletes rows that can no longer matter: expired rate-limit windows, expired sessions, and email links that
 * are used or expired. Runs on a small fraction of requests, so the tables stay small without a cron job.
 */
export async function pruneExpired(now = new Date()): Promise<void> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await db.$transaction([
    db.rateLimit.deleteMany({ where: { resetAt: { lt: dayAgo } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.emailToken.deleteMany({ where: { OR: [{ expiresAt: { lt: dayAgo } }, { usedAt: { lt: dayAgo } }] } }),
  ]);
}

export const PRUNE_PROBABILITY = 0.01;

/**
 * Best-effort client IP. Vercel sets X-Forwarded-For itself and discards any value the client sent,
 * so the first entry is trustworthy there. Behind another proxy, make sure it does the same.
 */
export function clientIpFrom(h: Headers): string {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

export async function clientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

export function retryMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1
    ? "Too many attempts. Try again in a minute."
    : `Too many attempts. Try again in ${minutes} minutes.`;
}
