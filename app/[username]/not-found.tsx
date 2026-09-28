import type { Metadata } from "next";
import { legalLinks } from "@/lib/legal";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Not found", robots: { index: false, follow: false } };

export default function PortfolioNotFound() {
  return (
    <>
      <main className="wrap notfound" id="main">
        <span className="label">404</span>
        <h1>Nothing at this address.</h1>
        <p>
          This portfolio or page isn&apos;t published. If it&apos;s a username, it might be free to claim.
        </p>
        <p className="ctas">
          <a className="btn primary" href={absoluteUrl("/signup")}>
            Create your portfolio on {siteConfig.name}
          </a>
          <a className="btn" href={absoluteUrl("/login")}>
            Log in
          </a>
        </p>
      </main>
      <footer className="wrap mk-footer">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </span>
        <nav aria-label="Footer">
          {legalLinks.map((l) => (
            <a key={l.href} href={absoluteUrl(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
      </footer>
    </>
  );
}
