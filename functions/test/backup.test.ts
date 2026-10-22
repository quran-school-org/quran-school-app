/**
 * Sauvegarde planifiée (D47) : logique testée par appel direct, avec des
 * dépendances simulées (les émulateurs ne savent pas exporter Firestore).
 */
import { describe, expect, it } from "vitest";

import { buildExportRequest, expiredExports, exportPrefix, parseExportDate, runBackup, type BackupDeps } from "../src/backup.js";

const NOW = new Date("2026-10-22T01:30:00.123Z");
const DB = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";

describe("sauvegarde Firestore : requête et rétention", () => {
  it("export complet de la base nommée vers un préfixe horodaté", () => {
    expect(exportPrefix(DB, NOW)).toBe(`firestore/${DB}/2026-10-22T01-30-00Z/`);
    expect(exportPrefix("(default)", NOW)).toBe("firestore/default/2026-10-22T01-30-00Z/");
    expect(buildExportRequest("mon-projet-dev", DB, "kuttab-sauvegardes", NOW)).toEqual({
      name: `projects/mon-projet-dev/databases/${DB}`,
      outputUriPrefix: `gs://kuttab-sauvegardes/firestore/${DB}/2026-10-22T01-30-00Z`,
      collectionIds: [],
    });
    for (const bad of ["", "gs://x", "a", "Bucket", "x/../y"]) expect(() => buildExportRequest("p", DB, bad, NOW), bad).toThrow();
  });

  it("rétention : supprime au-delà de N jours, garde toujours les 3 plus récents, ignore les noms inconnus", () => {
    const p = (iso: string) => `firestore/${DB}/${iso}/`;
    const prefixes = [p("2026-10-21T01-30-00Z"), p("2026-09-01T01-30-00Z"), p("2026-09-20T01-30-00Z"), p("2026-10-20T01-30-00Z"), `firestore/${DB}/manuel-avant-bascule/`, p("2026-08-01T01-30-00Z")];
    expect(parseExportDate(p("2026-09-01T01-30-00Z"))?.toISOString()).toBe("2026-09-01T01:30:00.000Z");
    expect(parseExportDate(`firestore/${DB}/manuel-avant-bascule/`)).toBeNull();
    expect(expiredExports(prefixes, NOW, 30).sort()).toEqual([p("2026-08-01T01-30-00Z"), p("2026-09-01T01-30-00Z")]);
    // Panne longue : tous les exports sont anciens, les 3 plus récents restent.
    expect(expiredExports([p("2026-01-01T00-00-00Z"), p("2026-01-02T00-00-00Z"), p("2026-01-03T00-00-00Z"), p("2026-01-04T00-00-00Z")], NOW, 30)).toEqual([p("2026-01-01T00-00-00Z")]);
    expect(expiredExports(prefixes, NOW, 0)).toEqual([]);
  });
});

describe("runBackup", () => {
  function fakeDeps(overrides: Partial<BackupDeps> = {}) {
    const calls = { exports: [] as unknown[], deleted: [] as string[], listed: [] as string[] };
    const existing = [`firestore/${DB}/2026-08-01T01-30-00Z/`, `firestore/${DB}/2026-10-19T01-30-00Z/`, `firestore/${DB}/2026-10-20T01-30-00Z/`, `firestore/${DB}/2026-10-21T01-30-00Z/`];
    const deps: BackupDeps = {
      projectId: "mon-projet-dev", databaseId: DB, bucket: "kuttab-sauvegardes", retentionDays: 30, now: NOW,
      exportDocuments: async (req) => { calls.exports.push(req); return "projects/mon-projet-dev/databases/x/operations/op1"; },
      listExportPrefixes: async (root) => { calls.listed.push(root); return [...existing, exportPrefix(DB, NOW)]; },
      deletePrefix: async (prefix) => { calls.deleted.push(prefix); },
      ...overrides,
    };
    return { deps, calls };
  }

  it("exporte puis applique la rétention", async () => {
    const { deps, calls } = fakeDeps();
    const res = await runBackup(deps);
    expect(res.status).toBe("exported");
    expect(calls.exports).toHaveLength(1);
    expect(calls.listed).toEqual([`firestore/${DB}/`]);
    expect(calls.deleted).toEqual([`firestore/${DB}/2026-08-01T01-30-00Z/`]);
    expect(res.operation).toContain("op1");
  });

  it("sans bucket : ne fait rien", async () => {
    const { deps, calls } = fakeDeps({ bucket: "" });
    expect((await runBackup(deps)).status).toBe("skipped");
    expect(calls.exports).toHaveLength(0);
  });

  it("export en échec : aucune suppression (l'erreur remonte, Cloud Scheduler réessaie)", async () => {
    const { deps, calls } = fakeDeps({ exportDocuments: async () => { throw new Error("PERMISSION_DENIED"); } });
    await expect(runBackup(deps)).rejects.toThrow("PERMISSION_DENIED");
    expect(calls.deleted).toHaveLength(0);
  });
});
