import { describe, expect, it } from "vitest";
import { getCurrentUser, refreshSessionCookie, requireUser } from "@/lib/auth/session";
import { hashSessionToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { expectRedirect, request } from "../setup/request-context";
import { COOKIE, createUser, signInAs } from "./helpers";

describe("sessions", () => {
  it("resolves the signed-in user", async () => {
    const user = await createUser("dave", { signIn: true });
    expect((await getCurrentUser())?.id).toBe(user.id);
  });

  it("returns null without a cookie or with an unknown token", async () => {
    expect(await getCurrentUser()).toBeNull();
    request.cookies.set(COOKIE, "forged");
    expect(await getCurrentUser()).toBeNull();
  });

  it("deletes expired sessions on sight", async () => {
    const user = await createUser("dave");
    const token = await signInAs(user.id);
    await db.session.update({
      where: { id: hashSessionToken(token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await getCurrentUser()).toBeNull();
    expect(await db.session.count()).toBe(0);
  });

  it("extends sessions that are close to expiring", async () => {
    const user = await createUser("dave");
    const token = await signInAs(user.id);
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await db.session.update({ where: { id: hashSessionToken(token) }, data: { expiresAt: soon } });
    await getCurrentUser();
    const s = await db.session.findUniqueOrThrow({ where: { id: hashSessionToken(token) } });
    expect(s.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    await refreshSessionCookie();
    expect(request.cookieOptions.get(COOKIE)?.expires?.getTime()).toBe(s.expiresAt.getTime());
  });

  it("requireUser redirects to login with the destination", async () => {
    expect(await expectRedirect(() => requireUser("/dashboard/skills"))).toBe(
      "/login?next=%2Fdashboard%2Fskills",
    );
  });
});
