import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // `prisma generate` does not need a database, so a placeholder keeps it working without DATABASE_URL.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder@localhost:5432/placeholder",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
