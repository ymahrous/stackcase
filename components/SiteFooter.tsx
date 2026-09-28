import Link from "next/link";
import { CookieSettingsButton } from "@/components/telemetry/CookieSettingsButton";
import { legalLinks } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

/** Footer for platform pages: legal links are reachable from every page, as consumer and privacy laws expect. */
/** A footer link. `plain` renders an ordinary anchor: for fragments, files and downloads that Next.js mustn't prefetch. */
export type FooterLink = { href: string; label: string; plain?: boolean };

export function SiteFooter({ extra }: { extra?: FooterLink[] }) {
  return (
    <footer className="wrap mk-footer">
      <span>
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </span>
      <nav aria-label="Footer">
        {(extra ?? []).map((l) =>
          l.plain ? (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ) : (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ),
        )}
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        {/* Analytics, and so the consent panel, exist only on Vercel (see app/layout.tsx). */}
        {process.env.VERCEL ? <CookieSettingsButton /> : null}
      </nav>
    </footer>
  );
}
