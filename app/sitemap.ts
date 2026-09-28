import type { MetadataRoute } from "next";
import { legalLinks } from "@/lib/legal";
import { listPublishedPortfolios } from "@/lib/portfolio/queries";
import { absoluteUrl, portfolioUrl } from "@/lib/site";

/** Refreshed hourly, so new portfolios appear without a deploy. */
export const revalidate = 3600;

/** The landing page, sign-up, and every published portfolio (all on one host, so one sitemap covers them). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portfolios = await listPublishedPortfolios();
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1, images: [absoluteUrl("/og")] },
    { url: absoluteUrl("/signup"), changeFrequency: "monthly", priority: 0.6 },
    ...legalLinks.map((l) => ({
      url: absoluteUrl(l.href),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...portfolios.map((p) => ({
      url: portfolioUrl(p.username),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [portfolioUrl(p.username, "/og")],
    })),
  ];
}
