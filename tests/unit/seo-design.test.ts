// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ogPalette } from "@/lib/og";
import { portfolioDescription, portfolioJsonLd, portfolioLlmsTxt, portfolioTitle } from "@/lib/seo";
import { ACCENTS } from "@/lib/validation";
import { makePortfolio } from "./fixtures";

describe("search overrides", () => {
  it("uses the owner's title and description when set", () => {
    const p = makePortfolio({
      seoTitle: "  Alice Chen — React performance  ",
      seoDescription: "Hire me for fast UIs.",
    });
    expect(portfolioTitle(p)).toBe("Alice Chen — React performance");
    expect(portfolioDescription(p)).toBe("Hire me for fast UIs.");
  });

  it("falls back to generated text when the overrides are blank", () => {
    const p = makePortfolio({ seoTitle: "   ", seoDescription: "" });
    expect(portfolioTitle(p)).toBe("Alice Chen · Frontend engineer");
    expect(portfolioDescription(p)).toBe(p.bio);
  });

  it("keeps a long custom description within 160 characters", () => {
    const d = portfolioDescription(makePortfolio({ seoDescription: "word ".repeat(60) }));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
  });

  it("the ProfilePage name follows the custom title", () => {
    const graph = portfolioJsonLd(makePortfolio({ seoTitle: "Custom title" }))["@graph"] as Record<
      string,
      unknown
    >[];
    expect(graph.find((n) => n["@type"] === "ProfilePage")).toMatchObject({ name: "Custom title" });
  });
});

describe("llms.txt reflects profile and design choices", () => {
  it("lists pronouns and the résumé link", () => {
    const txt = portfolioLlmsTxt(
      makePortfolio({ pronouns: "she/her", resumeUrl: "https://alice.dev/cv.pdf" }),
    );
    expect(txt).toContain("- Pronouns: she/her");
    expect(txt).toContain("- Résumé: https://alice.dev/cv.pdf");
  });

  it("leaves out skills the owner hid from the page", () => {
    const skills = [{ id: "s1", area: "Frontend", tools: "React" }];
    expect(portfolioLlmsTxt(makePortfolio({ skills }))).toContain("## Skills");
    expect(portfolioLlmsTxt(makePortfolio({ skills, showSkills: false }))).not.toContain("## Skills");
  });
});

describe("social card palette", () => {
  it("is light unless the owner forced dark mode", () => {
    for (const colorMode of ["AUTO", "LIGHT"] as const) {
      expect(ogPalette({ accent: "COBALT", colorMode })).toMatchObject({ bg: "#F5F6F3", accent: "#2B4FD8" });
    }
    expect(ogPalette({ accent: "COBALT", colorMode: "DARK" })).toMatchObject({
      bg: "#0D1110",
      accent: "#8EA2FF",
    });
  });

  it("has a color for every accent in both palettes", () => {
    for (const accent of ACCENTS) {
      expect(ogPalette({ accent, colorMode: "LIGHT" }).accent).toMatch(/^#[0-9A-F]{6}$/);
      expect(ogPalette({ accent, colorMode: "DARK" }).accent).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
