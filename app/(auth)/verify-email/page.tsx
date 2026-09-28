import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmEmailForm } from "@/components/forms/ConfirmEmailForm";
import { peekEmailToken } from "@/lib/auth/email-tokens";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  const valid = await peekEmailToken(token, "VERIFY_EMAIL");
  if (!valid) {
    return (
      <>
        <h1>This link has expired</h1>
        <p>Confirmation links work for 24 hours and only once. Log in to send yourself a new one.</p>
        <p className="ui-auth-alt">
          <Link className="btn primary" href="/login?next=%2Fdashboard">
            Log in
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Confirm your email</h1>
      <p>One click and you&apos;re done. This lets you reset your password if you ever forget it.</p>
      <ConfirmEmailForm token={token} />
    </>
  );
}
