"use server";

import { redirect } from "next/navigation";
import { type ActionState, errorState, successState } from "@/lib/action-state";
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendVerificationEmail } from "@/lib/account-email";
import { consumeEmailToken } from "@/lib/auth/email-tokens";
import { RESET_SENT } from "@/lib/auth/messages";
import { hashSessionToken } from "@/lib/auth/tokens";
import { getUsernameStatus } from "@/lib/account";
import { checkPasswordStrength, hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { endSession, getCurrentUser, startSession } from "@/lib/auth/session";
import { db, isUniqueViolation } from "@/lib/db";
import { displayNameFromUsername } from "@/lib/display-name";
import { LEGAL_VERSION } from "@/lib/legal";
import { holdCutoff } from "@/lib/portfolio/queries";
import { afterResponse } from "@/lib/after-response";
import { trackEvent } from "@/lib/events";
import { clientIp, consumeRateLimit, limits, peekRateLimit, retryMessage } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/routing";
import { emailSchema, fieldErrors, loginSchema, readForm, signupSchema } from "@/lib/validation";

const FIX_FIELDS = "Check the highlighted fields.";

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = readForm(formData, ["email", "password", "username", "accept"] as const);
  // Echoed back so the form keeps what was typed (React resets uncontrolled fields after an action).
  const echo = {
    email: values.email,
    username: values.username,
    accept: values.accept === "yes" ? "yes" : "",
  };

  const rl = await consumeRateLimit(`signup:${await clientIp()}`, limits.signup);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds), undefined, echo);

  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return errorState(FIX_FIELDS, fieldErrors(parsed.error), echo);
  const { email, password, username } = parsed.data;

  const weak = checkPasswordStrength(password, [username, email.split("@")[0] ?? ""]);
  if (weak) return errorState(FIX_FIELDS, { password: weak }, echo);

  const status = await getUsernameStatus(username);
  if (!status.available) {
    const hint = status.suggestions.length ? ` Try ${status.suggestions.join(", ")}.` : "";
    return errorState(FIX_FIELDS, { username: `${status.message}${hint}` }, echo);
  }

  const passwordHash = await hashPassword(password);
  let userId: string;
  try {
    const user = await db.$transaction(async (tx) => {
      // An expired hold on this name can be released now that someone is claiming it.
      await tx.usernameRedirect.deleteMany({ where: { username, createdAt: { lte: holdCutoff() } } });
      return tx.user.create({
        data: {
          email,
          passwordHash,
          username,
          // Evidence of consent: when, and to which version of the Terms and Privacy Policy.
          termsAcceptedAt: new Date(),
          termsVersion: LEGAL_VERSION,
          portfolio: { create: { displayName: displayNameFromUsername(username) } },
        },
        select: { id: true },
      });
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      return errorState(
        FIX_FIELDS,
        { email: "An account with this email already exists. Log in instead." },
        echo,
      );
    }
    if (isUniqueViolation(error, "username")) {
      return errorState(FIX_FIELDS, { username: "That username was just taken. Try another." }, echo);
    }
    throw error;
  }

  await startSession(userId);
  // Sent after the response; a failed send never blocks sign-up, and the dashboard offers to resend the link.
  afterResponse("verification email", () => sendVerificationEmail(userId));
  afterResponse("track signup", () => trackEvent("signup_completed"));
  redirect("/dashboard?welcome=1");
}

let dummyHash: Promise<string> | null = null;
/** Verifying against a throwaway hash when the email is unknown keeps response times identical. */
function timingDummy() {
  dummyHash ??= hashPassword("timing-equalizer-not-a-real-password");
  return dummyHash;
}

const BAD_CREDENTIALS = "Email or password is incorrect.";

export async function logIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = readForm(formData, ["email", "password", "next"] as const);
  const echo = { email: values.email };
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return errorState(BAD_CREDENTIALS, undefined, echo);
  const { email, password } = parsed.data;

  // Every attempt counts against the IP; only failures count against the email, so a user who logs in
  // often is never locked out by their own successful logins.
  const emailKey = `login:email:${email}`;
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`login:ip:${await clientIp()}`, limits.login),
    peekRateLimit(emailKey, limits.loginPerEmail),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return errorState(
      retryMessage(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds)),
      undefined,
      echo,
    );
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await timingDummy()));
  if (!user || !valid) {
    await consumeRateLimit(emailKey, limits.loginPerEmail);
    return errorState(BAD_CREDENTIALS, undefined, echo);
  }

  if (needsRehash(user.passwordHash)) {
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  }
  await startSession(user.id);
  redirect(safeNextPath(values.next));
}

export async function logOut(): Promise<void> {
  await endSession();
  redirect("/");
}

/* ---------- Password reset ---------- */

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("email") ?? "");
  const echo = { email: raw };
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success)
    return errorState("Enter the email you signed up with.", { email: "Enter a valid email address." }, echo);
  const email = parsed.data;

  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`reset:ip:${await clientIp()}`, limits.resetPerIp),
    consumeRateLimit(`reset:email:${email}`, limits.resetPerEmail),
  ]);
  if (!byIp.ok) return errorState(retryMessage(byIp.retryAfterSeconds), undefined, echo);

  // Same answer, in the same time, whether or not the account exists: the lookup and the email both happen
  // after the response, so neither the message nor the timing reveals registered addresses.
  if (byEmail.ok) {
    afterResponse("password reset email", async () => {
      const user = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (user) await sendPasswordResetEmail(user.id);
    });
  }
  return successState(RESET_SENT);
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { token, password } = readForm(formData, ["token", "password"] as const);
  const rl = await consumeRateLimit(`reset-submit:${await clientIp()}`, limits.resetPerIp);
  if (!rl.ok) return errorState(retryMessage(rl.retryAfterSeconds));

  const preview = await db.emailToken.findUnique({
    where: { id: hashSessionToken(token) },
    select: { user: { select: { username: true, email: true } } },
  });
  const weak = checkPasswordStrength(password, [
    preview?.user.username ?? "",
    preview?.user.email.split("@")[0] ?? "",
  ]);
  if (weak) return errorState("Check the highlighted field.", { password: weak });

  const used = await consumeEmailToken(token, "RESET_PASSWORD");
  if (!used) return errorState("This reset link has expired or was already used. Request a new one.");

  await db.$transaction([
    // Receiving the link proves the user controls the inbox, so the address counts as confirmed too.
    db.user.update({
      where: { id: used.userId },
      data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
    }),
    db.session.deleteMany({ where: { userId: used.userId } }),
    db.emailToken.deleteMany({ where: { userId: used.userId, usedAt: null } }),
  ]);
  afterResponse("password changed email", () => sendPasswordChangedEmail(used.userId));
  await startSession(used.userId);
  redirect("/dashboard?reset=1");
}

/* ---------- Email confirmation ---------- */

export async function confirmEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const used = await consumeEmailToken(token, "VERIFY_EMAIL");
  if (!used) return errorState("This confirmation link has expired or was already used.");
  await db.user.update({ where: { id: used.userId }, data: { emailVerifiedAt: new Date() } });
  afterResponse("track email confirmed", () => trackEvent("email_confirmed"));
  const current = await getCurrentUser();
  redirect(current?.id === used.userId ? "/dashboard?verified=1" : "/login?verified=1");
}
