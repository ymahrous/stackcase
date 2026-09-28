import "server-only";
import { db } from "@/lib/db";
import type { EmailTokenType } from "@/lib/generated/prisma/client";
import { generateSessionToken, hashSessionToken } from "./tokens";

export const TOKEN_TTL_MINUTES: Record<EmailTokenType, number> = {
  VERIFY_EMAIL: 24 * 60,
  RESET_PASSWORD: 60,
};

/**
 * Issues a single-use token for an email link. Only its hash is stored, and any earlier unused token of the
 * same type is revoked, so only the newest link works.
 */
export async function issueEmailToken(
  userId: string,
  type: EmailTokenType,
  now = new Date(),
): Promise<string> {
  const token = generateSessionToken();
  await db.$transaction([
    db.emailToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.emailToken.create({
      data: {
        id: hashSessionToken(token),
        userId,
        type,
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MINUTES[type] * 60_000),
      },
    }),
  ]);
  return token;
}

/** Checks a token without using it up, e.g. to decide whether to show the reset form. */
export async function peekEmailToken(
  token: string,
  type: EmailTokenType,
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const row = await db.emailToken.findUnique({ where: { id: hashSessionToken(token) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt <= new Date()) return null;
  return { userId: row.userId };
}

/**
 * Uses a token up. The conditional update makes it atomic: if two requests race with the same link,
 * exactly one of them gets the user id.
 */
export async function consumeEmailToken(
  token: string,
  type: EmailTokenType,
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const id = hashSessionToken(token);
  const { count } = await db.emailToken.updateMany({
    where: { id, type, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count !== 1) return null;
  const row = await db.emailToken.findUnique({ where: { id }, select: { userId: true } });
  return row ? { userId: row.userId } : null;
}
