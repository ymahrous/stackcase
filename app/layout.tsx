import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/bricolage-grotesque/latin-500.css";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";
import { Telemetry } from "@/components/telemetry/Telemetry";
import { brand } from "@/lib/brand";
import { absoluteUrl, siteConfig } from "@/lib/site";

const title = `${siteConfig.name}: free portfolio builder for software engineers`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: title, template: `%s · ${siteConfig.name}` },
  description: brand.description,
  applicationName: siteConfig.name,
  keywords: [...brand.keywords],
  category: "technology",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title,
    description: brand.description,
    locale: siteConfig.locale,
    url: "/",
    images: [
      { url: absoluteUrl("/og"), width: 1200, height: 630, alt: `${siteConfig.name}: ${brand.tagline}` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: brand.description,
    images: [absoluteUrl("/og")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    types: { "text/plain": [{ url: "/llms.txt", title: `${siteConfig.name} for AI assistants` }] },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        {/* The analytics scripts are served by Vercel under /_vercel; elsewhere they'd 404. */}
        {process.env.VERCEL ? <Telemetry /> : null}
      </body>
    </html>
  );
}
