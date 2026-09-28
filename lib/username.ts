/**
 * Usernames become the first path segment of a portfolio (example.com/alice). They follow DNS-label rules too,
 * so the same names would still work if portfolios move to subdomains on a custom domain later.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

/** Days an old username keeps redirecting to its owner's new one before anyone else can claim it. */
export const USERNAME_HOLD_DAYS = 30;
/** Minimum days between username changes, so held names cannot be farmed. */
export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;

/**
 * Names that must never belong to a user: every top-level route of the app (a username would shadow it),
 * infrastructure names, and names people could use to impersonate the platform.
 * tests/unit/username.test.ts fails if a new top-level route is added without reserving it here.
 */
export const RESERVED_USERNAMES = new Set([
  "about",
  "abuse",
  "abuse-report",
  "accessibility",
  "account",
  "accounts",
  "admin",
  "administrator",
  "api",
  "app",
  "apple-icon",
  "apps",
  "assets",
  "auth",
  "billing",
  "blog",
  "ccpa",
  "cdn",
  "contact",
  "cookies",
  "copyright",
  "dashboard",
  "demo",
  "dev",
  "dmca",
  "docs",
  "dsa",
  "email",
  "example",
  "export",
  "faq",
  "favicon",
  "feedback",
  "forgot-password",
  "ftp",
  "gdpr",
  "help",
  "home",
  "icon",
  "imap",
  "impressum",
  "imprint",
  "info",
  "legal",
  "legal-notice",
  "llms",
  "localhost",
  "login",
  "logout",
  "mail",
  "manifest",
  "marketing",
  "me",
  "media",
  "mx",
  "new",
  "news",
  "no-reply",
  "noreply",
  "ns1",
  "ns2",
  "official",
  "og",
  "owner",
  "pop",
  "portfolio",
  "portfolios",
  "postmaster",
  "preview",
  "pricing",
  "privacy",
  "register",
  "report",
  "reset-password",
  "robots",
  "root",
  "security",
  "settings",
  "signin",
  "signup",
  "site",
  "sitemap",
  "sites",
  "smtp",
  "stackcase",
  "staff",
  "staging",
  "static",
  "status",
  "support",
  "sysadmin",
  "team",
  "terms",
  "test",
  "trust",
  "user",
  "users",
  "verify-email",
  "webmail",
  "webmaster",
  "well-known",
  "www",
]);

export type UsernameProblem = "too-short" | "too-long" | "format" | "double-hyphen" | "reserved";

export const usernameProblemMessages: Record<UsernameProblem, string> = {
  "too-short": `Use at least ${USERNAME_MIN} characters.`,
  "too-long": `Use at most ${USERNAME_MAX} characters.`,
  format: "Use lowercase letters, numbers and hyphens. Start and end with a letter or number.",
  "double-hyphen": "Two hyphens in a row aren't allowed.",
  reserved: "That name is reserved. Try another.",
};

/** Lowercases and trims, the only transformation applied before storing. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/** Returns the first rule a normalized username breaks, or null when it is valid. */
export function checkUsernameFormat(username: string): UsernameProblem | null {
  if (username.length < USERNAME_MIN) return "too-short";
  if (username.length > USERNAME_MAX) return "too-long";
  if (!USERNAME_PATTERN.test(username)) return "format";
  if (username.includes("--")) return "double-hyphen";
  if (RESERVED_USERNAMES.has(username)) return "reserved";
  return null;
}

/** Turns free text (an email local part, a display name) into a best-effort valid username. */
export function suggestUsername(source: string): string {
  const base = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, USERNAME_MAX)
    .replace(/-$/, "");
  if (base.length >= USERNAME_MIN && !RESERVED_USERNAMES.has(base)) return base;
  return `${base || "dev"}-portfolio`.slice(0, USERNAME_MAX).replace(/^-/, "");
}

/** Numbered alternatives for a taken name: alice -> alice-dev, alice-2, alice-3 ... */
export function usernameAlternatives(username: string, count = 3): string[] {
  const out: string[] = [];
  const candidates = [
    `${username}-dev`,
    ...Array.from({ length: count + 2 }, (_, i) => `${username}-${i + 2}`),
  ];
  for (const c of candidates) {
    const trimmed = c.length > USERNAME_MAX ? c.slice(c.length - USERNAME_MAX) : c;
    if (checkUsernameFormat(trimmed) === null && !out.includes(trimmed)) out.push(trimmed);
    if (out.length === count) break;
  }
  return out;
}
