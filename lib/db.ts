import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

// Reuse one client across hot reloads in development and across test files.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

type UniqueMeta = {
  target?: unknown;
  driverAdapterError?: {
    cause?: { constraint?: { fields?: string[]; index?: string }; originalMessage?: string };
  };
};

/**
 * True when a Prisma error is a unique-constraint violation, optionally on a given field.
 * Handles both error shapes: `meta.target` (native engine) and `meta.driverAdapterError` (driver adapters),
 * where Postgres reports the index name, e.g. "User_email_key".
 */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (typeof error !== "object" || error === null || (error as { code?: string }).code !== "P2002")
    return false;
  if (!field) return true;
  const meta = (error as { meta?: UniqueMeta }).meta;
  const cause = meta?.driverAdapterError?.cause;
  const candidates = [
    ...(Array.isArray(meta?.target) ? meta.target : typeof meta?.target === "string" ? [meta.target] : []),
    ...(cause?.constraint?.fields ?? []),
    cause?.constraint?.index,
    cause?.originalMessage,
  ].filter((c): c is string => typeof c === "string");
  return candidates.some((c) =>
    c
      .replace(/"/g, "")
      .split(/[^A-Za-z0-9]+/)
      .includes(field),
  );
}
