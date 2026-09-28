import { z } from "zod";
import { PASSWORD_MAX } from "@/lib/auth/password";
import { checkUsernameFormat, normalizeUsername, usernameProblemMessages } from "@/lib/username";

export const AVAILABILITY = ["OPEN", "FREELANCE", "NOT_LOOKING"] as const;
export const ACCENTS = ["COBALT", "EMERALD", "CRIMSON", "AMBER", "VIOLET", "GRAPHITE"] as const;
export const COLOR_MODES = ["AUTO", "LIGHT", "DARK"] as const;
export const FONT_STYLES = ["GROTESK", "SERIF", "MONO"] as const;
export const LAYOUTS = ["CASE_STUDY", "COMPACT", "GRID"] as const;
export const SECTION_ORDERS = ["PROJECTS_FIRST", "SKILLS_FIRST"] as const;
export type AvailabilityValue = (typeof AVAILABILITY)[number];
export type AccentValue = (typeof ACCENTS)[number];
export type ColorModeValue = (typeof COLOR_MODES)[number];
export type FontStyleValue = (typeof FONT_STYLES)[number];
export type LayoutValue = (typeof LAYOUTS)[number];
export type SectionOrderValue = (typeof SECTION_ORDERS)[number];

export const availabilityLabels: Record<AvailabilityValue, string> = {
  OPEN: "Open to new roles",
  FREELANCE: "Available for freelance work",
  NOT_LOOKING: "Not looking right now",
};

export const accentLabels: Record<AccentValue, string> = {
  COBALT: "Cobalt",
  EMERALD: "Emerald",
  CRIMSON: "Crimson",
  AMBER: "Amber",
  VIOLET: "Violet",
  GRAPHITE: "Graphite",
};

export const colorModeLabels: Record<ColorModeValue, { label: string; hint: string }> = {
  AUTO: { label: "Match device", hint: "Light or dark, following each visitor's setting" },
  LIGHT: { label: "Light", hint: "Always light" },
  DARK: { label: "Dark", hint: "Always dark" },
};

export const fontStyleLabels: Record<FontStyleValue, { label: string; hint: string }> = {
  GROTESK: { label: "Grotesk", hint: "Bold and modern" },
  SERIF: { label: "Serif", hint: "Editorial and classic" },
  MONO: { label: "Mono", hint: "Technical, like a terminal" },
};

export const layoutLabels: Record<LayoutValue, { label: string; hint: string }> = {
  CASE_STUDY: { label: "Case studies", hint: "Details beside each project. Best for 2 to 5 projects." },
  COMPACT: { label: "Compact list", hint: "One column, tighter spacing. Good for many projects." },
  GRID: { label: "Card grid", hint: "Projects side by side as cards. Scannable at a glance." },
};

export const sectionOrderLabels: Record<SectionOrderValue, string> = {
  PROJECTS_FIRST: "Projects, then skills",
  SKILLS_FIRST: "Skills, then projects",
};

export const limits = {
  displayName: 80,
  headline: 100,
  location: 80,
  bio: 600,
  pronouns: 30,
  seoTitle: 70,
  seoDescription: 160,
  url: 300,
  projectName: 80,
  projectLabel: 40,
  tagline: 140,
  summary: 600,
  stackItems: 12,
  stackItem: 30,
  highlights: 8,
  highlight: 200,
  skillArea: 40,
  skillTools: 200,
  projects: 20,
  skills: 20,
} as const;

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label} can be at most ${max} characters.`);

const requiredText = (max: number, label: string) => text(max, label).min(1, `${label} is required.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email is too long.")
  .pipe(z.email("Enter a valid email address."));

/**
 * Optional http(s) URL. Blank becomes null; "github.com/alice" becomes "https://github.com/alice".
 * Anything that is not http(s) (javascript:, data:) is rejected.
 */
export const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(limits.url, `${label} is too long.`)
    .transform((v, ctx) => {
      if (!v) return null;
      const candidate = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
      try {
        const url = new URL(candidate);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
        if (!url.hostname.includes(".")) throw new Error("host");
        return url.toString();
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} must be a web address starting with https://.` });
        return z.NEVER;
      }
    });

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .transform((v, ctx) => {
    if (!v) return null;
    if (!z.email().safeParse(v).success) {
      ctx.addIssue({ code: "custom", message: "Enter a valid email address or leave it blank." });
      return z.NEVER;
    }
    return v;
  });

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .superRefine((v, ctx) => {
    const problem = checkUsernameFormat(v);
    if (problem) ctx.addIssue({ code: "custom", message: usernameProblemMessages[problem] });
  });

export const signupSchema = z.object({
  accept: z.literal("yes", "Please confirm you agree to the Terms and are old enough to sign up."),
  email: emailSchema,
  password: z.string().max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
  username: usernameSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().max(PASSWORD_MAX),
});

export const profileSchema = z.object({
  displayName: requiredText(limits.displayName, "Name"),
  headline: text(limits.headline, "Headline"),
  location: text(limits.location, "Location"),
  availability: z.enum(AVAILABILITY, "Choose an availability option."),
  bio: text(limits.bio, "Intro"),
  pronouns: text(limits.pronouns, "Pronouns"),
  githubUrl: optionalUrl("GitHub URL"),
  linkedinUrl: optionalUrl("LinkedIn URL"),
  websiteUrl: optionalUrl("Website URL"),
  resumeUrl: optionalUrl("Résumé URL"),
  contactEmail: optionalEmail,
  seoTitle: text(limits.seoTitle, "Search title"),
  seoDescription: text(limits.seoDescription, "Search description"),
});

/** HTML checkboxes send "on" when ticked and nothing when not. */
const checkbox = z.string().transform((v) => v === "on" || v === "true");

export const designSchema = z.object({
  accent: z.enum(ACCENTS, "Choose an accent color."),
  colorMode: z.enum(COLOR_MODES, "Choose a color mode."),
  fontStyle: z.enum(FONT_STYLES, "Choose a font."),
  layout: z.enum(LAYOUTS, "Choose a layout."),
  sectionOrder: z.enum(SECTION_ORDERS, "Choose a section order."),
  showGlance: checkbox,
  showSkills: checkbox,
  showContact: checkbox,
});

/** Splits a comma-separated list, dropping blanks and duplicates (case-insensitive). */
export function splitList(value: string, separator: RegExp): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(separator)) {
    const item = raw.trim();
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export const projectSchema = z.object({
  name: requiredText(limits.projectName, "Project name"),
  label: text(limits.projectLabel, "Label"),
  tagline: text(limits.tagline, "One-liner"),
  summary: text(limits.summary, "Summary"),
  stack: z
    .string()
    .max(1000)
    .transform((v) => splitList(v, /,/))
    .pipe(
      z
        .array(z.string().max(limits.stackItem, `Keep each technology under ${limits.stackItem} characters.`))
        .max(limits.stackItems, `List at most ${limits.stackItems} technologies.`),
    ),
  highlights: z
    .string()
    .max(3000)
    .transform((v) => splitList(v, /\r?\n/))
    .pipe(
      z
        .array(z.string().max(limits.highlight, `Keep each highlight under ${limits.highlight} characters.`))
        .max(limits.highlights, `Add at most ${limits.highlights} highlights.`),
    ),
  liveUrl: optionalUrl("Live URL"),
  sourceUrl: optionalUrl("Source URL"),
});

export const skillSchema = z.object({
  area: requiredText(limits.skillArea, "Area"),
  tools: requiredText(limits.skillTools, "Tools"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type DesignInput = z.infer<typeof designSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type SkillInput = z.infer<typeof skillSchema>;

/** Reads the named string fields from FormData; missing fields become "". */
export function readForm<K extends string>(formData: FormData, keys: readonly K[]): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const key of keys) {
    const v = formData.get(key);
    out[key] = typeof v === "string" ? v : "";
  }
  return out;
}

/** First error message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
