import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/SiteFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="nav" aria-label="Primary">
        <div className="wrap">
          <Link className="mark" href="/">
            <Logo />
          </Link>
          <Link className="btn primary" href="/signup" style={{ marginLeft: "auto" }}>
            Claim your URL
          </Link>
        </div>
      </nav>
      <main id="main" className="wrap">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
