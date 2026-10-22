import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Les tests sur émulateur partagent une seule instance : pas de parallélisme entre fichiers.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
