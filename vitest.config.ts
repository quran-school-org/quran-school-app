import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Les tests sur émulateur partagent une seule instance : pas de parallélisme entre fichiers.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Couverture des tests unitaires (`npm run test:coverage`) : mesure seulement, sans seuil.
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/i18n-test/**", "src/**/*.d.ts"],
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
