/**
 * Point d'entrée des Cloud Functions (2nd gen, Node 22) — multi-écoles.
 *
 * Callables (région FUNCTIONS_REGION) :
 *   createSchool, createSchoolUser, resetUserPassword, setMemberRole
 * HTTP : api (GET /api/health seulement, /api/** via Hosting ; rapport IA retiré, D76)
 * Triggers Firestore : suspension des comptes à l'archivage des fiches.
 * Planifiée : scheduledFirestoreExport (sauvegarde quotidienne, omise tant que
 * BACKUP_ENABLED n'est pas true ; D47).
 */
import { setGlobalOptions } from "firebase-functions/v2";

import { FUNCTIONS_REGION } from "./config.js";
import * as archiveSync from "./tenant/archiveSync.js";

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 });

export { createSchool, createSchoolUser, resetUserPassword, setMemberRole } from "./tenant/accounts.js";
export { api } from "./tenant/api.js";
export { scheduledFirestoreExport } from "./backup.js";

/**
 * Dans certains environnements (proxy sortant qui intercepte même 127.0.0.1),
 * l'émulateur Functions ne parvient pas à enregistrer les triggers Firestore et
 * refuse de démarrer. EMULATOR_SKIP_FIRESTORE_TRIGGERS=true permet alors de
 * tester les autres fonctions. Sans effet hors émulateur (déploiement réel).
 */
const skipTriggers = process.env.FUNCTIONS_EMULATOR === "true" && process.env.EMULATOR_SKIP_FIRESTORE_TRIGGERS === "true";

export const syncAccountsOnTeacherArchive = skipTriggers ? undefined : archiveSync.syncAccountsOnTeacherArchive;
export const syncAccountsOnStudentArchive = skipTriggers ? undefined : archiveSync.syncAccountsOnStudentArchive;
