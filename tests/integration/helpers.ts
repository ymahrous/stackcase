import { hashPassword } from "@/lib/auth/password";
import { hashSessionToken, sessionExpiry } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { request } from "../setup/request-context";

const FAST = { N: 1024, r: 8, p: 1 } as const;
export const COOKIE = "__Host-session";

/** Creates a user with a portfolio directly in the database (fast hash) and optionally signs them in. */
export async function createUser(
  username: string,
  opts: { password?: string; signIn?: boolean; published?: boolean; headline?: string } = {},
) {
  const user = await db.user.create({
    data: {
      username,
      email: `${username}@example.com`,
      passwordHash: await hashPassword(opts.password ?? "a long test password", FAST),
      portfolio: {
        create: {
          displayName: username,
          headline: opts.headline ?? "",
          published: opts.published ?? false,
        },
      },
    },
    include: { portfolio: true },
  });
  if (opts.signIn) await signInAs(user.id);
  return user;
}

export async function signInAs(userId: string) {
  const token = `test-token-${userId}-${Math.random()}`;
  await db.session.create({ data: { id: hashSessionToken(token), userId, expiresAt: sessionExpiry() } });
  request.cookies.set(COOKIE, token);
  return token;
}

export async function addProject(portfolioId: string, name: string, position: number) {
  return db.project.create({ data: { portfolioId, name, position, stack: [], highlights: [] } });
}
