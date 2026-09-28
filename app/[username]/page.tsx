import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PortfolioView, firstName } from "@/components/portfolio/PortfolioView";
import { lookupPublicPortfolio } from "@/lib/portfolio/queries";
import { portfolioDescription, portfolioJsonLd, portfolioTitle } from "@/lib/seo";
import { portfolioUrl, siteConfig } from "@/lib/site";

/** Rendered on first visit, cached, and refreshed whenever the owner saves (revalidatePath) or hourly. */
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const result = await lookupPublicPortfolio(username);
  if (result.type !== "found")
    return { title: "Portfolio not found", robots: { index: false, follow: false } };
  const p = result.portfolio;
  const url = portfolioUrl(p.username);
  const title = portfolioTitle(p);
  const description = portfolioDescription(p);
  const image = { url: portfolioUrl(p.username, "/og"), width: 1200, height: 630, alt: title };
  const [first, ...rest] = p.displayName.split(/\s+/);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    authors: [{ name: p.displayName, url }],
    creator: p.displayName,
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: `${firstName(p.displayName)}'s portfolio`,
      firstName: first,
      lastName: rest.join(" ") || undefined,
      username: p.username,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    other: { generator: siteConfig.name },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;
  const result = await lookupPublicPortfolio(username);
  if (result.type === "redirect") permanentRedirect(portfolioUrl(result.username));
  if (result.type === "missing") notFound();
  return (
    <>
      <JsonLd data={portfolioJsonLd(result.portfolio)} />
      <PortfolioView portfolio={result.portfolio} />
    </>
  );
}
