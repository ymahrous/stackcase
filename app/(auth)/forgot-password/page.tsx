import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1>Forgot your password?</h1>
      <p>Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>
      <ForgotPasswordForm />
      <p className="ui-auth-alt">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </>
  );
}
