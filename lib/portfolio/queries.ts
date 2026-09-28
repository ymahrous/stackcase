import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { USERNAME_HOLD_DAYS, checkUsernameFormat } from "@/lib/username";
import type { PortfolioData } from "./types";

const portfolioSelect = {
  displayName: true,
  headline: true,
  location: true,
  availability: true,
  bio: true,
  pronouns: true,
  githubUrl: true,
  linkedinUrl: true,
  websiteUrl: true,
  resumeUrl: true,
  contactEmail: true,
  seoTitle: true,
  seoDescription: true,
  accent: true,
  colorMode: true,
  fontStyle: true,
  layout: true,
  sectionOrder: true,
  showGlance: true,
  showSkills: true,
  showContact: true,
  published: true,
  updatedAt: true,
  projects: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      name: true,
      label: true,
      tagline: true,
      summary: true,
      stack: true,
      highlights: true,
      liveUrl: true,
      sourceUrl: true,
    },
  },
  skills: { orderBy: { position: "asc" as const }, select: { id: true, area: true, tools: true } },
};

export function holdCutoff(now = new Date()): Date {
  return new Date(now.getTime() - USERNAME_HOLD_DAYS * 24 * 60 * 60 * 1000);
}

/** The signed-in user's portfolio, published or not. */
export async function getPortfolioForUser(userId: string): Promise<PortfolioData | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, portfolio: { select: portfolioSelect } },
  });
  if (!user?.portfolio) return null;
  return { username: user.username, ...user.portfolio };
}

export type PortfolioLookup =
  { type: "found"; portfolio: PortfolioData } | { type: "redirect"; username: string } | { type: "missing" };

/**
 * Resolves a subdomain to a published portfolio. A recently changed username resolves to a redirect
 * to the owner's current name so old links and search results keep working.
 */
export const lookupPublicPortfolio = cache(async (rawUsername: string): Promise<PortfolioLookup> => {
  const username = rawUsername.toLowerCase();
  if (checkUsernameFormat(username) === "format" || username.length > 63) return { type: "missing" };
  const user = await db.user.findUnique({
    where: { username },
    select: { username: true, portfolio: { select: portfolioSelect } },
  });
  if (user) {
    if (!user.portfolio?.published) return { type: "missing" };
    return { type: "found", portfolio: { username: user.username, ...user.portfolio } };
  }
  const redirect = await db.usernameRedirect.findUnique({
    where: { username },
    select: {
      createdAt: true,
      user: { select: { username: true, portfolio: { select: { published: true } } } },
    },
  });
  if (redirect && redirect.createdAt > holdCutoff() && redirect.user.portfolio?.published) {
    return { type: "redirect", username: redirect.user.username };
  }
  return { type: "missing" };
});

/** Number of published portfolios, for honest social proof on the landing page. Null if the database is unreachable. */
export async function countPublishedPortfolios(): Promise<number | null> {
  try {
    return await db.portfolio.count({ where: { published: true } });
  } catch {
    return null;
  }
}

export interface PublishedPortfolioSummary {
  username: string;
  displayName: string;
  headline: string;
  updatedAt: Date;
}

/** Published portfolios, most recently updated first. Empty if the database is unreachable (e.g. during a build). */
export async function listPublishedPortfolios(limit = 5000): Promise<PublishedPortfolioSummary[]> {
  try {
    const rows = await db.portfolio.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { displayName: true, headline: true, updatedAt: true, user: { select: { username: true } } },
    });
    return rows.map((r) => ({
      username: r.user.username,
      displayName: r.displayName,
      headline: r.headline,
      updatedAt: r.updatedAt,
    }));
  } catch {
    return [];
  }
}
