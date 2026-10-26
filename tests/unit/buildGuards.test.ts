/** Garde-fous du build de production (D70). */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

import { committedProductionProjectId, productionBuildProblems, rolePreviewBuildProblems, rolePreviewBundleProblems } from "../../scripts/dev/buildGuards";

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

describe("aperçu par rôle (D95) : jamais pour la prod", () => {
  const PROD = "projet-prod";
  it("en production, drapeau vrai pour le projet de prod : refusé (quelle que soit la casse)", () => {
    expect(rolePreviewBuildProblems("production", { VITE_ENABLE_ROLE_PREVIEW: "true", VITE_FIREBASE_PROJECT_ID: PROD }, PROD)).toHaveLength(1);
    expect(rolePreviewBuildProblems("production", { VITE_ENABLE_ROLE_PREVIEW: " TRUE ", VITE_FIREBASE_PROJECT_ID: ` ${PROD} ` }, PROD)).toHaveLength(1);
  });
  it("en production, drapeau vrai sur le projet de dev (étape dev de deploy.yml) : accepté", () => {
    expect(rolePreviewBuildProblems("production", { VITE_ENABLE_ROLE_PREVIEW: "true", VITE_FIREBASE_PROJECT_ID: "projet-dev" }, PROD)).toEqual([]);
  });
  it("en production, projet de prod introuvable : drapeau refusé par prudence", () => {
    expect(rolePreviewBuildProblems("production", { VITE_ENABLE_ROLE_PREVIEW: "true", VITE_FIREBASE_PROJECT_ID: "projet-dev" }, undefined)).toHaveLength(1);
  });
  it("drapeau absent ou faux, ou mode développement : rien à signaler", () => {
    expect(rolePreviewBuildProblems("production", { VITE_FIREBASE_PROJECT_ID: PROD }, PROD)).toEqual([]);
    expect(rolePreviewBuildProblems("production", { VITE_ENABLE_ROLE_PREVIEW: "false", VITE_FIREBASE_PROJECT_ID: PROD }, PROD)).toEqual([]);
    expect(rolePreviewBuildProblems("development", { VITE_ENABLE_ROLE_PREVIEW: "true", VITE_FIREBASE_PROJECT_ID: "demo-quran-school" }, PROD)).toEqual([]);
  });
  it("les fichiers réels : .env.production n'active pas le drapeau et .env.development l'active", () => {
    const prodEnv = loadEnv("production", process.cwd(), "VITE_");
    expect(prodEnv.VITE_ENABLE_ROLE_PREVIEW).toBeUndefined();
    expect(rolePreviewBuildProblems("production", prodEnv, committedProductionProjectId(process.cwd()))).toEqual([]);
    expect(committedProductionProjectId(process.cwd())).toBeTruthy();
    expect(loadEnv("development", process.cwd(), "VITE_").VITE_ENABLE_ROLE_PREVIEW).toBe("true");
    // Même avec le drapeau forcé, le projet de prod versionné est refusé.
    expect(rolePreviewBuildProblems("production", { ...prodEnv, VITE_ENABLE_ROLE_PREVIEW: "true" }, committedProductionProjectId(process.cwd()))).toHaveLength(1);
  });
  it("bundle : sans drapeau, aucun module de src/rolePreview ; avec drapeau, libre", () => {
    const ids = ["/x/src/App.tsx", "/x/src/rolePreview/RolePreviewControl.tsx"];
    expect(rolePreviewBundleProblems(false, ids)).toHaveLength(1);
    expect(rolePreviewBundleProblems(false, ["/x/src/App.tsx"])).toEqual([]);
    expect(rolePreviewBundleProblems(true, ids)).toEqual([]);
  });
});
