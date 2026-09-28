import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/routing";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string; verified?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, verified } = await searchParams;
  if (await getCurrentUser()) redirect(safeNextPath(next));
  return (
    <>
      <h1>Welcome back</h1>
      <p>Log in to edit your portfolio.</p>
      {verified ? (
        <p className="ui-msg success" role="status" style={{ marginTop: 16 }}>
          Email confirmed. Log in to continue.
        </p>
      ) : null}
      <LoginForm next={next} />
      <p className="ui-auth-alt">
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="ui-auth-alt">
        New here? <Link href="/signup">Create your portfolio</Link>
      </p>
    </>
  );
}
