import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms/SignupForm";
import { getCurrentUser } from "@/lib/auth/session";
import { portfolioAddress, siteConfig } from "@/lib/site";
import { normalizeUsername } from "@/lib/username";

export const metadata: Metadata = {
  title: "Create your portfolio",
  description: `Claim ${portfolioAddress("yourname")} and publish a recruiter-ready engineering portfolio in minutes. Free.`,
  alternates: { canonical: "/signup" },
};

type Props = { searchParams: Promise<{ username?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { username } = await searchParams;
  return (
    <>
      <h1>Claim your address</h1>
      <p>Pick a username. Your portfolio will live at it, and you can change it later.</p>
      <SignupForm
        prefix={`${siteConfig.host}/`}
        username={username ? normalizeUsername(username).slice(0, 30) : ""}
      />
    </>
  );
}
