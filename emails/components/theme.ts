/**
 * Email design tokens. Mirrors the site's light theme; emails use inline styles, since most mail clients
 * ignore stylesheets. Colors meet WCAG AA contrast on their backgrounds.
 */
export const theme = {
  bg: "#F5F6F3",
  card: "#FFFFFF",
  ink: "#141A18",
  body: "#2A322F",
  muted: "#58625E",
  line: "#DCE1DD",
  accent: "#2B4FD8",
  accentInk: "#FFFFFF",
  noticeBg: "#F1F4FF",
  noticeLine: "#C9D3FB",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

/** Everything an email needs to know about the deployment. Passed in, so templates stay pure and previewable. */
export interface SiteInfo {
  /** Brand name, e.g. Stackcase. Also the copyright holder. */
  name: string;
  /** Origin, e.g. https://stackcase.vercel.app */
  url: string;
  /** Host for display, e.g. stackcase.vercel.app */
  host: string;
  /** Where people can ask for help (the GitHub issue tracker). Optional. */
  supportUrl?: string | null;
}

/** Sample deployment used by the preview server (`npm run email:dev`) and tests. */
export const previewSite: SiteInfo = {
  name: "Stackcase",
  url: "https://stackcase.vercel.app",
  host: "stackcase.vercel.app",
  supportUrl: "https://github.com/ymahrous/stackcase/issues",
};

export const link = (site: SiteInfo, path: string) =>
  new URL(path.replace(/^\//, ""), `${site.url}/`).toString();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "28 Sep 2026, 07:15 UTC": unambiguous for readers in any country, and identical on every runtime. */
export function formatWhen(date: Date): string {
  const day = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return `${day}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** Plain-text conversion rules: keep headings in normal case and put each table cell on its own line. */
export const plainTextOptions = {
  selectors: [
    { selector: "h1", options: { uppercase: false } },
    { selector: "table", format: "block" },
    { selector: "tr", format: "block" },
    { selector: "td", format: "block" },
  ],
};
