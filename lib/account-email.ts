import "server-only";
import { issueEmailToken, TOKEN_TTL_MINUTES } from "@/lib/auth/email-tokens";
import { db } from "@/lib/db";
import { type SendResult, sendEmail } from "@/lib/email/send";
import {
  accountDeletedTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  usernameChangedTemplate,
  verifyEmailTemplate,
} from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/site";
import { USERNAME_HOLD_DAYS } from "@/lib/username";

async function recipient(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
      emailVerifiedAt: true,
      portfolio: { select: { displayName: true } },
    },
  });
}

function nameOf(user: { username: string; portfolio: { displayName: string } | null }) {
  return user.portfolio?.displayName.split(/\s+/)[0] || user.username;
}

/** Sends a fresh "confirm your email" link. No-op for already confirmed addresses. */
export async function sendVerificationEmail(userId: string): Promise<SendResult> {
  const user = await recipient(userId);
  if (!user) return { ok: false, error: "Account not found." };
  if (user.emailVerifiedAt) return { ok: false, error: "Email already confirmed." };
  const token = await issueEmailToken(userId, "VERIFY_EMAIL");
  const url = absoluteUrl(`/verify-email?token=${encodeURIComponent(token)}`);
  return sendEmail({
    to: user.email,
    tag: "verify-email",
    ...(await verifyEmailTemplate({ name: nameOf(user), url, hours: TOKEN_TTL_MINUTES.VERIFY_EMAIL / 60 })),
  });
}

/** Sends a password reset link valid for an hour. */
export async function sendPasswordResetEmail(userId: string): Promise<SendResult> {
  const user = await recipient(userId);
  if (!user) return { ok: false, error: "Account not found." };
  const token = await issueEmailToken(userId, "RESET_PASSWORD");
  const url = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  return sendEmail({
    to: user.email,
    tag: "password-reset",
    ...(await passwordResetTemplate({ name: nameOf(user), url, minutes: TOKEN_TTL_MINUTES.RESET_PASSWORD })),
  });
}

export async function sendPasswordChangedEmail(userId: string): Promise<SendResult> {
  const user = await recipient(userId);
  if (!user) return { ok: false, error: "Account not found." };
  return sendEmail({
    to: user.email,
    tag: "password-changed",
    ...(await passwordChangedTemplate({ name: nameOf(user) })),
  });
}

export async function sendUsernameChangedEmail(userId: string, previous: string): Promise<SendResult> {
  const user = await recipient(userId);
  if (!user) return { ok: false, error: "Account not found." };
  return sendEmail({
    to: user.email,
    tag: "username-changed",
    ...(await usernameChangedTemplate({
      name: nameOf(user),
      previous,
      username: user.username,
      holdDays: USERNAME_HOLD_DAYS,
    })),
  });
}

/** Sent to an address captured before the account row is deleted. */
export async function sendAccountDeletedEmail(
  to: string,
  name: string,
  username: string,
): Promise<SendResult> {
  return sendEmail({ to, tag: "account-deleted", ...(await accountDeletedTemplate({ name, username })) });
}
