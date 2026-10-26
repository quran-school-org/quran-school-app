/**
 * Aperçu par rôle (D95) : état et action. Changer de rôle = appeler la Cloud
 * Function setMemberRole sur SON PROPRE uid (rôle et liens réels), puis relire
 * l'appartenance et recharger les données de l'école (enterSchool) : les règles
 * Firestore et l'interface reflètent alors le nouveau rôle, sans simulation.
 */
import { useState } from "react";
import { useApp } from "../app/AppContext";
import { rolePreviewEnabled } from "../config/env";
import { describeFirebaseError, fetchSchoolCollectionOnce, setMemberRoleRemote } from "../firebase";
import type { Class, Student, Teacher, UserRole } from "../types";
import { NO_LINKS, PREVIEW_HOME_ROLE, isRolePreviewAvailable, needsPool, pickPreviewLinks, previewBannerText } from "./rolePreview";

const NO_DATA: Record<string, string> = {
  "ولي أمر": "لا يوجد أي طالب نشط في هذه المدرسة لربطه بحساب ولي أمر.",
  "طالب": "لا يوجد أي طالب نشط في هذه المدرسة لربطه بحساب طالب.",
  "مدرس": "لا توجد في هذه المدرسة بطاقة أستاذ أو محفظ لربطها بحساب مدرس.",
};

export function useRolePreview() {
  const { isSuperAdmin, activeSchoolId, currentUser, currentRole, authUid, userProfile, enterSchool, students, teachers, setShowProfileEditModal } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const available = isRolePreviewAvailable({
    enabled: rolePreviewEnabled,
    isSuperAdmin,
    schoolId: activeSchoolId,
    isMember: !!currentUser && !!authUid && currentUser.schoolId === activeSchoolId,
  });

  const bannerText = previewBannerText(currentRole, currentUser || {}, { students, teachers });

  async function switchTo(role: UserRole): Promise<boolean> {
    // Garde-fous répétés au moment de l'action (jamais confiés au seul affichage).
    if (!available || !activeSchoolId || !authUid) return false;
    if (busy) return false;
    setBusy(true);
    setError("");
    let changed = false;
    let ok = false;
    try {
      let links = NO_LINKS;
      if (needsPool(role)) {
        // Lire toute l'école demande le droit de direction : si le rôle courant ne
        // l'a pas (parent, élève…), on repasse d'abord par « مدير » (vrai changement).
        if (currentRole !== PREVIEW_HOME_ROLE) {
          await setMemberRoleRemote(activeSchoolId, authUid, { role: PREVIEW_HOME_ROLE, linkedTeacherId: null, linkedStudentIds: [] });
          changed = true;
        }
        const [pStudents, pTeachers, pClasses] = await Promise.all([
          fetchSchoolCollectionOnce<Student>(activeSchoolId, "students"),
          fetchSchoolCollectionOnce<Teacher>(activeSchoolId, "teachers"),
          fetchSchoolCollectionOnce<Class>(activeSchoolId, "classes"),
        ]);
        const picked = pickPreviewLinks(role, { students: pStudents, teachers: pTeachers, classes: pClasses });
        if (!picked) {
          setError(NO_DATA[role] || "لا توجد بيانات كافية لهذا الدور في هذه المدرسة.");
          return false;
        }
        links = picked;
      }
      await setMemberRoleRemote(activeSchoolId, authUid, { role, linkedTeacherId: links.linkedTeacherId, linkedStudentIds: links.linkedStudentIds });
      changed = true;
      ok = true;
      return true;
    } catch (e) {
      console.error("Role preview failed:", e);
      setError(describeFirebaseError(e));
      return false;
    } finally {
      // L'appartenance a pu changer même en cas d'échec partiel : on la relit toujours.
      if (changed) {
        try {
          const err = await enterSchool(activeSchoolId, authUid, userProfile);
          if (err) setError(err);
          else if (ok) setShowProfileEditModal(false); // en cas d'échec partiel, la fenêtre reste ouverte avec son message
        } catch (e) {
          setError(describeFirebaseError(e));
        }
      }
      setBusy(false);
    }
  }

  return { available, busy, error, setError, currentRole, bannerText, isPreviewing: available && currentRole !== PREVIEW_HOME_ROLE, switchTo };
}
