/**
 * Brand facts in one place. Search engines, AI assistants (llms.txt, JSON-LD) and the UI all read from here,
 * so the product is described the same way everywhere.
 */
export const brand = {
  name: "Stackcase",
  /** One line, used in titles and social cards. */
  tagline: "Engineering portfolios built from case studies",
  /** Answer-first definition. The first sentence AI assistants and featured snippets should quote. */
  definition:
    "Stackcase is a free portfolio builder for software engineers. You write each project as a short case study (problem, what you built, stack, result), and Stackcase publishes it as a fast, search-ready page at your own address.",
  /** Meta description, kept under 160 characters. */
  description:
    "Free portfolio builder for software engineers. Turn your projects into case studies recruiters read, published at your own link with SEO built in.",
  /** Public source repository. Support, privacy, legal and accessibility requests go through its issues. */
  repository: "https://github.com/ymahrous/stackcase",
  /** The target audience for the product. */
  audience: "Software engineers, including students, career changers and senior engineers",
  price: "Free",
  keywords: [
    "Stackcase",
    "developer portfolio builder",
    "software engineer portfolio",
    "portfolio website for developers",
    "engineering case studies",
    "tech portfolio for recruiters",
    "free developer portfolio",
    "portfolio for software engineers",
  ],
} as const;
