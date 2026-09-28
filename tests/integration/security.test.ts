import { describe, expect, it } from "vitest";
import { logIn } from "@/app/(auth)/actions";
import { changePassword } from "@/app/dashboard/actions";
import { idleState } from "@/lib/action-state";
import { issueEmailToken } from "@/lib/auth/email-tokens";
import { hashSessionToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { consumeRateLimit, peekRateLimit, pruneExpired } from "@/lib/rate-limit";
import { expectRedirect, form, request } from "../setup/request-context";
import { COOKIE, createUser, signInAs } from "./helpers";

const creds = { email: "hal@example.com", password: "hal's long password" };

describe("session fixation", () => {
  it("logging in discards whatever session the browser already carried", async () => {
    const victim = await createUser("hallie", { password: creds.password });
    await db.user.update({ where: { id: victim.id }, data: { email: creds.email } });
    const attacker = await createUser("mallory");
    const planted = await signInAs(attacker.id);
    await expectRedirect(() => logIn(idleState, form(creds)));
    expect(request.cookies.get(COOKIE)).not.toBe(planted);
    expect(await db.session.findUnique({ where: { id: hashSessionToken(planted) } })).toBeNull();
  });

  it("changing the password issues a new session id and ends all others", async () => {
    const user = await createUser("hallie", { password: "old password here", signIn: true });
    const before = request.cookies.get(COOKIE)!;
    await signInAs(user.id);
    request.cookies.set(COOKIE, before);
    await changePassword(idleState, form({ current: "old password here", next: "brand new passphrase" }));
    const after = request.cookies.get(COOKIE)!;
    expect(after).not.toBe(before);
    const sessions = await db.session.findMany({ where: { userId: user.id } });
    expect(sessions.map((s) => s.id)).toEqual([hashSessionToken(after)]);
  });
});

describe("login throttling", () => {
  it("never locks out a user because of their own successful logins", async () => {
    const user = await createUser("hallie", { password: creds.password });
    await db.user.update({ where: { id: user.id }, data: { email: creds.email } });
    for (let i = 0; i < 7; i++) {
      request.ip = `192.0.2.${i + 1}`;
      const out = await logIn(idleState, form(creds)).catch((e) => e);
      expect(out, `attempt ${i + 1}`).toHaveProperty("url", "/dashboard");
    }
  });

  it("locks the email after five failures", async () => {
    const user = await createUser("hallie", { password: creds.password });
    await db.user.update({ where: { id: user.id }, data: { email: creds.email } });
    for (let i = 0; i < 5; i++) {
      request.ip = `192.0.2.${i + 20}`;
      expect((await logIn(idleState, form({ ...creds, password: "wrong one" }))).message).toBe(
        "Email or password is incorrect.",
      );
    }
    request.ip = "192.0.2.99";
    expect((await logIn(idleState, form(creds))).message).toMatch(/too many attempts/i);
  });
});

describe("peekRateLimit", () => {
  it("reads without counting", async () => {
    const rule = { limit: 2, windowSeconds: 60 };
    expect(await peekRateLimit("p:1", rule)).toMatchObject({ ok: true, remaining: 2 });
    await consumeRateLimit("p:1", rule);
    await consumeRateLimit("p:1", rule);
    expect(await peekRateLimit("p:1", rule)).toMatchObject({ ok: false, remaining: 0 });
    expect(await peekRateLimit("p:1", rule)).toMatchObject({ ok: false, remaining: 0 });
  });
});

describe("pruneExpired", () => {
  it("removes stale rate limits, expired sessions and old email links, and nothing else", async () => {
    const user = await createUser("hallie");
    const live = await signInAs(user.id);
    const dead = await signInAs(user.id);
    await db.session.update({
      where: { id: hashSessionToken(dead) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await db.rateLimit.createMany({
      data: [
        { key: "old", count: 1, resetAt: old },
        { key: "fresh", count: 1, resetAt: new Date(Date.now() + 60_000) },
      ],
    });
    const keep = await issueEmailToken(user.id, "VERIFY_EMAIL");
    await issueEmailToken(user.id, "RESET_PASSWORD", old);

    await pruneExpired();

    expect((await db.rateLimit.findMany()).map((r) => r.key)).toEqual(["fresh"]);
    expect((await db.session.findMany()).map((s) => s.id)).toEqual([hashSessionToken(live)]);
    expect((await db.emailToken.findMany()).map((t) => t.id)).toEqual([hashSessionToken(keep)]);
  });
});

describe("security.txt", () => {
  it("sends researchers to GitHub's private vulnerability reporting, never email", async () => {
    const { GET } = await import("@/app/.well-known/security.txt/route");
    const res = GET();
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(
      /^Contact: https:\/\/github\.com\/ymahrous\/stackcase\/security\/advisories\/new\nExpires: \d{4}-/,
    );
    expect(body).toContain("Policy: https://stackcase.test/terms#acceptable-use");
    expect(body).toContain("Canonical: https://stackcase.test/.well-known/security.txt");
    expect(body).not.toContain("mailto:");
  });
});
