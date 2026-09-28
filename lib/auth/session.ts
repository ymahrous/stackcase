import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";
import {
  generateSessionToken,
  hashSessionToken,
  sessionCookieName,
  sessionExpiry,
  shouldRenewSession,
} from "./tokens";

export const SESSION_COOKIE = sessionCookieName(siteConfig.protocol);

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: siteConfig.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

/**
 * Creates a session row and sets the cookie. Call only from Server Actions or Route Handlers.
 * Any session the browser already carried is deleted first, so a token planted before login
 * (session fixation) never becomes authenticated.
 */
export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE)?.value;
  if (previous) await db.session.deleteMany({ where: { id: hashSessionToken(previous) } });
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await db.session.create({ data: { id: hashSessionToken(token), userId, expiresAt } });
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

/** Ends every session for the user, including this one, and starts a fresh one here (after a password change). */
export async function rotateSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
  await startSession(userId);
}

/** Deletes the current session row and clears the cookie. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashSessionToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  usernameChangedAt: Date | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

/** Resolves the signed-in user once per request. Expired sessions are deleted on sight. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = hashSessionToken(token);
  const session = await db.session.findUnique({
    where: { id },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          usernameChangedAt: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  if (shouldRenewSession(session.expiresAt)) {
    // Server Components cannot set cookies; extend the row and let the next action refresh the cookie.
    await db.session.update({ where: { id }, data: { expiresAt: sessionExpiry() } });
  }
  return session.user;
});

/** For pages and actions that need a signed-in user. Redirects to the login page otherwise. */
export async function requireUser(next = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Re-sets the cookie with a fresh expiry. Called from actions so long-lived sessions keep a valid cookie. */
export async function refreshSessionCookie(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return;
  const session = await db.session.findUnique({
    where: { id: hashSessionToken(token) },
    select: { expiresAt: true },
  });
  if (session) jar.set(SESSION_COOKIE, token, cookieOptions(session.expiresAt));
}
