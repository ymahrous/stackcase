import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { peekEmailToken } from "@/lib/auth/email-tokens";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  // Keep the token in the URL out of Referer headers sent to other sites.
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  const valid = await peekEmailToken(token, "RESET_PASSWORD");
  if (!valid) {
    return (
      <>
        <h1>This link has expired</h1>
        <p>Reset links work for 60 minutes and only once. Request a new one and use the newest email.</p>
        <p className="ui-auth-alt">
          <Link className="btn primary" href="/forgot-password">
            Send a new link
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Choose a new password</h1>
      <p>You&apos;ll be signed in, and signed out everywhere else.</p>
      <ResetPasswordForm token={token} />
    </>
  );
}
