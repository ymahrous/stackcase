import { describe, expect, it } from "vitest";
import {
  emailSchema,
  fieldErrors,
  optionalEmail,
  optionalUrl,
  profileSchema,
  projectSchema,
  readForm,
  signupSchema,
  designSchema,
  COLOR_MODES,
  FONT_STYLES,
  LAYOUTS,
  SECTION_ORDERS,
  colorModeLabels,
  fontStyleLabels,
  layoutLabels,
  sectionOrderLabels,
  skillSchema,
  splitList,
} from "@/lib/validation";

const url = optionalUrl("Link");

describe("optionalUrl", () => {
  it("turns blank into null", () => {
    expect(url.parse("  ")).toBeNull();
  });
  it("adds https:// to bare domains", () => {
    expect(url.parse("github.com/alice")).toBe("https://github.com/alice");
  });
  it("keeps http and https URLs", () => {
    expect(url.parse("http://example.com/x")).toBe("http://example.com/x");
  });
  it("rejects script and data URLs, and hosts without a dot", () => {
    expect(url.safeParse("javascript:alert(1)").success).toBe(false);
    expect(url.safeParse("data:text/html,hi").success).toBe(false);
    expect(url.safeParse("localhost").success).toBe(false);
  });
});

describe("emails", () => {
  it("lowercases and validates", () => {
    expect(emailSchema.parse(" Alice@Example.COM ")).toBe("alice@example.com");
    expect(emailSchema.safeParse("nope").success).toBe(false);
    expect(optionalEmail.parse("")).toBeNull();
    expect(optionalEmail.safeParse("nope").success).toBe(false);
  });
});

describe("splitList", () => {
  it("trims, drops blanks and case-insensitive duplicates", () => {
    expect(splitList(" React, react , ,Go", /,/)).toEqual(["React", "Go"]);
    expect(splitList("a\n\nb\r\na", /\r?\n/)).toEqual(["a", "b"]);
  });
});

describe("signupSchema", () => {
  it("normalizes the username and email", () => {
    expect(
      signupSchema.parse({ accept: "yes", email: "A@B.co", password: "x", username: " Alice " }),
    ).toEqual({
      accept: "yes",
      email: "a@b.co",
      password: "x",
      username: "alice",
    });
  });
  it("explains username problems", () => {
    const result = signupSchema.safeParse({ accept: "yes", email: "a@b.co", password: "x", username: "www" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!).username).toMatch(/reserved/);
  });
  it("requires consent to the Terms", () => {
    for (const accept of [undefined, "", "on", "no"]) {
      const result = signupSchema.safeParse({ accept, email: "a@b.co", password: "x", username: "alice" });
      expect(result.success, String(accept)).toBe(false);
      expect(fieldErrors(result.error!).accept).toMatch(/Terms/);
    }
  });
});

describe("profileSchema", () => {
  const base = {
    displayName: "Alice",
    headline: "",
    location: "",
    availability: "OPEN",
    bio: "",
    pronouns: "",
    githubUrl: "",
    linkedinUrl: "linkedin.com/in/alice",
    websiteUrl: "",
    resumeUrl: "",
    contactEmail: "",
    seoTitle: "",
    seoDescription: "",
  };
  it("parses a minimal profile", () => {
    const p = profileSchema.parse(base);
    expect(p.linkedinUrl).toBe("https://linkedin.com/in/alice");
    expect(p.githubUrl).toBeNull();
  });
  it("requires a name and valid enums", () => {
    const r = profileSchema.safeParse({ ...base, displayName: " ", availability: "MAYBE" });
    const errors = fieldErrors(r.error!);
    expect(Object.keys(errors).sort()).toEqual(["availability", "displayName"]);
  });
  it("enforces length limits", () => {
    const r = profileSchema.safeParse({
      ...base,
      bio: "x".repeat(601),
      pronouns: "x".repeat(31),
      seoTitle: "x".repeat(71),
      seoDescription: "x".repeat(161),
    });
    const errors = fieldErrors(r.error!);
    expect(errors.bio).toMatch(/600/);
    expect(errors.pronouns).toMatch(/30/);
    expect(errors.seoTitle).toMatch(/70/);
    expect(errors.seoDescription).toMatch(/160/);
  });
  it("normalizes the résumé link and rejects unsafe schemes", () => {
    expect(profileSchema.parse({ ...base, resumeUrl: "drive.google.com/file/d/x" }).resumeUrl).toBe(
      "https://drive.google.com/file/d/x",
    );
    const r = profileSchema.safeParse({ ...base, resumeUrl: "javascript:alert(1)" });
    expect(fieldErrors(r.error!).resumeUrl).toMatch(/Résumé URL/);
  });
});

describe("designSchema", () => {
  const design = {
    accent: "VIOLET",
    colorMode: "DARK",
    fontStyle: "SERIF",
    layout: "GRID",
    sectionOrder: "SKILLS_FIRST",
    showGlance: "on",
    showSkills: "",
    showContact: "true",
  };
  it("parses enums and checkbox values", () => {
    expect(designSchema.parse(design)).toEqual({
      accent: "VIOLET",
      colorMode: "DARK",
      fontStyle: "SERIF",
      layout: "GRID",
      sectionOrder: "SKILLS_FIRST",
      showGlance: true,
      showSkills: false,
      showContact: true,
    });
  });
  it("rejects values outside the allowed options", () => {
    const r = designSchema.safeParse({
      ...design,
      accent: "PINK",
      colorMode: "SEPIA",
      fontStyle: "COMIC",
      layout: "CAROUSEL",
      sectionOrder: "RANDOM",
    });
    expect(Object.keys(fieldErrors(r.error!)).sort()).toEqual([
      "accent",
      "colorMode",
      "fontStyle",
      "layout",
      "sectionOrder",
    ]);
  });
  it("has a label for every option", () => {
    for (const m of COLOR_MODES) expect(colorModeLabels[m].label).toBeTruthy();
    for (const f of FONT_STYLES) expect(fontStyleLabels[f].hint).toBeTruthy();
    for (const l of LAYOUTS) expect(layoutLabels[l].label).toBeTruthy();
    for (const o of SECTION_ORDERS) expect(sectionOrderLabels[o]).toBeTruthy();
  });
});

describe("projectSchema", () => {
  it("splits the stack and highlights", () => {
    const p = projectSchema.parse({
      name: "X",
      label: "",
      tagline: "",
      summary: "",
      stack: "Go, Postgres",
      highlights: "One\nTwo",
      liveUrl: "",
      sourceUrl: "github.com/a/x",
    });
    expect(p.stack).toEqual(["Go", "Postgres"]);
    expect(p.highlights).toEqual(["One", "Two"]);
    expect(p.sourceUrl).toBe("https://github.com/a/x");
  });
  it("limits the number of technologies", () => {
    const stack = Array.from({ length: 13 }, (_, i) => `t${i}`).join(",");
    const r = projectSchema.safeParse({
      name: "X",
      label: "",
      tagline: "",
      summary: "",
      stack,
      highlights: "",
      liveUrl: "",
      sourceUrl: "",
    });
    expect(fieldErrors(r.error!).stack).toMatch(/at most 12/);
  });
});

describe("skillSchema and readForm", () => {
  it("requires both fields", () => {
    expect(skillSchema.safeParse({ area: "", tools: "" }).success).toBe(false);
  });
  it("reads string fields and defaults missing ones", () => {
    const fd = new FormData();
    fd.set("a", "1");
    fd.set("file", new Blob(["x"]));
    expect(readForm(fd, ["a", "b", "file"] as const)).toEqual({ a: "1", b: "", file: "" });
  });
});
