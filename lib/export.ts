import "server-only";
import { db } from "@/lib/db";
import { LEGAL_VERSION } from "@/lib/legal";
import { portfolioUrl, siteConfig } from "@/lib/site";

/**
 * Everything we hold about a user, in a structured, machine-readable format (GDPR Art. 15 and 20,
 * CCPA right to know, LGPD Art. 18). Secrets are left out on purpose: password hashes and token hashes
 * are not "about" the user and would only weaken security if leaked.
 */
export async function exportUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
      emailVerifiedAt: true,
      usernameChangedAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      portfolio: {
        select: {
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
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          projects: {
            orderBy: { position: "asc" },
            select: {
              name: true,
              label: true,
              tagline: true,
              summary: true,
              stack: true,
              highlights: true,
              liveUrl: true,
              sourceUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          skills: { orderBy: { position: "asc" }, select: { area: true, tools: true } },
        },
      },
      redirects: { select: { username: true, createdAt: true } },
      sessions: { select: { createdAt: true, expiresAt: true } },
    },
  });
  if (!user) return null;
  const { redirects, sessions, ...account } = user;
  return {
    exportedAt: new Date().toISOString(),
    service: siteConfig.name,
    privacyPolicyVersion: LEGAL_VERSION,
    account,
    portfolioAddress: portfolioUrl(user.username),
    previousUsernames: redirects,
    activeSessions: sessions,
  };
}
