import { describe, expect, it } from "vitest";
import { displayNameFromUsername } from "@/lib/display-name";
import { checklistProgress, portfolioChecklist, publishBlockers } from "@/lib/portfolio/types";
import { makePortfolio } from "./fixtures";

describe("portfolioChecklist", () => {
  it("marks everything done for a complete, published portfolio", () => {
    const items = portfolioChecklist(makePortfolio());
    expect(items.every((i) => i.done)).toBe(true);
    expect(checklistProgress(items)).toBe(100);
  });

  it("guides a brand-new account step by step", () => {
    const fresh = makePortfolio({
      headline: "",
      bio: "",
      linkedinUrl: null,
      contactEmail: null,
      websiteUrl: null,
      projects: [],
      skills: [],
      published: false,
    });
    const items = portfolioChecklist(fresh);
    expect(items.filter((i) => i.done)).toHaveLength(0);
    expect(checklistProgress(items)).toBe(0);
    expect(items.map((i) => i.href)).toContain("/dashboard/projects");
  });

  it("rounds partial progress", () => {
    expect(checklistProgress([])).toBe(0);
    const items = portfolioChecklist(makePortfolio({ published: false }));
    expect(checklistProgress(items)).toBe(86);
  });
});

describe("publishBlockers", () => {
  it("requires a headline and at least one project", () => {
    expect(publishBlockers(makePortfolio())).toEqual([]);
    expect(publishBlockers(makePortfolio({ headline: "", projects: [] }))).toEqual([
      "Add a headline.",
      "Add at least one project.",
    ]);
  });
});

describe("displayNameFromUsername", () => {
  it("title-cases hyphenated usernames", () => {
    expect(displayNameFromUsername("ada-lovelace")).toBe("Ada Lovelace");
    expect(displayNameFromUsername("bob")).toBe("Bob");
  });
});
