"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { chooseConsent } from "./consent-store";

/**
 * Asks before analytics load. Not modal: the page stays usable, and both answers have the same weight.
 * When reopened from "Cookie settings", focus moves here so keyboard and screen reader users land on it.
 */
export function ConsentBanner({ reopened }: { reopened: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reopened) ref.current?.focus();
  }, [reopened]);

  return (
    <section ref={ref} className="consent" aria-label="Cookie settings" tabIndex={-1}>
      <p>
        May we count visits and measure page speed with Vercel Web Analytics? It&apos;s anonymous, sets no
        cookies and never runs unless you allow it. We store your answer in a cookie.{" "}
        <Link href="/privacy#cookies">Details</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn" onClick={() => chooseConsent("denied")}>
          Decline
        </button>
        <button type="button" className="btn" onClick={() => chooseConsent("granted")}>
          Allow analytics
        </button>
      </div>
    </section>
  );
}
