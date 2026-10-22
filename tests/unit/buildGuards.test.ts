/** Garde-fous du build de production (D70). */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

import { productionBuildProblems } from "../../scripts/dev/buildGuards";

describe("productionBuildProblems", () => {
  it("rien à signaler en développement, ni pour un build de production propre", () => {
    expect(productionBuildProblems("development", { VITE_APPCHECK_DEBUG_TOKEN: "abc" })).toEqual([]);
    expect(productionBuildProblems("production", { VITE_FIREBASE_PROJECT_ID: "mon-projet", VITE_APPCHECK_SITE_KEY: "cle" })).toEqual([]);
  });

  it("refuse un jeton de débogage App Check dans un build de production (sauf échappatoire explicite)", () => {
    expect(productionBuildProblems("production", { VITE_APPCHECK_DEBUG_TOKEN: "abc" })).toHaveLength(1);
    expect(productionBuildProblems("production", { VITE_APPCHECK_DEBUG_TOKEN: "abc" }, { ALLOW_APPCHECK_DEBUG_IN_BUILD: "true" })).toEqual([]);
  });

  it("refuse les émulateurs avec un vrai projet", () => {
    expect(productionBuildProblems("production", { VITE_USE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: "mon-projet" })).toHaveLength(1);
  });

  it("le piège réel : Vite charge .env.local en mode production", () => {
    const dir = mkdtempSync(join(tmpdir(), "kuttab-env-"));
    writeFileSync(join(dir, ".env.production"), 'VITE_FIREBASE_PROJECT_ID="mon-projet"\n');
    writeFileSync(join(dir, ".env.local"), 'VITE_APPCHECK_DEBUG_TOKEN="00000000-0000-0000-0000-000000000000"\n');
    const env = loadEnv("production", dir, "VITE_");
    expect(env.VITE_APPCHECK_DEBUG_TOKEN).toBeTruthy();
    expect(productionBuildProblems("production", env)).toHaveLength(1);
    // .env.development.local n'est pas chargé en production.
    const dir2 = mkdtempSync(join(tmpdir(), "kuttab-env-"));
    writeFileSync(join(dir2, ".env.development.local"), 'VITE_APPCHECK_DEBUG_TOKEN="x"\n');
    expect(productionBuildProblems("production", loadEnv("production", dir2, "VITE_"))).toEqual([]);
  });
});
