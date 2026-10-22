/**
 * Revue adversariale du durcissement — sauvegarde planifiée (D47, D68).
 * Hypothèses : suppression d'exports par des préfixes plantés ou un listage
 * inattendu, rétention mal paramétrée, panne prolongée. Appel direct.
 */
import { describe, expect, it } from "vitest";

import { expiredExports, exportPrefix, isExportPrefixUnder, runBackup, type BackupDeps } from "../src/backup.js";

const NOW = new Date("2026-10-22T01:30:00.000Z");
const DB = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";
const ROOT = `firestore/${DB}/`;
const p = (iso: string) => `${ROOT}${iso}/`;

function deps(listed: string[], overrides: Partial<BackupDeps> = {}) {
  const deleted: string[] = [];
  const d: BackupDeps = {
    projectId: "mon-projet-dev", databaseId: DB, bucket: "kuttab-sauvegardes", retentionDays: 30, now: NOW,
    exportDocuments: async () => "op",
    listExportPrefixes: async () => listed,
    deletePrefix: async (prefix) => { deleted.push(prefix); },
    ...overrides,
  };
  return { d, deleted };
}

describe("hypothèses réfutées : sauvegarde et rétention", () => {
  it("des préfixes plantés datés du futur n'entraînent jamais la suppression d'un export récent", () => {
    const planted = [p("2099-01-01T00-00-00Z"), p("2099-01-02T00-00-00Z"), p("2099-01-03T00-00-00Z")];
    const real = [p("2026-10-21T01-30-00Z"), p("2026-10-20T01-30-00Z"), p("2026-10-01T01-30-00Z"), exportPrefix(DB, NOW)];
    const del = expiredExports([...planted, ...real], NOW, 30);
    expect(del).toEqual([]); // tout ce qui est réel a moins de 30 jours
  });

  it("rétention absurde (0, négative, NaN) : aucune suppression", () => {
    const all = [p("2020-01-01T00-00-00Z"), p("2020-01-02T00-00-00Z"), p("2020-01-03T00-00-00Z"), p("2020-01-04T00-00-00Z")];
    for (const r of [0, -5, Number.NaN]) expect(expiredExports(all, NOW, r)).toEqual([]);
  });

  it("panne de plusieurs mois : les 3 exports les plus récents restent toujours", () => {
    const old = [p("2026-01-01T00-00-00Z"), p("2026-01-02T00-00-00Z"), p("2026-01-03T00-00-00Z"), p("2026-01-04T00-00-00Z"), p("2026-01-05T00-00-00Z")];
    expect(expiredExports(old, NOW, 30).sort()).toEqual([p("2026-01-01T00-00-00Z"), p("2026-01-02T00-00-00Z")]);
  });
});

describe("D68 : seuls les dossiers d'export exacts sont supprimables", () => {
  it("isExportPrefixUnder", () => {
    expect(isExportPrefixUnder(ROOT, p("2026-01-01T00-00-00Z"))).toBe(true);
    for (const bad of ["", ROOT, "firestore/", `manuel/2026-01-01T00-00-00Z/`, `${ROOT}manuel/2026-01-01T00-00-00Z/`, `${ROOT}2026-01-01T00-00-00Z`, `firestore/autre-base/2026-01-01T00-00-00Z/`]) {
      expect(isExportPrefixUnder(ROOT, bad), bad).toBe(false);
    }
  });

  it("un listage qui renvoie des dossiers hors racine (export manuel, autre base) ne les supprime pas", async () => {
    const outside = ["manuel/2020-01-01T00-00-00Z/", "firestore/autre-base/2020-01-01T00-00-00Z/", `${ROOT}manuel/2020-01-01T00-00-00Z/`, ""];
    const inside = [p("2020-01-01T00-00-00Z"), p("2026-10-19T01-30-00Z"), p("2026-10-20T01-30-00Z"), p("2026-10-21T01-30-00Z")];
    const { d, deleted } = deps([...outside, ...inside, exportPrefix(DB, NOW)]);
    const res = await runBackup(d);
    expect(res.status).toBe("exported");
    expect(deleted).toEqual([p("2020-01-01T00-00-00Z")]);
  });
});
