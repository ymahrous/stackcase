import { DEFAULT_DESIGN, type PortfolioData } from "@/lib/portfolio/types";

/** A fictional portfolio used as the live example on the landing page. Not a real person. */
export const samplePortfolio: PortfolioData = {
  username: "maya",
  displayName: "Maya Okafor",
  headline: "Backend engineer for payments and data-heavy products",
  location: "Lisbon · Remote",
  availability: "OPEN",
  bio: "I build the parts of products that have to be right: ledgers, queues and the APIs around them. Looking for a backend or platform role on a team that ships weekly.",
  pronouns: "she/her",
  githubUrl: "https://github.com/",
  linkedinUrl: "https://www.linkedin.com/",
  websiteUrl: null,
  resumeUrl: null,
  contactEmail: null,
  seoTitle: "",
  seoDescription: "",
  ...DEFAULT_DESIGN,
  accent: "EMERALD",
  published: true,
  updatedAt: new Date("2026-09-01T00:00:00Z"),
  projects: [
    {
      id: "s1",
      name: "Ledgerline",
      label: "Side project · Live",
      tagline: "Double-entry ledger API for small marketplaces.",
      summary:
        "Marketplaces kept losing cents in split payouts. Ledgerline records every movement as balanced entries and reconciles against the payment provider nightly.",
      stack: ["Go", "Postgres", "Kafka", "Terraform"],
      highlights: [
        "Idempotent writes with request keys: zero duplicate payouts in 14 months",
        "Nightly reconciliation job flags drift in under 3 minutes",
      ],
      liveUrl: null,
      sourceUrl: null,
    },
    {
      id: "s2",
      name: "Queue Doctor",
      label: "Open source",
      tagline: "Finds stuck jobs in Redis-backed queues before users notice.",
      summary: "A CLI and dashboard that samples queue state and alerts on growing retry storms.",
      stack: ["TypeScript", "Redis", "Node.js"],
      highlights: ["Used by 3 teams at my last company", "Cut on-call pages for queue incidents by half"],
      liveUrl: null,
      sourceUrl: null,
    },
  ],
  skills: [
    { id: "k1", area: "Backend", tools: "Go, TypeScript, Node.js, gRPC, REST" },
    { id: "k2", area: "Data", tools: "Postgres, Kafka, Redis, dbt" },
    { id: "k3", area: "Infrastructure", tools: "AWS, Terraform, Docker, GitHub Actions" },
  ],
};
