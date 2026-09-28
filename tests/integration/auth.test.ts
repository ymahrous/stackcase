import { describe, expect, it } from "vitest";
import { logIn, logOut, signUp } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { verifyPassword } from "@/lib/auth/password";
import { hashSessionToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { LEGAL_VERSION } from "@/lib/legal";
import { expectRedirect, form, request } from "../setup/request-context";
import { COOKIE, createUser } from "./helpers";

const good = {
  email: "New@Example.com",
  password: "purple tractor sings",
  username: "Ada-Lovelace",
  accept: "yes",
};

describe("signUp", () => {
  it("requires agreeing to the Terms and confirming the minimum age", async () => {
    const withoutConsent = form(good);
    withoutConsent.delete("accept");
    const state = await signUp(idleState, withoutConsent);
    expect(state.fieldErrors?.accept).toMatch(/Terms/);
    expect(await db.user.count()).toBe(0);
    const tampered = await signUp(idleState, form({ ...good, accept: "on" }));
    expect(tampered.fieldErrors?.accept).toBeTruthy();
  });

  it("creates the user, an unpublished portfolio and a session, then opens the dashboard", async () => {
    const to = await expectRedirect(() => signUp(idleState, form(good)));
    expect(to).toBe("/dashboard?welcome=1");

    const user = await db.user.findUniqueOrThrow({
      where: { username: "ada-lovelace" },
      include: { portfolio: true },
    });
    expect(user.email).toBe("new@example.com");
    expect(await verifyPassword(good.password, user.passwordHash)).toBe(true);
    expect(user.portfolio).toMatchObject({ displayName: "Ada Lovelace", published: false });
    expect(user.termsVersion).toBe(LEGAL_VERSION);
    expect(user.termsAcceptedAt).toBeInstanceOf(Date);

    const token = request.cookies.get(COOKIE)!;
    expect(token).toBeTruthy();
    expect(request.cookieOptions.get(COOKIE)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    const session = await db.session.findUniqueOrThrow({ where: { id: hashSessionToken(token) } });
    expect(session.userId).toBe(user.id);
  });

  it("rejects weak passwords and echoes the other fields back", async () => {
    const state = await signUp(idleState, form({ ...good, password: "password123" }));
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.password).toMatch(/too common/);
    // The consent box stays ticked, since React resets uncontrolled fields after an action.
    expect(state.values).toEqual({ email: good.email, username: good.username, accept: "yes" });
    expect(await db.user.count()).toBe(0);
  });

  it("rejects passwords that contain the username", async () => {
    const state = await signUp(idleState, form({ ...good, password: "ada-lovelace-rules" }));
    expect(state.fieldErrors?.password).toMatch(/username or email/);
  });

  it("rejects reserved and malformed usernames", async () => {
    expect((await signUp(idleState, form({ ...good, username: "admin" }))).fieldErrors?.username).toMatch(
      /reserved/,
    );
    expect((await signUp(idleState, form({ ...good, username: "-x-" }))).fieldErrors?.username).toMatch(
      /lowercase/,
    );
  });

  it("suggests alternatives when the username is taken", async () => {
    await createUser("ada-lovelace");
    const state = await signUp(idleState, form(good));
    expect(state.fieldErrors?.username).toMatch(
      /taken\. Try ada-lovelace-dev, ada-lovelace-2, ada-lovelace-3\./,
    );
  });

  it("refuses a second account for the same email", async () => {
    await createUser("someone");
    const state = await signUp(idleState, form({ ...good, email: "someone@example.com" }));
    expect(state.fieldErrors?.email).toMatch(/already exists/);
  });

  it("rate-limits sign-ups per IP", async () => {
    request.ip = "198.51.100.7";
    for (let i = 0; i < 5; i++) await signUp(idleState, form({ ...good, password: "short" }));
    const state = await signUp(idleState, form(good));
    expect(state.message).toMatch(/too many attempts/i);
  });
});

describe("logIn", () => {
  it("signs in and follows a safe next path", async () => {
    await createUser("bob", { password: "bob's long password" });
    const to = await expectRedirect(() =>
      logIn(
        idleState,
        form({ email: "BOB@example.com", password: "bob's long password", next: "/dashboard/skills" }),
      ),
    );
    expect(to).toBe("/dashboard/skills");
    expect(request.cookies.get(COOKIE)).toBeTruthy();
  });

  it("ignores next paths that leave the site", async () => {
    await createUser("bob", { password: "bob's long password" });
    const to = await expectRedirect(() =>
      logIn(
        idleState,
        form({ email: "bob@example.com", password: "bob's long password", next: "//evil.example" }),
      ),
    );
    expect(to).toBe("/dashboard");
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await createUser("bob", { password: "bob's long password" });
    const wrong = await logIn(idleState, form({ email: "bob@example.com", password: "nope nope nope" }));
    const unknown = await logIn(idleState, form({ email: "nobody@example.com", password: "nope nope nope" }));
    expect(wrong.message).toBe("Email or password is incorrect.");
    expect(unknown.message).toBe(wrong.message);
    expect(request.cookies.has(COOKIE)).toBe(false);
  });

  it("locks an email after repeated failures, even across IPs", async () => {
    await createUser("bob", { password: "bob's long password" });
    for (let i = 0; i < 5; i++) {
      request.ip = `192.0.2.${i + 10}`;
      await logIn(idleState, form({ email: "bob@example.com", password: "wrong password" }));
    }
    request.ip = "192.0.2.99";
    const state = await logIn(idleState, form({ email: "bob@example.com", password: "bob's long password" }));
    expect(state.message).toMatch(/too many attempts/i);
  });

  it("upgrades weak password hashes on login", async () => {
    const user = await createUser("bob", { password: "bob's long password" });
    expect(user.passwordHash.startsWith("scrypt$1024$")).toBe(true);
    await expectRedirect(() =>
      logIn(idleState, form({ email: "bob@example.com", password: "bob's long password" })),
    );
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.passwordHash.startsWith("scrypt$131072$")).toBe(true);
  });
});

describe("logOut", () => {
  it("deletes the session and clears the cookie", async () => {
    const user = await createUser("carol", { signIn: true });
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
    expect(await expectRedirect(() => logOut())).toBe("/");
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect(request.cookies.has(COOKIE)).toBe(false);
  });
});
