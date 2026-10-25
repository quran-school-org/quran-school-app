/**
 * « Archivage = compte suspendu » (comportement historique conservé), par école.
 *
 * Fiche du personnel ou d'élève archivée → membres liés suspendus dans CETTE
 * école (members.isActive=false, isArchived=true). Le compte Firebase Auth
 * n'est désactivé que si la personne n'a plus aucune appartenance active
 * (elle peut exercer dans une autre école). À la désarchivation, seuls les
 * membres suspendus par archivage sont réactivés. Un parent n'est suspendu que
 * si tous ses enfants liés sont archivés. Le directeur historique (u1), et
 * plus largement tout membre de rôle مدير (A-02, D86), n'est jamais modifié
 * automatiquement.
 */
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

import { adminAuth, adminDb } from "../admin.js";
import { FIRESTORE_DATABASE_ID, FIRESTORE_TRIGGER_REGION } from "../config.js";
import { hasAnyActiveMembership, isSuperAdminAccount } from "./access.js";

type Member = { uid: string; data: FirebaseFirestore.DocumentData };

function membersCol(schoolId: string) {
  return adminDb().collection("schools").doc(schoolId).collection("members");
}

async function collect(snaps: FirebaseFirestore.QuerySnapshot[]): Promise<Member[]> {
  const byId = new Map<string, Member>();
  for (const snap of snaps) snap.forEach((d) => byId.set(d.id, { uid: d.id, data: d.data() }));
  return Array.from(byId.values()).filter((m) => m.data.legacyAppUserId !== "u1");
}

/** Applique le statut d'archivage à un membre ; renvoie true si modifié. */
export async function setMemberArchived(schoolId: string, m: Member, archived: boolean): Promise<boolean> {
  let isActive: boolean;
  if (archived) isActive = false;
  else if (m.data.isArchived === true) isActive = true;
  else return false;
  if (m.data.isActive === isActive && Boolean(m.data.isArchived) === archived) return false;

  await membersCol(schoolId).doc(m.uid).set({ isActive, isArchived: archived, updatedAt: new Date().toISOString(), updatedBy: "syncAccountsOnArchive" }, { merge: true });
  try {
    if (!isActive) {
      if (!(await hasAnyActiveMembership(m.uid)) && !(await isSuperAdminAccount(m.uid))) {
        await adminAuth().updateUser(m.uid, { disabled: true });
        await adminAuth().revokeRefreshTokens(m.uid);
      }
    } else {
      await adminAuth().updateUser(m.uid, { disabled: false });
    }
  } catch (error) {
    logger.warn("Auth status update failed", { uid: m.uid, error: String(error) });
  }
  logger.info("member status synced", { schoolId, uid: m.uid, isActive, archived });
  return true;
}

export const syncAccountsOnTeacherArchive = onDocumentUpdated(
  { document: "schools/{schoolId}/teachers/{teacherId}", database: FIRESTORE_DATABASE_ID, region: FIRESTORE_TRIGGER_REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const archived = Boolean(after.isArchived);
    if (Boolean(before.isArchived) === archived) return;
    const { schoolId, teacherId } = event.params;
    const members = await collect([await membersCol(schoolId).where("linkedTeacherId", "==", teacherId).get()]);
    for (const m of members) {
      if (m.data.role === "طالب" || m.data.role === "ولي أمر") continue;
      // Un directeur ne change que par setMemberRole (réservé aux directeurs) :
      // un إداري qui archive sa fiche ne doit pas pouvoir le suspendre (A-02, D86).
      if (m.data.role === "مدير") {
        logger.info("director left unchanged by archive", { schoolId, uid: m.uid, teacherId });
        continue;
      }
      await setMemberArchived(schoolId, m, archived);
    }
  }
);

export const syncAccountsOnStudentArchive = onDocumentUpdated(
  { document: "schools/{schoolId}/students/{studentId}", database: FIRESTORE_DATABASE_ID, region: FIRESTORE_TRIGGER_REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const archived = Boolean(after.isArchived);
    if (Boolean(before.isArchived) === archived) return;
    const { schoolId, studentId } = event.params;
    const members = await collect([await membersCol(schoolId).where("linkedStudentIds", "array-contains", studentId).get()]);
    const students = adminDb().collection("schools").doc(schoolId).collection("students");
    for (const m of members) {
      if (m.data.role === "طالب") {
        await setMemberArchived(schoolId, m, archived);
      } else if (m.data.role === "ولي أمر") {
        const ids: string[] = Array.isArray(m.data.linkedStudentIds) ? m.data.linkedStudentIds : [];
        const children = await Promise.all(ids.map((id) => students.doc(id).get()));
        const existing = children.filter((c) => c.exists);
        const allArchived = existing.length > 0 && existing.every((c) => c.data()?.isArchived === true);
        await setMemberArchived(schoolId, m, allArchived);
      }
    }
  }
);
