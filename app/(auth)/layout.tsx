import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";
import { legalLinks } from "@/lib/legal";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="ui-auth" id="main">
      <div className="ui-auth-card">
        <Link className="mark" href="/">
          <Logo />
        </Link>
        {children}
      </div>
      <nav className="ui-auth-legal" aria-label="Legal">
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
