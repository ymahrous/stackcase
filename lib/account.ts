import "server-only";
import { db, isUniqueViolation } from "@/lib/db";
import { holdCutoff } from "@/lib/portfolio/queries";
import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  checkUsernameFormat,
  normalizeUsername,
  usernameAlternatives,
  usernameProblemMessages,
} from "@/lib/username";

export type UsernameStatus =
  | { available: true; username: string; message: string }
  | { available: false; username: string; message: string; suggestions: string[] };

async function isFree(username: string, forUserId?: string): Promise<boolean> {
  const [user, redirect] = await Promise.all([
    db.user.findUnique({ where: { username }, select: { id: true } }),
    db.usernameRedirect.findUnique({ where: { username }, select: { userId: true, createdAt: true } }),
  ]);
  if (user && user.id !== forUserId) return false;
  if (redirect && redirect.userId !== forUserId && redirect.createdAt > holdCutoff()) return false;
  return true;
}

/**
 * Whether a username can be claimed. Pass `forUserId` when an existing user is renaming:
 * their current name and names they recently released count as available to them.
 */
export async function getUsernameStatus(input: string, forUserId?: string): Promise<UsernameStatus> {
  const username = normalizeUsername(input);
  const problem = checkUsernameFormat(username);
  if (problem)
    return { available: false, username, message: usernameProblemMessages[problem], suggestions: [] };
  if (await isFree(username, forUserId)) {
    return { available: true, username, message: "Available" };
  }
  const suggestions: string[] = [];
  for (const alt of usernameAlternatives(username, 5)) {
    if (await isFree(alt)) suggestions.push(alt);
    if (suggestions.length === 3) break;
  }
  return { available: false, username, message: "That username is taken.", suggestions };
}

export function nextUsernameChangeAt(changedAt: Date | null): Date | null {
  if (!changedAt) return null;
  return new Date(changedAt.getTime() + USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

export type ChangeUsernameResult =
  { ok: true; previous: string; username: string } | { ok: false; message: string };

/**
 * Renames a user. The old name keeps 301-redirecting to the new one for the hold period and cannot be
 * claimed by anyone else during it. Runs in one transaction; a concurrent claim surfaces as "taken".
 */
export async function changeUsername(
  userId: string,
  input: string,
  now = new Date(),
): Promise<ChangeUsernameResult> {
  const username = normalizeUsername(input);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, usernameChangedAt: true },
  });
  if (!user) return { ok: false, message: "Account not found." };
  if (user.username === username) return { ok: false, message: "That's already your username." };

  const nextAllowed = nextUsernameChangeAt(user.usernameChangedAt);
  if (nextAllowed && nextAllowed > now) {
    return {
      ok: false,
      message: `You can change your username again on ${nextAllowed.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })}.`,
    };
  }

  const status = await getUsernameStatus(username, userId);
  if (!status.available) return { ok: false, message: status.message };

  try {
    await db.$transaction(async (tx) => {
      // Free the new name: an expired hold from someone else, or this user's own earlier name.
      await tx.usernameRedirect.deleteMany({
        where: { username, OR: [{ userId }, { createdAt: { lte: holdCutoff(now) } }] },
      });
      await tx.usernameRedirect.upsert({
        where: { username: user.username },
        create: { username: user.username, userId, createdAt: now },
        update: { userId, createdAt: now },
      });
      await tx.user.update({ where: { id: userId }, data: { username, usernameChangedAt: now } });
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: "That username was just taken. Try another." };
    throw error;
  }
  return { ok: true, previous: user.username, username };
}
