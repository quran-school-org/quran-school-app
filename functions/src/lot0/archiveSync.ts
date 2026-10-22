/**
 * Lot 0 — « archivage = compte suspendu » (comportement existant conservé).
 *
 * Quand une fiche du personnel ou d'un élève passe en archivé (isArchived),
 * les comptes liés sont suspendus : appUsers.isActive=false, authLinks.isActive=false
 * et compte Firebase Auth désactivé. À la désarchivation, seuls les comptes
 * suspendus PAR archivage (isArchived=true) sont réactivés.
 * Un parent n'est suspendu que lorsque TOUS ses enfants liés sont archivés.
 * Le compte directeur principal (u1) n'est jamais modifié.
 *
 * Ce traitement côté serveur couvre le cas d'un إداري qui archive une fiche :
 * les règles Firestore ne lui permettent pas d'écrire les comptes lui-même.
 */
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../admin.js";
import { FIRESTORE_DATABASE_ID, FIRESTORE_TRIGGER_REGION } from "../config.js";

type Account = { id: string; data: FirebaseFirestore.DocumentData };

async function collectAccounts(queries: Promise<FirebaseFirestore.QuerySnapshot>[], docs: Promise<DocumentSnapshot>[]): Promise<Account[]> {
  const byId = new Map<string, Account>();
  for (const snap of await Promise.all(queries)) {
    snap.forEach((d) => byId.set(d.id, { id: d.id, data: d.data() }));
  }
  for (const d of await Promise.all(docs)) {
    if (d.exists) byId.set(d.id, { id: d.id, data: d.data() || {} });
  }
  byId.delete("u1");
  return Array.from(byId.values());
}

/** Applique un statut à un compte (appUsers + authLinks + Firebase Auth). */
export async function setAccountArchived(account: Account, archived: boolean): Promise<boolean> {
  const current = account.data;
  let isActive: boolean;
  if (archived) {
    isActive = false;
  } else if (current.isArchived === true) {
    isActive = true; // réactivation d'un compte suspendu par archivage
  } else {
    return false; // compte suspendu pour une autre raison : on n'y touche pas
  }
  if (current.isActive === isActive && Boolean(current.isArchived) === archived) return false;

  const db = adminDb();
  await db.collection("appUsers").doc(account.id).set({ isActive, isArchived: archived }, { merge: true });
  const authUid = current.authUid;
  if (typeof authUid === "string" && authUid) {
    await db.collection("authLinks").doc(authUid).set({ isActive, updatedAt: new Date().toISOString(), updatedBy: "syncAccountsOnArchive" }, { merge: true });
    try {
      await adminAuth().updateUser(authUid, { disabled: !isActive });
      if (!isActive) await adminAuth().revokeRefreshTokens(authUid);
    } catch (error) {
      logger.warn("Auth status update failed", { authUid, error: String(error) });
    }
  }
  logger.info("account status synced", { appUserId: account.id, isActive, archived });
  return true;
}

export const syncAccountsOnTeacherArchive = onDocumentUpdated(
  { document: "teachers/{teacherId}", database: FIRESTORE_DATABASE_ID, region: FIRESTORE_TRIGGER_REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const archived = Boolean(after.isArchived);
    if (Boolean(before.isArchived) === archived) return;

    const teacherId = event.params.teacherId;
    const db = adminDb();
    const accounts = await collectAccounts(
      [db.collection("appUsers").where("linkedTeacherId", "==", teacherId).get()],
      [db.collection("appUsers").doc(`t_${teacherId}`).get()]
    );
    for (const account of accounts) {
      if (account.data.role === "طالب" || account.data.role === "ولي أمر") continue;
      await setAccountArchived(account, archived);
    }
  }
);

export const syncAccountsOnStudentArchive = onDocumentUpdated(
  { document: "students/{studentId}", database: FIRESTORE_DATABASE_ID, region: FIRESTORE_TRIGGER_REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const archived = Boolean(after.isArchived);
    if (Boolean(before.isArchived) === archived) return;

    const studentId = event.params.studentId;
    const db = adminDb();
    const accounts = await collectAccounts(
      [db.collection("appUsers").where("linkedStudentIds", "array-contains", studentId).get()],
      [db.collection("appUsers").doc(`s_${studentId}`).get(), db.collection("appUsers").doc(`p_${studentId}`).get()]
    );

    for (const account of accounts) {
      if (account.data.role === "طالب") {
        await setAccountArchived(account, archived);
      } else if (account.data.role === "ولي أمر") {
        // Parent : suspendu seulement si tous les enfants liés sont archivés.
        const ids = new Set<string>(Array.isArray(account.data.linkedStudentIds) ? account.data.linkedStudentIds : []);
        if (account.id.startsWith("p_")) ids.add(account.id.slice(2));
        const children = await Promise.all(Array.from(ids).map((id) => db.collection("students").doc(id).get()));
        const existing = children.filter((c) => c.exists);
        const allArchived = existing.length > 0 && existing.every((c) => c.data()?.isArchived === true);
        await setAccountArchived(account, allArchived);
      }
    }
  }
);
