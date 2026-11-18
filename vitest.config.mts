import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": root } },
  test: {
    environment: "jsdom",
    include: ["components/**/*.test.tsx", "lib/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup-ui.ts"],
    coverage: {
      provider: "v8",
      include: ["components/**/*.tsx", "lib/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.*",
        "app/layout.tsx",
        "components/ui/icons.tsx",
        // Image routes and their renderer need next/og; `next build` writes every image.
        "app/**/opengraph-image.tsx",
        "app/**/twitter-image.tsx",
        "app/apple-icon.tsx",
        "lib/og-image.tsx",
        "lib/api/schema.ts",
      ],
      // Feedwatch's own code (app/, lib/, components/feeds/) is held to 100%. components/ui was copied from the LendLoop Frox library
      // with its existing tests; its floor is lower and rises as M3 adds tests for the parts it uses.
      thresholds: {
        perFile: true,
        lines: 90,
        functions: 100,
        statements: 90,
        branches: 75,
        "app/**": { lines: 100, functions: 100, statements: 100, branches: 100 },
        "lib/**": { lines: 100, functions: 100, statements: 100, branches: 100 },
        "components/feeds/**": { lines: 100, functions: 100, statements: 100, branches: 100 },
      },
    },
  },
});
