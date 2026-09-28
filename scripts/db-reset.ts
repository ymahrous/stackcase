// Drops and recreates the schema in DATABASE_URL from prisma/migrations. Local development and CI only.
// Usage: node scripts/db-reset.ts   (Node 22.18+ runs TypeScript directly)
import { applyMigrations } from "./migrations.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL");
if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
const applied = await applyMigrations(url);
console.log(`Reset schema and applied ${applied.length} migration(s): ${applied.join(", ")}`);
