/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React  from "react";
import { RealmSimDB } from "../../db";
import { changeOwnPassword, updateOwnUserFields, updateOwnMemberFields, describeFirebaseError } from "../../firebase";
import { SystemSettings, AppUser } from "../../types";
import { validateNewPassword } from "../../security/accounts";
import { isPrimaryDirector } from "../helpers";
import type { DerivedScope } from "../scope";

export function useProfileActions(s: DerivedScope) {
  const {
    accountOwnerName,
    activeSchoolId,
    addSysNotification,
    currentRole,
    currentUser,
    mustChangePassword,
    profileCurrentPassword,
    profileFullName,
    profilePassword,
    setCurrentUser,
    setProfileCurrentPassword,
    setProfileError,
    setProfileFullName,
    setProfilePassword,
    setProfilePhone,
    setProfileSaving,
    setShowProfileEditModal,
    setSystemSettings,
    systemSettings,
  } = s;

  const handleOpenProfileModal = () => {
    if (currentUser) {
      setProfileFullName(currentUser.fullName || "");
      setProfilePhone(currentUser.username || "");
    } else {
      setProfileFullName(accountOwnerName);
      setProfilePhone("");
    }
    setProfilePassword("");
    setProfileCurrentPassword("");
    setProfileError("");
    setShowProfileEditModal(true);
  };
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if (!profileFullName.trim()) {
      setProfileError("يرجى إدخال الاسم الكامل.");
      return;
    }
    if (!currentUser) return;

    const newPassword = profilePassword;
    if (mustChangePassword && !newPassword) {
      setProfileError("يجب اختيار كلمة مرور جديدة قبل متابعة استعمال المنظومة.");
      return;
    }
    if (newPassword) {
      const pwError = validateNewPassword(newPassword);
      if (pwError) {
        setProfileError(pwError);
        return;
      }
    }

    setProfileSaving(true);
    try {
      // 1. Mot de passe : directement dans Firebase Auth (jamais dans Firestore).
      if (newPassword) {
        await changeOwnPassword(newPassword, profileCurrentPassword || undefined);
      }
      // 2. Champs autorisés de son propre compte (profil global et appartenance).
      const uid = currentUser.uid || currentUser.id;
      const patch: Partial<AppUser> = {};
      if (profileFullName.trim() !== currentUser.fullName && activeSchoolId) {
        await updateOwnMemberFields(activeSchoolId, uid, { fullName: profileFullName.trim() });
        patch.fullName = profileFullName.trim();
      }
      if (newPassword) {
        await updateOwnUserFields(uid, { mustChangePassword: false, passwordChangedAt: new Date().toISOString() });
        patch.mustChangePassword = false;
      }
      setCurrentUser({ ...currentUser, ...patch });
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setProfileError(describeFirebaseError(err));
      setProfileSaving(false);
      return;
    }
    setProfileSaving(false);

    if (currentRole === "مدير" && systemSettings && systemSettings.directorName !== profileFullName.trim() && isPrimaryDirector(currentUser)) {
      // Seul le nom du directeur est écrit (F1) : les autres paramètres de l'école
      // ne sont jamais recopiés depuis l'état local, qui peut encore contenir les
      // valeurs par défaut si les paramètres ne sont pas arrivés du serveur.
      const directorName = profileFullName.trim();
      RealmSimDB.updateSystemSettingsFields({ directorName });
      setSystemSettings((prev: SystemSettings | null) => (prev ? { ...prev, directorName } : prev));
    }

    addSysNotification(
      "تعديل البيانات الشخصية",
      `تم تحديث بيانات الملف الشخصي لـ (${profileFullName.trim()}) بنجاح.`,
      "نجاح"
    );
    setProfilePassword("");
    setProfileCurrentPassword("");
    alert(newPassword ? "تم تغيير كلمة المرور وتحديث الملف الشخصي بنجاح!" : "تم تحديث بيانات الملف الشخصي بنجاح!");
    setShowProfileEditModal(false);
  };

  return {
    handleOpenProfileModal,
    handleSaveProfile,
  };
}
