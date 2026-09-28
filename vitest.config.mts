import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/stackcase_test";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside React Server Components; tests import server modules directly.
      "server-only": fileURLToPath(new URL("./tests/setup/empty.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    // Fixture values; real values come from the environment at build time.
    env: {
      NEXT_PUBLIC_SITE_URL: "https://stackcase.test",
      DATABASE_URL: TEST_DATABASE_URL,
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup/unit.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup/integration.setup.ts"],
          globalSetup: ["./tests/setup/integration.global.ts"],
          // One shared database: run files one after another.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Every source folder counts; only generated code is excluded.
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "emails/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "proxy.ts",
        "instrumentation.ts",
      ],
      exclude: ["lib/generated/**", "**/*.d.ts"],
      thresholds: { lines: 98, functions: 97, statements: 97, branches: 92 },
      reporter: ["text-summary", "html", "lcov"],
    },
  },
});
