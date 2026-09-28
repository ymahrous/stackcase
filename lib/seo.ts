import type { PortfolioData } from "@/lib/portfolio/types";
import { brand } from "@/lib/brand";
import { absoluteUrl, portfolioUrl, siteConfig } from "@/lib/site";
import { availabilityLabels } from "@/lib/validation";

type JsonLdNode = Record<string, unknown>;

/** Serializes JSON-LD for a <script> tag, escaping characters that could close the tag early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Cuts text at a word boundary so meta descriptions stay within what search engines display. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/* ---------- Portfolio pages (domain/username) ---------- */

/** The search result title: the owner's override if set, otherwise "Name · Headline". */
export function portfolioTitle(p: PortfolioData): string {
  const custom = p.seoTitle.trim();
  if (custom) return custom;
  return p.headline ? `${p.displayName} · ${p.headline}` : p.displayName;
}

/** The meta description: the owner's override, then their intro, then a summary built from the profile. */
export function portfolioDescription(p: PortfolioData): string {
  const custom = p.seoDescription.trim();
  if (custom) return truncate(custom, 160);
  if (p.bio) return truncate(p.bio);
  const parts = [p.headline || "Portfolio", p.location && `based in ${p.location}`]
    .filter(Boolean)
    .join(", ");
  const projects = p.projects.slice(0, 3).map((x) => x.name);
  const tail = projects.length ? ` Projects: ${projects.join(", ")}.` : "";
  return truncate(`${p.displayName}: ${parts}.${tail}`);
}

export function technologies(p: PortfolioData): string[] {
  return [...new Set(p.projects.flatMap((x) => x.stack))];
}

export function portfolioJsonLd(p: PortfolioData): JsonLdNode {
  const home = portfolioUrl(p.username);
  const personId = `${home}#person`;
  const sameAs = [p.githubUrl, p.linkedinUrl, p.websiteUrl].filter((x): x is string => Boolean(x));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: p.displayName,
        alternateName: p.username,
        url: home,
        image: portfolioUrl(p.username, "/og"),
        ...(p.headline ? { jobTitle: p.headline } : {}),
        ...(p.bio ? { description: p.bio } : {}),
        ...(p.location ? { homeLocation: { "@type": "Place", name: p.location } } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(technologies(p).length ? { knowsAbout: technologies(p) } : {}),
      },
      {
        "@type": "ProfilePage",
        "@id": `${home}#profile`,
        url: home,
        name: portfolioTitle(p),
        mainEntity: { "@id": personId },
        dateModified: p.updatedAt.toISOString(),
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absoluteUrl("/") },
      },
      {
        "@type": "ItemList",
        "@id": `${home}#work`,
        name: `Projects by ${p.displayName}`,
        numberOfItems: p.projects.length,
        itemListElement: p.projects.map((project, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": project.sourceUrl ? "SoftwareSourceCode" : "CreativeWork",
            name: project.name,
            ...(project.summary || project.tagline
              ? { description: project.summary || project.tagline }
              : {}),
            ...(project.sourceUrl ? { codeRepository: project.sourceUrl } : {}),
            ...(project.stack.length ? { keywords: project.stack.join(", ") } : {}),
            url: project.liveUrl ?? project.sourceUrl ?? `${home}#project-${i + 1}`,
            author: { "@id": personId },
          },
        })),
      },
    ],
  };
}

/** Plain-text summary for AI assistants at username.domain/llms.txt (https://llmstxt.org). */
export function portfolioLlmsTxt(p: PortfolioData): string {
  const facts = [
    p.headline ? `- Role: ${p.headline}` : null,
    p.pronouns ? `- Pronouns: ${p.pronouns}` : null,
    p.location ? `- Location: ${p.location}` : null,
    `- Status: ${availabilityLabels[p.availability]}`,
    `- Portfolio: ${portfolioUrl(p.username)}`,
    p.linkedinUrl ? `- LinkedIn: ${p.linkedinUrl}` : null,
    p.githubUrl ? `- GitHub: ${p.githubUrl}` : null,
    p.websiteUrl ? `- Website: ${p.websiteUrl}` : null,
    p.resumeUrl ? `- Résumé: ${p.resumeUrl}` : null,
    p.contactEmail ? `- Email: ${p.contactEmail}` : null,
  ].filter((x): x is string => x !== null);
  const projects = p.projects.map((x) => {
    const refs = [
      x.liveUrl ? `[Live](${x.liveUrl})` : null,
      x.sourceUrl ? `[Source](${x.sourceUrl})` : null,
    ].filter((r): r is string => r !== null);
    const body = x.summary || x.tagline;
    const stack = x.stack.length ? ` Stack: ${x.stack.join(", ")}.` : "";
    return `- **${x.name}**${body ? `: ${body}` : ""}${stack}${refs.length ? ` ${refs.join(" · ")}` : ""}`;
  });
  // Only what the page shows: structured summaries must match visible content.
  const skills = p.showSkills ? p.skills.map((s) => `- ${s.area}: ${s.tools}`) : [];
  return [
    `# ${p.displayName}`,
    "",
    `> ${portfolioDescription(p)}`,
    "",
    ...facts,
    ...(projects.length ? ["", "## Projects", "", ...projects] : []),
    ...(skills.length ? ["", "## Skills", "", ...skills] : []),
    "",
  ].join("\n");
}

/* ---------- Marketing site (root domain) ---------- */

export interface Faq {
  q: string;
  a: string;
}

export interface MarketingSchemaInput {
  faqs: Faq[];
  steps: { title: string; body: string }[];
  features: readonly { title: string; body: string }[];
}

/**
 * The marketing site's schema.org graph: who publishes it, what the product is and costs, how to use it,
 * and the FAQ. Search engines use it for rich results; AI assistants use it to describe the product accurately.
 */
export function marketingJsonLd({ faqs, steps, features }: MarketingSchemaInput): JsonLdNode {
  const home = absoluteUrl("/");
  const org = `${home}#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: siteConfig.name,
        legalName: siteConfig.name,
        url: home,
        logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png"), width: 512, height: 512 },
        description: brand.definition,
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: siteConfig.name,
        url: home,
        description: brand.description,
        publisher: { "@id": org },
        copyrightHolder: { "@id": org },
        copyrightYear: new Date().getFullYear(),
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${home}#app`,
        name: siteConfig.name,
        url: home,
        description: brand.definition,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Portfolio builder",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires a modern web browser",
        isAccessibleForFree: true,
        audience: { "@type": "Audience", audienceType: brand.audience },
        featureList: features.map((f) => `${f.title}: ${f.body}`),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", url: absoluteUrl("/signup") },
        publisher: { "@id": org },
      },
      {
        "@type": "HowTo",
        "@id": `${home}#how`,
        name: `How to create a software engineer portfolio with ${siteConfig.name}`,
        totalTime: "PT15M",
        estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
          url: `${home}#how`,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${home}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export interface PublishedPortfolioRef {
  username: string;
  displayName: string;
  headline: string;
}

/** llms.txt for the whole site (https://llmstxt.org): what the product is, the facts, the FAQ, and public portfolios. */
export function siteLlmsTxt(input: {
  facts: { label: string; value: string }[];
  steps: { title: string; body: string }[];
  faqs: Faq[];
  portfolios: PublishedPortfolioRef[];
}): string {
  return [
    `# ${siteConfig.name}`,
    "",
    `> ${brand.definition}`,
    "",
    ...input.facts.map((f) => `- ${f.label}: ${f.value}`),
    `- Website: ${absoluteUrl("/")}`,
    `- Sign up: ${absoluteUrl("/signup")}`,
    "",
    "## How it works",
    "",
    ...input.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`),
    "",
    "## FAQ",
    "",
    ...input.faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    ...(input.portfolios.length
      ? [
          "## Published portfolios",
          "",
          ...input.portfolios.map(
            (p) => `- [${p.displayName}](${portfolioUrl(p.username)})${p.headline ? `: ${p.headline}` : ""}`,
          ),
          "",
        ]
      : []),
    "## Optional",
    "",
    `- [Privacy Policy](${absoluteUrl("/privacy")}): what data is collected, why, and users' rights`,
    `- [Terms of Service](${absoluteUrl("/terms")}): accounts, content ownership, acceptable use`,
    `- [Accessibility Statement](${absoluteUrl("/accessibility")}): WCAG 2.2 AA target and how to report barriers`,
    "",
  ].join("\n");
}
