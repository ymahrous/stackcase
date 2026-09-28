import { applyMigrations } from "../../scripts/migrations";

/** Recreates the test database schema from prisma/migrations before the integration suite runs. */
export default async function setup() {
  await applyMigrations(
    process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/stackcase_test",
  );
}
