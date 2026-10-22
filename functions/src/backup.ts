/**
 * Sauvegarde quotidienne de Firestore (D47) : export géré vers un bucket Cloud
 * Storage, avec rétention.
 *
 * - Fonction planifiée `scheduledFirestoreExport` (Cloud Scheduler, chaque nuit
 *   à 02:30 heure du Maroc). OMISE du déploiement tant que BACKUP_ENABLED
 *   n'est pas `true` dans functions/.env.<projet> : un premier déploiement ne
 *   crée donc ni tâche planifiée ni dépendance à Cloud Scheduler.
 * - Export complet de la base (toutes collections) sous
 *   gs://<BACKUP_BUCKET>/firestore/<base>/<AAAA-MM-JJTHH-MM-SSZ>/.
 * - Rétention : les exports plus anciens que BACKUP_RETENTION_DAYS sont
 *   supprimés après un export réussi (en plus de la règle de cycle de vie du
 *   bucket, filet de sécurité décrit dans docs/runbooks/SAUVEGARDES.md).
 * - Compte d'exécution dédié `firestore-backup@<projet>` (rôles : export
 *   Firestore, écriture et suppression dans ce seul bucket).
 * La logique est pure et testée par injection (functions/test/backup.test.ts) :
 * les émulateurs ne savent pas exporter.
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineBoolean, defineInt, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";

import { FIRESTORE_DATABASE_ID, FUNCTIONS_REGION } from "./config.js";

export const BACKUP_ENABLED = defineBoolean("BACKUP_ENABLED", {
  default: false,
  description: "Déployer la sauvegarde planifiée de Firestore (exige le bucket et le compte firestore-backup).",
});
export const BACKUP_BUCKET = defineString("BACKUP_BUCKET", {
  default: "",
  description: "Bucket des exports Firestore (sans gs://).",
});
export const BACKUP_RETENTION_DAYS = defineInt("BACKUP_RETENTION_DAYS", {
  default: 30,
  description: "Nombre de jours de conservation des exports.",
});

export const EXPORT_ROOT = "firestore";

/** Préfixe d'un export : firestore/<base>/<horodatage ISO sans « : »>/. */
export function exportPrefix(databaseId: string, now: Date): string {
  const stamp = now.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
  const db = databaseId === "(default)" ? "default" : databaseId;
  return `${EXPORT_ROOT}/${db}/${stamp}/`;
}

/** Requête d'export pour l'API Firestore Admin. */
export function buildExportRequest(projectId: string, databaseId: string, bucket: string, now: Date) {
  if (!/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(bucket)) throw new Error("BACKUP_BUCKET invalide");
  if (!projectId) throw new Error("projet inconnu");
  return {
    name: `projects/${projectId}/databases/${databaseId}`,
    outputUriPrefix: `gs://${bucket}/${exportPrefix(databaseId, now)}`.replace(/\/$/, ""),
    collectionIds: [] as string[], // toutes les collections
  };
}

/** Date d'un préfixe d'export (null si le nom n'est pas reconnu : jamais supprimé). */
export function parseExportDate(prefix: string): Date | null {
  const m = prefix.match(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z\/?$/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Préfixes d'export à supprimer : plus anciens que la rétention, en gardant
 * TOUJOURS au moins les `keepAtLeast` plus récents (une panne de plusieurs jours
 * ne vide jamais le bucket).
 */
export function expiredExports(prefixes: string[], now: Date, retentionDays: number, keepAtLeast = 3): string[] {
  if (!(retentionDays >= 1)) return [];
  const dated = prefixes
    .map((p) => ({ p, d: parseExportDate(p) }))
    .filter((x): x is { p: string; d: Date } => x.d !== null)
    .sort((a, b) => b.d.getTime() - a.d.getTime());
  const limit = now.getTime() - retentionDays * 86_400_000;
  return dated.slice(keepAtLeast).filter((x) => x.d.getTime() < limit).map((x) => x.p);
}

export interface BackupDeps {
  projectId: string;
  databaseId: string;
  bucket: string;
  retentionDays: number;
  now: Date;
  /** Lance l'export et attend sa fin ; renvoie le nom de l'opération. */
  exportDocuments: (req: ReturnType<typeof buildExportRequest>) => Promise<string>;
  /** Préfixes d'export existants (ex. firestore/<base>/<stamp>/). */
  listExportPrefixes: (root: string) => Promise<string[]>;
  /** Supprime tous les objets sous un préfixe. */
  deletePrefix: (prefix: string) => Promise<void>;
}

export interface BackupResult {
  status: "skipped" | "exported";
  outputUriPrefix?: string;
  operation?: string;
  deleted: string[];
}

export async function runBackup(deps: BackupDeps): Promise<BackupResult> {
  if (!deps.bucket) {
    logger.warn("backup.skipped", { reason: "BACKUP_BUCKET vide" });
    return { status: "skipped", deleted: [] };
  }
  const req = buildExportRequest(deps.projectId, deps.databaseId, deps.bucket, deps.now);
  const operation = await deps.exportDocuments(req);
  logger.info("backup.exported", { database: deps.databaseId, outputUriPrefix: req.outputUriPrefix, operation });
  const db = deps.databaseId === "(default)" ? "default" : deps.databaseId;
  const root = `${EXPORT_ROOT}/${db}/`;
  const prefixes = await deps.listExportPrefixes(root);
  const deleted = expiredExports(prefixes, deps.now, deps.retentionDays);
  for (const p of deleted) await deps.deletePrefix(p);
  if (deleted.length) logger.info("backup.pruned", { count: deleted.length, oldest: deleted[deleted.length - 1] });
  return { status: "exported", outputUriPrefix: req.outputUriPrefix, operation, deleted };
}

/** Dépendances réelles (API Firestore Admin, Cloud Storage), chargées à l'exécution. */
async function realDeps(now: Date): Promise<BackupDeps> {
  const { v1 } = await import("@google-cloud/firestore");
  const { Storage } = await import("@google-cloud/storage");
  const client = new v1.FirestoreAdminClient();
  const projectId = process.env.GCLOUD_PROJECT || (await client.getProjectId());
  const bucketName = BACKUP_BUCKET.value();
  const bucket = new Storage().bucket(bucketName);
  return {
    projectId,
    databaseId: FIRESTORE_DATABASE_ID.value(),
    bucket: bucketName,
    retentionDays: BACKUP_RETENTION_DAYS.value(),
    now,
    exportDocuments: async (req) => {
      const [operation] = await client.exportDocuments(req);
      await operation.promise();
      return String(operation.name || "");
    },
    listExportPrefixes: async (root) => {
      const [, , response] = await bucket.getFiles({ prefix: root, delimiter: "/", autoPaginate: false });
      return ((response as { prefixes?: string[] } | undefined)?.prefixes) || [];
    },
    deletePrefix: async (prefix) => {
      await bucket.deleteFiles({ prefix, force: true });
    },
  };
}

export const scheduledFirestoreExport = onSchedule(
  {
    schedule: "30 2 * * *",
    timeZone: "Africa/Casablanca",
    region: FUNCTIONS_REGION,
    omit: BACKUP_ENABLED.equals(false),
    serviceAccount: "firestore-backup@",
    timeoutSeconds: 1800,
    memory: "256MiB",
    retryCount: 1,
  },
  async () => {
    await runBackup(await realDeps(new Date()));
  },
);
