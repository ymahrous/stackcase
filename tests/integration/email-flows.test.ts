import { describe, expect, it } from "vitest";
import { confirmEmail, requestPasswordReset, resetPassword, signUp } from "@/app/(auth)/actions";
import { changePassword, deleteAccount, resendVerification, updateUsername } from "@/app/dashboard/actions";
import { idleState } from "@/lib/action-state";
import { consumeEmailToken, issueEmailToken, peekEmailToken } from "@/lib/auth/email-tokens";
import { RESET_SENT } from "@/lib/auth/messages";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { expectRedirect, flushAfter, form, lastLink, outbox, request } from "../setup/request-context";
import { COOKIE, createUser, signInAs } from "./helpers";

const tokenFrom = (url: string) => new URL(url).searchParams.get("token")!;

describe("email confirmation", () => {
  it("sign-up sends a confirmation link that confirms the address after a click", async () => {
    await expectRedirect(() =>
      signUp(
        idleState,
        form({ email: "ada@example.com", password: "purple tractor sings", username: "ada", accept: "yes" }),
      ),
    );
    await flushAfter();
    expect(outbox.map((e) => [e.tag, e.to])).toEqual([["verify-email", "ada@example.com"]]);
    const link = lastLink("verify-email");
    expect(link).toMatch(/^https:\/\/stackcase\.test\/verify-email\?token=/);

    const to = await expectRedirect(() => confirmEmail(idleState, form({ token: tokenFrom(link) })));
    expect(to).toBe("/dashboard?verified=1");
    expect((await db.user.findUniqueOrThrow({ where: { username: "ada" } })).emailVerifiedAt).not.toBeNull();

    const again = await confirmEmail(idleState, form({ token: tokenFrom(link) }));
    expect(again.message).toMatch(/expired or was already used/);
  });

  it("sends signed-out users to login after confirming", async () => {
    const user = await createUser("bobby");
    const token = await issueEmailToken(user.id, "VERIFY_EMAIL");
    expect(await expectRedirect(() => confirmEmail(idleState, form({ token })))).toBe("/login?verified=1");
  });

  it("resending revokes the old link and is rate limited", async () => {
    await createUser("cyrus", { signIn: true });
    expect((await resendVerification()).message).toBe("Sent. Check cyrus@example.com for the link.");
    const first = tokenFrom(lastLink("verify-email"));
    await resendVerification();
    const second = tokenFrom(lastLink("verify-email"));
    expect(await peekEmailToken(first, "VERIFY_EMAIL")).toBeNull();
    expect(await peekEmailToken(second, "VERIFY_EMAIL")).not.toBeNull();
    await resendVerification();
    expect((await resendVerification()).message).toMatch(/too many attempts/i);
  });

  it("does nothing for confirmed addresses", async () => {
    const user = await createUser("diana", { signIn: true });
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    expect((await resendVerification()).message).toBe("Your email is already confirmed.");
    expect(outbox).toHaveLength(0);
  });
});

describe("password reset", () => {
  it("gives the same answer for known and unknown emails, and only emails real accounts", async () => {
    await createUser("evelyn");
    const known = await requestPasswordReset(idleState, form({ email: "EVELYN@example.com" }));
    const unknown = await requestPasswordReset(idleState, form({ email: "nobody@example.com" }));
    await flushAfter();
    expect(known).toEqual({ status: "success", message: RESET_SENT });
    expect(unknown).toEqual(known);
    expect(outbox.map((e) => [e.tag, e.to])).toEqual([["password-reset", "evelyn@example.com"]]);
  });

  it("validates the email field", async () => {
    const state = await requestPasswordReset(idleState, form({ email: "nope" }));
    expect(state.fieldErrors).toEqual({ email: "Enter a valid email address." });
  });

  it("caps reset emails per address without revealing it", async () => {
    await createUser("evelyn");
    for (let i = 0; i < 5; i++) {
      request.ip = `198.51.100.${i + 1}`;
      expect((await requestPasswordReset(idleState, form({ email: "evelyn@example.com" }))).message).toBe(
        RESET_SENT,
      );
    }
    await flushAfter();
    expect(outbox).toHaveLength(3);
  });

  it("rate-limits requests per IP", async () => {
    for (let i = 0; i < 5; i++) await requestPasswordReset(idleState, form({ email: `x${i}@example.com` }));
    expect((await requestPasswordReset(idleState, form({ email: "y@example.com" }))).message).toMatch(
      /too many/i,
    );
  });

  it("resets the password, confirms the email, signs out everywhere and signs in here", async () => {
    const user = await createUser("evelyn", { password: "old password here" });
    await signInAs(user.id); // another device
    request.cookies.clear();
    await requestPasswordReset(idleState, form({ email: "evelyn@example.com" }));
    await flushAfter();
    const token = tokenFrom(lastLink("password-reset"));

    const weak = await resetPassword(idleState, form({ token, password: "evelyn-password-1" }));
    expect(weak.fieldErrors?.password).toMatch(/username or email/);

    const to = await expectRedirect(() =>
      resetPassword(idleState, form({ token, password: "fresh new passphrase" })),
    );
    expect(to).toBe("/dashboard?reset=1");
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("fresh new passphrase", after.passwordHash)).toBe(true);
    expect(after.emailVerifiedAt).not.toBeNull();
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
    expect(request.cookies.get(COOKIE)).toBeTruthy();
    await flushAfter();
    expect(outbox.map((e) => e.tag)).toEqual(["password-reset", "password-changed"]);

    const reuse = await resetPassword(idleState, form({ token, password: "another passphrase" }));
    expect(reuse.message).toMatch(/expired or was already used/);
  });

  it("rejects expired links", async () => {
    const user = await createUser("evelyn");
    const token = await issueEmailToken(user.id, "RESET_PASSWORD", new Date(Date.now() - 2 * 60 * 60 * 1000));
    expect(
      (await resetPassword(idleState, form({ token, password: "fresh new passphrase" }))).message,
    ).toMatch(/expired/);
  });
});

describe("email tokens", () => {
  it("are single-use, typed and stored hashed", async () => {
    const user = await createUser("fay");
    const token = await issueEmailToken(user.id, "RESET_PASSWORD");
    expect(await db.emailToken.findFirst({ where: { id: token } })).toBeNull();
    expect(await consumeEmailToken(token, "VERIFY_EMAIL")).toBeNull();
    const results = await Promise.all([
      consumeEmailToken(token, "RESET_PASSWORD"),
      consumeEmailToken(token, "RESET_PASSWORD"),
    ]);
    expect(results.filter(Boolean)).toEqual([{ userId: user.id }]);
    expect(await consumeEmailToken("", "RESET_PASSWORD")).toBeNull();
    expect(await peekEmailToken("", "RESET_PASSWORD")).toBeNull();
  });

  it("are deleted with the account", async () => {
    const user = await createUser("fay");
    await issueEmailToken(user.id, "VERIFY_EMAIL");
    await db.user.delete({ where: { id: user.id } });
    expect(await db.emailToken.count()).toBe(0);
  });
});

describe("security notices", () => {
  it("email the user when their password changes", async () => {
    await createUser("gus", { password: "old password here", signIn: true });
    await changePassword(idleState, form({ current: "old password here", next: "brand new passphrase" }));
    await flushAfter();
    expect(outbox.map((e) => [e.tag, e.to])).toEqual([["password-changed", "gus@example.com"]]);
  });

  it("email the new portfolio link when the username changes", async () => {
    await createUser("gus", { signIn: true });
    await updateUsername(idleState, form({ username: "gus-dev" }));
    await flushAfter();
    const email = outbox.find((e) => e.tag === "username-changed")!;
    expect(email.subject).toBe("Your portfolio link is now stackcase.test/gus-dev");
    expect(email.text).toContain("https://stackcase.test/gus-dev");
  });

  it("confirm account deletion to the address on file", async () => {
    await createUser("gus", { password: "my password 123", signIn: true });
    await expectRedirect(() =>
      deleteAccount(idleState, form({ confirm: "gus", password: "my password 123" })),
    );
    await flushAfter();
    expect(outbox.map((e) => [e.tag, e.to])).toEqual([["account-deleted", "gus@example.com"]]);
  });
});
