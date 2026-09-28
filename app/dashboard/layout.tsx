import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { DashTabs } from "@/components/dashboard/DashTabs";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { portfolioAddress, portfolioUrl, siteConfig } from "@/lib/site";
import { logOutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: `%s · ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const portfolio = await db.portfolio.findUnique({
    where: { userId: user.id },
    select: { published: true },
  });
  const live = Boolean(portfolio?.published);
  return (
    <div className="ui-shell">
      <header className="ui-topbar">
        <div className="wrap">
          <Link className="mark" href="/dashboard">
            <Logo />
          </Link>
          {live ? (
            <a
              className="ui-live"
              href={portfolioUrl(user.username)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {portfolioAddress(user.username)} ↗
            </a>
          ) : (
            <Link className="ui-live" href="/dashboard/preview">
              {portfolioAddress(user.username)} · draft
            </Link>
          )}
          <form action={logOutAction}>
            <button type="submit" className="btn sm ghost">
              Log out
            </button>
          </form>
        </div>
      </header>
      {user.emailVerifiedAt ? null : <VerifyEmailBanner email={user.email} />}
      <DashTabs />
      <main className="wrap ui-main" id="main">
        {children}
      </main>
      <SiteFooter extra={[{ href: "/dashboard/export", label: "Download my data", plain: true }]} />
    </div>
  );
}
