import { DEFAULT_DESIGN, type PortfolioData } from "@/lib/portfolio/types";

export function makePortfolio(overrides: Partial<PortfolioData> = {}): PortfolioData {
  return {
    username: "alice",
    displayName: "Alice Chen",
    headline: "Frontend engineer",
    location: "Berlin",
    availability: "OPEN",
    bio: "I build fast interfaces for data-heavy products, mostly in React and TypeScript.",
    pronouns: "",
    githubUrl: "https://github.com/alice",
    linkedinUrl: "https://www.linkedin.com/in/alice",
    websiteUrl: null,
    resumeUrl: null,
    contactEmail: "alice@example.com",
    seoTitle: "",
    seoDescription: "",
    ...DEFAULT_DESIGN,
    published: true,
    updatedAt: new Date("2026-09-01T12:00:00Z"),
    projects: [
      {
        id: "p1",
        name: "Chartroom",
        label: "Live",
        tagline: "Realtime charts",
        summary: "Streams a million points to the browser.",
        stack: ["React", "D3"],
        highlights: ["Rendered 1M points at 60fps"],
        liveUrl: "https://chartroom.example",
        sourceUrl: "https://github.com/alice/chartroom",
      },
      {
        id: "p2",
        name: "Notes",
        label: "",
        tagline: "",
        summary: "",
        stack: ["React", "SQLite"],
        highlights: [],
        liveUrl: null,
        sourceUrl: null,
      },
    ],
    skills: [{ id: "s1", area: "Frontend", tools: "React, TypeScript" }],
    ...overrides,
  };
}
