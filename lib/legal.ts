import { brand } from "@/lib/brand";
import { siteConfig } from "@/lib/site";

/**
 * Versions of the legal documents (YYYY-NNN). Bump both when the text changes materially; sign-up stores the
 * version each user accepted, so you can tell who has seen which terms.
 */
export const LEGAL_VERSION = "2026-002";
export const LEGAL_UPDATED = "September 2026";
/**
 * Minimum age to create an account, worldwide. The Terms add "or older where local law sets a higher age"; 16 covers
 * the highest EU digital-consent age (GDPR Art. 8) and is above COPPA's 13.
 */
export const MINIMUM_AGE = 16;

/**
 * The law that governs the Terms. Stackcase is offered worldwide and not directed at any one country, so the
 * Terms use internationally recognized contract principles rather than one country's law, and consumers keep
 * the mandatory protections of the country where they live.
 */
export const GOVERNING_LAW =
  "generally recognized principles of international commercial law, in particular the UNIDROIT Principles of International Commercial Contracts";

export interface Operator {
  /** Legal name of the service and data controller: Stackcase. */
  name: string;
  /** Public issue tracker: questions, privacy requests, legal notices and accessibility feedback. */
  contactUrl: string;
  /** Private channel on GitHub for security reports and anything that mustn't be public. */
  privateReportUrl: string;
  /** Name of the database host, e.g. "Neon Inc. (USA)". */
  databaseProvider: string;
  /** How long the database provider keeps backups, in days. */
  backupRetentionDays: number;
}

export interface LegalEnv {
  LEGAL_DATABASE_PROVIDER?: string;
  LEGAL_BACKUP_RETENTION_DAYS?: string;
}

const clean = (v: string | undefined) => (v?.trim() ? v.trim() : null);

/**
 * Stackcase has no contact email: every request goes through the GitHub repository, publicly as an issue or
 * privately through GitHub's private vulnerability reporting (enable it under Settings → Code security).
 */
export const contactLinks = {
  issues: `${brand.repository}/issues`,
  newIssue: `${brand.repository}/issues/new`,
  privateReport: `${brand.repository}/security/advisories/new`,
} as const;

export function resolveOperator(env: LegalEnv): Operator {
  const days = Number.parseInt(env.LEGAL_BACKUP_RETENTION_DAYS ?? "", 10);
  return {
    name: siteConfig.name,
    contactUrl: contactLinks.newIssue,
    privateReportUrl: contactLinks.privateReport,
    databaseProvider: clean(env.LEGAL_DATABASE_PROVIDER) ?? "our database hosting provider",
    backupRetentionDays: Number.isFinite(days) && days > 0 ? days : 30,
  };
}

export function operator(): Operator {
  return resolveOperator({
    LEGAL_DATABASE_PROVIDER: process.env.LEGAL_DATABASE_PROVIDER,
    LEGAL_BACKUP_RETENTION_DAYS: process.env.LEGAL_BACKUP_RETENTION_DAYS,
  });
}

export const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
] as const;
