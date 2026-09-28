import { siteConfig } from "@/lib/site";

/**
 * Versions of the legal documents. Bump the date when the text changes materially; sign-up stores the
 * version each user accepted, so you can tell who has seen which terms.
 */
export const LEGAL_VERSION = "2026-001";
export const LEGAL_UPDATED = "September 2026";
/** Minimum age to create an account: the highest digital-consent age in the EU (GDPR Art. 8), above COPPA's 13. */
export const MINIMUM_AGE = 16;

/**
 * The law that governs the Terms. Stackcase is offered worldwide, so the Terms use internationally
 * recognized contract principles rather than one country's law, and consumers keep the mandatory
 * protections of the country where they live.
 */
export const GOVERNING_LAW =
  "generally recognized principles of international commercial law, in particular the UNIDROIT Principles of International Commercial Contracts";

export interface Operator {
  /** Legal name of the service and data controller: Stackcase. */
  name: string;
  /** Contact for privacy requests, legal notices and accessibility feedback. */
  email: string;
  /** True when a real contact address is configured (LEGAL_CONTACT_EMAIL or EMAIL_REPLY_TO). */
  contactConfigured: boolean;
  /** GDPR Art. 27 / UK GDPR representatives, needed if the operator is outside the EU/UK and serves users there. */
  euRepresentative: string | null;
  ukRepresentative: string | null;
  /** Name of the database host, e.g. "Neon Inc. (USA)". */
  databaseProvider: string;
  /** How long the database provider keeps backups, in days. */
  backupRetentionDays: number;
  /** True when every required value is configured. The legal pages show a notice to the operator otherwise. */
  complete: boolean;
}

export interface LegalEnv {
  LEGAL_CONTACT_EMAIL?: string;
  LEGAL_EU_REPRESENTATIVE?: string;
  LEGAL_UK_REPRESENTATIVE?: string;
  LEGAL_DATABASE_PROVIDER?: string;
  LEGAL_BACKUP_RETENTION_DAYS?: string;
  EMAIL_REPLY_TO?: string;
}

const clean = (v: string | undefined) => (v?.trim() ? v.trim() : null);

export function resolveOperator(env: LegalEnv): Operator {
  const email = clean(env.LEGAL_CONTACT_EMAIL) ?? clean(env.EMAIL_REPLY_TO);
  const days = Number.parseInt(env.LEGAL_BACKUP_RETENTION_DAYS ?? "", 10);
  return {
    name: siteConfig.name,
    email: email ?? "[contact email not configured]",
    contactConfigured: Boolean(email),
    euRepresentative: clean(env.LEGAL_EU_REPRESENTATIVE),
    ukRepresentative: clean(env.LEGAL_UK_REPRESENTATIVE),
    databaseProvider: clean(env.LEGAL_DATABASE_PROVIDER) ?? "our database hosting provider",
    backupRetentionDays: Number.isFinite(days) && days > 0 ? days : 30,
    complete: Boolean(email),
  };
}

export function operator(): Operator {
  return resolveOperator({
    LEGAL_CONTACT_EMAIL: process.env.LEGAL_CONTACT_EMAIL,
    LEGAL_EU_REPRESENTATIVE: process.env.LEGAL_EU_REPRESENTATIVE,
    LEGAL_UK_REPRESENTATIVE: process.env.LEGAL_UK_REPRESENTATIVE,
    LEGAL_DATABASE_PROVIDER: process.env.LEGAL_DATABASE_PROVIDER,
    LEGAL_BACKUP_RETENTION_DAYS: process.env.LEGAL_BACKUP_RETENTION_DAYS,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  });
}

export const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
] as const;
