import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <main className="wrap notfound" id="main">
        <span className="label">404</span>
        <h1>This page doesn&apos;t exist.</h1>
        <p>Check the address, or head back to the start.</p>
        <p>
          <Link className="btn primary" href="/">
            Go to the home page
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
