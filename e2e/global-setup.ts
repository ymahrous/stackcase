import { rm } from "node:fs/promises";
import { E2E_DATABASE_URL, OUTBOX_DIR } from "../playwright.config";
import { applyMigrations } from "../scripts/migrations";

export default async function globalSetup() {
  await applyMigrations(E2E_DATABASE_URL);
  await rm(OUTBOX_DIR, { recursive: true, force: true });
}
