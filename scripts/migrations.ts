// Applies prisma/migrations/*/migration.sql to a database on a fresh schema.
// Used by the Vitest and Playwright setups. In production use `prisma migrate deploy`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export async function applyMigrations(connectionString: string, { reset = true } = {}): Promise<string[]> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    if (reset) await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    const dir = join(process.cwd(), "prisma", "migrations");
    const names = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const name of names) await client.query(readFileSync(join(dir, name, "migration.sql"), "utf8"));
    return names;
  } finally {
    await client.end();
  }
}
