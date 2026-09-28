import type {
  AccentValue,
  AvailabilityValue,
  ColorModeValue,
  FontStyleValue,
  LayoutValue,
  SectionOrderValue,
} from "@/lib/validation";

export interface ProjectData {
  id: string;
  name: string;
  label: string;
  tagline: string;
  summary: string;
  stack: string[];
  highlights: string[];
  liveUrl: string | null;
  sourceUrl: string | null;
}

export interface SkillData {
  id: string;
  area: string;
  tools: string;
}

/** Everything needed to render a portfolio. Plain data, so it can come from the database or a sample. */
export interface PortfolioData {
  username: string;
  displayName: string;
  headline: string;
  location: string;
  availability: AvailabilityValue;
  bio: string;
  pronouns: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  resumeUrl: string | null;
  contactEmail: string | null;
  seoTitle: string;
  seoDescription: string;
  /* Design */
  accent: AccentValue;
  colorMode: ColorModeValue;
  fontStyle: FontStyleValue;
  layout: LayoutValue;
  sectionOrder: SectionOrderValue;
  showGlance: boolean;
  showSkills: boolean;
  showContact: boolean;
  published: boolean;
  updatedAt: Date;
  projects: ProjectData[];
  skills: SkillData[];
}

/** The design fields, with their defaults. New accounts start here; `resetDesign` goes back here. */
export const DEFAULT_DESIGN = {
  accent: "COBALT",
  colorMode: "AUTO",
  fontStyle: "GROTESK",
  layout: "CASE_STUDY",
  sectionOrder: "PROJECTS_FIRST",
  showGlance: true,
  showSkills: true,
  showContact: true,
} as const satisfies Pick<
  PortfolioData,
  | "accent"
  | "colorMode"
  | "fontStyle"
  | "layout"
  | "sectionOrder"
  | "showGlance"
  | "showSkills"
  | "showContact"
>;

export type DesignData = { -readonly [K in keyof typeof DEFAULT_DESIGN]: PortfolioData[K] };

/**
 * Data attributes that drive the portfolio's CSS: accent, theme, font and layout.
 * "AUTO" sets no theme so the page follows the visitor's device.
 */
export function designAttributes(d: Pick<DesignData, "accent" | "colorMode" | "fontStyle" | "layout">) {
  return {
    "data-accent": d.accent,
    "data-theme": d.colorMode === "AUTO" ? undefined : d.colorMode.toLowerCase(),
    "data-font": d.fontStyle.toLowerCase(),
    "data-layout": d.layout.toLowerCase().replace("_", "-"),
  } as const;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

/** Onboarding checklist shown on the dashboard. Order is the order a new user should do them in. */
export function portfolioChecklist(p: PortfolioData): ChecklistItem[] {
  return [
    {
      id: "headline",
      label: "Add a headline that names your role",
      done: p.headline.length > 0,
      href: "/dashboard/profile",
    },
    { id: "bio", label: "Write a two-sentence intro", done: p.bio.length >= 40, href: "/dashboard/profile" },
    {
      id: "contact",
      label: "Add a way for recruiters to reach you",
      done: Boolean(p.linkedinUrl || p.contactEmail || p.websiteUrl),
      href: "/dashboard/profile",
    },
    {
      id: "project",
      label: "Add your first project",
      done: p.projects.length > 0,
      href: "/dashboard/projects",
    },
    {
      id: "project-links",
      label: "Link a project to its code or live demo",
      done: p.projects.some((x) => x.sourceUrl || x.liveUrl),
      href: "/dashboard/projects",
    },
    {
      id: "skills",
      label: "List your skills with evidence",
      done: p.skills.length > 0,
      href: "/dashboard/skills",
    },
    { id: "publish", label: "Publish your portfolio", done: p.published, href: "/dashboard" },
  ];
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

/** Minimum content before publishing is allowed, so nobody ships an empty page to recruiters. */
export function publishBlockers(p: PortfolioData): string[] {
  const out: string[] = [];
  if (!p.headline) out.push("Add a headline.");
  if (p.projects.length === 0) out.push("Add at least one project.");
  return out;
}
