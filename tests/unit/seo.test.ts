import { describe, expect, it } from "vitest";
import { facts, faqs, features, steps } from "@/app/(marketing)/content";
import {
  marketingJsonLd,
  portfolioDescription,
  portfolioJsonLd,
  portfolioLlmsTxt,
  portfolioTitle,
  serializeJsonLd,
  siteLlmsTxt,
  technologies,
  truncate,
} from "@/lib/seo";
import { makePortfolio } from "./fixtures";

describe("truncate", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(truncate("a  b\n c")).toBe("a b c");
  });
  it("cuts at a word boundary with an ellipsis", () => {
    const out = truncate("word ".repeat(60), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("word…")).toBe(true);
  });
});

describe("portfolio titles and descriptions", () => {
  it("combine name and headline", () => {
    expect(portfolioTitle(makePortfolio())).toBe("Alice Chen · Frontend engineer");
    expect(portfolioTitle(makePortfolio({ headline: "" }))).toBe("Alice Chen");
  });
  it("use the intro when present, otherwise build one", () => {
    expect(portfolioDescription(makePortfolio())).toMatch(/^I build fast interfaces/);
    expect(portfolioDescription(makePortfolio({ bio: "" }))).toBe(
      "Alice Chen: Frontend engineer, based in Berlin. Projects: Chartroom, Notes.",
    );
    expect(portfolioDescription(makePortfolio({ bio: "", headline: "", location: "", projects: [] }))).toBe(
      "Alice Chen: Portfolio.",
    );
  });
  it("collects distinct technologies across projects", () => {
    expect(technologies(makePortfolio())).toEqual(["React", "D3", "SQLite"]);
  });
});

describe("portfolioJsonLd", () => {
  const graph = portfolioJsonLd(makePortfolio())["@graph"] as Record<string, unknown>[];
  const [person, page, list] = graph;

  it("describes the person with their profiles", () => {
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Alice Chen",
      jobTitle: "Frontend engineer",
      url: "https://stackcase.test/alice",
      image: "https://stackcase.test/alice/og",
      sameAs: ["https://github.com/alice", "https://www.linkedin.com/in/alice"],
      homeLocation: { name: "Berlin" },
    });
  });

  it("links the profile page to the person", () => {
    expect(page).toMatchObject({ "@type": "ProfilePage", mainEntity: { "@id": person!["@id"] } });
  });

  it("lists projects, typing ones with code as SoftwareSourceCode", () => {
    const items = (list!.itemListElement as { item: Record<string, unknown> }[]).map((i) => i.item);
    expect(items[0]).toMatchObject({
      "@type": "SoftwareSourceCode",
      codeRepository: "https://github.com/alice/chartroom",
      url: "https://chartroom.example",
    });
    expect(items[1]).toMatchObject({
      "@type": "CreativeWork",
      url: "https://stackcase.test/alice#project-2",
    });
    expect(items[1]).not.toHaveProperty("description");
  });

  it("omits empty optional fields", () => {
    const bare = portfolioJsonLd(
      makePortfolio({
        headline: "",
        bio: "",
        location: "",
        githubUrl: null,
        linkedinUrl: null,
        projects: [],
      }),
    );
    const p = (bare["@graph"] as Record<string, unknown>[])[0]!;
    for (const key of ["jobTitle", "description", "homeLocation", "sameAs", "knowsAbout"])
      expect(p).not.toHaveProperty(key);
  });
});

describe("portfolioLlmsTxt", () => {
  it("summarizes the person, projects and skills", () => {
    const txt = portfolioLlmsTxt(makePortfolio());
    expect(txt.startsWith("# Alice Chen\n\n> I build")).toBe(true);
    expect(txt).toContain("- Role: Frontend engineer");
    expect(txt).toContain("- Email: alice@example.com");
    expect(txt).toContain(
      "- **Chartroom**: Streams a million points to the browser. Stack: React, D3. [Live](https://chartroom.example) · [Source](https://github.com/alice/chartroom)",
    );
    expect(txt).toContain("- **Notes** Stack: React, SQLite.");
    expect(txt).toContain("## Skills\n\n- Frontend: React, TypeScript");
  });
  it("skips empty sections", () => {
    const txt = portfolioLlmsTxt(makePortfolio({ projects: [], skills: [], headline: "", location: "" }));
    expect(txt).not.toContain("## Projects");
    expect(txt).not.toContain("## Skills");
    expect(txt).not.toContain("Role:");
  });
});

describe("marketingJsonLd", () => {
  const graph = marketingJsonLd({ faqs, steps, features })["@graph"] as Record<string, unknown>[];
  const byType = (t: string) => graph.find((n) => n["@type"] === t)!;

  it("describes Stackcase as a free web application", () => {
    expect(graph.map((n) => n["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebApplication",
      "HowTo",
      "FAQPage",
    ]);
    expect(byType("Organization")).toMatchObject({ name: "Stackcase", url: "https://stackcase.test/" });
    expect(byType("WebApplication")).toMatchObject({
      name: "Stackcase",
      isAccessibleForFree: true,
      offers: { price: "0" },
    });
    expect((byType("WebApplication").featureList as string[]).length).toBe(features.length);
  });

  it("includes the how-to steps in order and every FAQ", () => {
    const how = byType("HowTo");
    expect((how.step as { position: number; name: string }[]).map((s) => s.name)).toEqual(
      steps.map((s) => s.title),
    );
    expect((byType("FAQPage").mainEntity as unknown[]).length).toBe(faqs.length);
  });

  it("answers 'What is Stackcase?' first, with the definition", () => {
    expect(faqs[0]!.q).toBe("What is Stackcase?");
    expect(faqs[0]!.a).toMatch(/^Stackcase is a free portfolio builder for software engineers\./);
  });
});

describe("siteLlmsTxt", () => {
  it("leads with the definition and lists facts, steps, FAQ and portfolios", () => {
    const txt = siteLlmsTxt({
      facts,
      steps,
      faqs,
      portfolios: [{ username: "alice", displayName: "Alice Chen", headline: "Frontend engineer" }],
    });
    expect(txt.startsWith("# Stackcase\n\n> Stackcase is a free portfolio builder")).toBe(true);
    expect(txt).toContain("- Price: Free. No credit card.");
    expect(txt).toContain("1. Claim your username:");
    expect(txt).toContain("### Is Stackcase free?");
    expect(txt).toContain("- [Alice Chen](https://stackcase.test/alice): Frontend engineer");
  });
  it("omits the portfolio section when none are published", () => {
    expect(siteLlmsTxt({ facts, steps, faqs, portfolios: [] })).not.toContain("## Published portfolios");
  });
});

describe("serializeJsonLd", () => {
  it("cannot break out of a script tag", () => {
    const out = serializeJsonLd({ t: "</script><img onerror=x> & \u2028" });
    expect(out).not.toMatch(/[<>&\u2028]/);
    expect(JSON.parse(out)).toEqual({ t: "</script><img onerror=x> & \u2028" });
  });
});
