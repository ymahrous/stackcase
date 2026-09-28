import { brand } from "@/lib/brand";
import type { Faq } from "@/lib/seo";
import { portfolioAddress, siteConfig } from "@/lib/site";
import { USERNAME_HOLD_DAYS } from "@/lib/username";

const example = portfolioAddress("yourname");

export const heroCopy = {
  eyebrow: "Free portfolio builder for software engineers",
  title: "Show recruiters what you've built.",
  lede: brand.definition,
};

/**
 * Plain facts, rendered as HTML on the landing page and repeated in llms.txt and JSON-LD.
 * Short, quotable answers are what search snippets and AI assistants lift.
 */
export const facts = [
  { label: "What it is", value: `A portfolio builder that turns your projects into short case studies.` },
  { label: "Who it's for", value: brand.audience },
  { label: "Price", value: "Free. No credit card." },
  { label: "Your address", value: example },
  {
    label: "Built in",
    value: "Search metadata, social preview images, structured data, light and dark mode",
  },
  { label: "Time to publish", value: "About 15 minutes for a profile and two projects" },
];

/** What a recruiter asks in the first 30 seconds, and where the portfolio answers it. */
export const recruiterQuestions = [
  {
    q: "Who is this?",
    title: "Role, location and status up top",
    body: "Your headline, where you work from and whether you're open to roles, all in the first screen.",
  },
  {
    q: "Can they build?",
    title: "Projects as short case studies",
    body: "Problem, what you built, the stack and the result, with links to the code and the live app.",
  },
  {
    q: "How do I reach them?",
    title: "One obvious next step",
    body: "A single contact button, repeated at the end. LinkedIn, email or your site, whichever you prefer.",
  },
];

export const steps = [
  {
    title: "Claim your username",
    body: `Pick a name and your portfolio address, ${example}, is reserved right away.`,
  },
  {
    title: "Write your case studies",
    body: "A guided editor and checklist show what recruiters look for in each project.",
  },
  {
    title: "Publish and share",
    body: "Go live with one click. Put the link on your CV, LinkedIn and GitHub profile.",
  },
];

export const features = [
  {
    icon: "link",
    title: "A link that's yours",
    body: `${example}. Short enough to say in an interview or print on a CV.`,
  },
  {
    icon: "search",
    title: "Search-ready by default",
    body: "Descriptive titles, structured data about you and your projects, a sitemap entry and a social preview image.",
  },
  {
    icon: "arrows",
    title: "Rename without breaking links",
    body: `Change your username any time. The old link redirects to the new one for ${USERNAME_HOLD_DAYS} days.`,
  },
  {
    icon: "bolt",
    title: "Fast everywhere",
    body: "Pages are pre-rendered and cached, so they load quickly on a recruiter's phone.",
  },
  {
    icon: "palette",
    title: "Make it yours",
    body: "Six accents, light, dark or automatic themes, three heading fonts and three layouts, with a live preview. Every combination passes WCAG AA.",
  },
  {
    icon: "eye",
    title: "Private until you publish",
    body: "Draft and preview as long as you like. Nothing is public until you choose to publish.",
  },
] as const;

export const faqs: Faq[] = [
  { q: `What is ${brand.name}?`, a: brand.definition },
  {
    q: `Who is ${brand.name} for?`,
    a: "Software engineers who want recruiters and hiring managers to see their work: students and bootcamp graduates building a first portfolio, career changers, and experienced engineers who want their projects explained rather than listed.",
  },
  {
    q: `How is ${brand.name} different from a GitHub profile or LinkedIn?`,
    a: "GitHub shows code and LinkedIn shows job titles. Neither explains a project to someone who won't read the code. A case study does: the problem, your decisions, the stack and the result, with links to GitHub and the live app for people who want to dig in.",
  },
  {
    q: `Is ${brand.name} free?`,
    a: "Yes. Creating an account, editing and publishing your portfolio are free.",
  },
  {
    q: "What will my portfolio address be?",
    a: `${siteConfig.url}/yourname. You pick the username when you sign up.`,
  },
  {
    q: "Can I change my username later?",
    a: `Yes, from Settings. Your old link redirects to the new one for ${USERNAME_HOLD_DAYS} days, and nobody else can claim the old name during that time, so links you've already shared keep working.`,
  },
  {
    q: "Will recruiters find my portfolio on Google?",
    a: "Published portfolios include what search engines use: a descriptive title, structured data about you and your projects, a sitemap entry and a social preview image. Ranking is up to search engines, but your page is ready to be indexed.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. You fill in forms for your profile, projects and skills, and pick a design from a few options. The technical details are handled for you.",
  },
  {
    q: "Can I customize how my portfolio looks?",
    a: "Yes. In the Design tab you choose an accent color, a color mode (match the visitor's device, always light or always dark), a heading font, a project layout (case studies, compact list or card grid) and which sections show. A live preview updates as you choose, and every combination meets WCAG AA contrast.",
  },
  {
    q: "Can I use my own domain?",
    a: `Not yet. Every portfolio lives at ${example}. You can link to it from your own site.`,
  },
  {
    q: `What emails does ${brand.name} send?`,
    a: "Only account emails: a link to confirm your address, password reset links you request, and a notice when your password or username changes. No newsletters.",
  },
  {
    q: "What happens if I delete my account?",
    a: "Your account, portfolio and all content are deleted immediately, your page stops being served, and you get a confirmation email.",
  },
];
