/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../../db";
import { createSchoolUserRemote, resetUserPasswordRemote, describeFirebaseError } from "../../firebase";
import { SystemSettings, AppUser } from "../../types";
import { isDirectorRole } from "../../security/access";
import { validateNewPassword } from "../../security/accounts";
import { computeAccountAlignment } from "../../security/accountAlignment";
import { isPrimaryDirector } from "../helpers";
import type { DerivedScope } from "../scope";

export function useAdminActions(s: DerivedScope) {
  const {
    activeSchoolId,
    addSysNotification,
    currentRole,
    mustChangePassword,
    setAppUsers,
    setSystemSettings,
    setTeachers,
    systemSettings,
  } = s;

  const handleSaveSystemSettings = (updatedSettings: SystemSettings) => {
    RealmSimDB.saveSystemSettings(updatedSettings);
    setSystemSettings(updatedSettings);

    if (updatedSettings.directorName && updatedSettings.directorName.trim() && isDirectorRole(currentRole)) {
      const newDirectorName = updatedSettings.directorName.trim();
      const updatedUsers = RealmSimDB.getAppUsers().map(u => {
        if (isPrimaryDirector(u) && u.fullName !== newDirectorName) {
          const uUpdated = { ...u, fullName: newDirectorName };
          RealmSimDB.saveAppUser(uUpdated).catch((err) => console.error("Director name sync failed:", err));
          return uUpdated;
        }
        return u;
      });
      setAppUsers(updatedUsers);
    }

    addSysNotification(
      "تحديث الإعدادات",
      "تم تحديث معلومات الجمعية والإعدادات العامة والرسوم المالية بنجاح.",
      "إداري"
    );
    alert("تم حفظ الإعدادات وتحديث معلومات المؤسسة بنجاح!");
  };

  /** Modification d'un compte existant (directeur uniquement : compte + lien d'autorisation). */
  const handleSaveAppUser = async (user: AppUser) => {
    try {
      await RealmSimDB.saveAppUser(user);
    } catch (err) {
      console.error("Save app user failed:", err);
      alert(describeFirebaseError(err));
      return;
    }

    if (isPrimaryDirector(user) && user.fullName && systemSettings) {
      if (systemSettings.directorName !== user.fullName) {
        // Écriture partielle (F1) : jamais tout l'objet des paramètres.
        const directorName = user.fullName;
        RealmSimDB.updateSystemSettingsFields({ directorName });
        setSystemSettings((prev: SystemSettings | null) => (prev ? { ...prev, directorName } : prev));
      }
    }

    setAppUsers(RealmSimDB.getAppUsers());
    addSysNotification(
      "تحديث صلاحيات المستخدمين",
      `تم حفظ تعديلات حساب المستخدم (${user.fullName}) بنجاح.`,
      "إداري"
    );
    alert("تم حفظ حساب المستخدم والصلاحيات بنجاح!");
  };

  /**
   * Création d'un compte dans l'école active : Cloud Function `createSchoolUser`
   * (compte Firebase Auth + users/{uid} + members/{uid}, nom d'utilisateur
   * unique sur la plateforme, aucun mot de passe stocké). Mot de passe vide =
   * rattacher un compte existant (même personne dans plusieurs écoles).
   */
  const handleCreateAppUser = async (user: AppUser, password: string): Promise<boolean> => {
    if (!activeSchoolId) return false;
    const attachExisting = password === "";
    const pwError = attachExisting ? null : validateNewPassword(password);
    if (pwError) {
      alert(pwError);
      return false;
    }
    const flags: Record<string, boolean> = {};
    ([
      "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
      "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
      "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
    ] as const).forEach((k) => {
      const v = (user as any)[k];
      if (typeof v === "boolean") flags[k] = v;
    });
    try {
      const res = await createSchoolUserRemote({
        schoolId: activeSchoolId,
        username: user.username,
        password: attachExisting ? undefined : password,
        attachExisting,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        email: user.email,
        permissions: user.permissions,
        linkedTeacherId: user.linkedTeacherId,
        linkedStudentIds: user.linkedStudentIds,
        flags,
      });
      const created: AppUser = { ...user, id: res.uid, uid: res.uid, username: res.username, schoolId: activeSchoolId, mustChangePassword: !attachExisting };
      const next = [...RealmSimDB.getAppUsers().filter(u => u.id !== created.id), created];
      RealmSimDB.setCachedAppUsers(next);
      setAppUsers(next);
      addSysNotification(
        "إنشاء حساب مستخدم",
        `تم إنشاء حساب المستخدم (${user.fullName}) باسم الدخول ${user.username} بنجاح.`,
        "إداري"
      );
      alert(attachExisting
        ? "تمت إضافة الحساب الموجود إلى هذه المدرسة بنجاح."
        : "تم إنشاء الحساب بنجاح. سيُطلب من المستخدم تغيير كلمة المرور عند أول دخول.");
      return true;
    } catch (err) {
      console.error("Create user account failed:", err);
      alert(describeFirebaseError(err));
      return false;
    }
  };

  /** Réinitialisation du mot de passe d'un autre compte (directeur, Cloud Function). */
  const handleResetUserPassword = async (user: AppUser, newPassword: string): Promise<boolean> => {
    const pwError = validateNewPassword(newPassword);
    if (pwError) {
      alert(pwError);
      return false;
    }
    try {
      if (!activeSchoolId) return false;
      await resetUserPasswordRemote(activeSchoolId, user.id, newPassword);
      addSysNotification(
        "إعادة تعيين كلمة المرور",
        `تمت إعادة تعيين كلمة مرور حساب (${user.fullName}). سيُطلب تغييرها عند الدخول القادم.`,
        "إداري"
      );
      alert("تمت إعادة تعيين كلمة المرور بنجاح.");
      return true;
    } catch (err) {
      console.error("Reset password failed:", err);
      alert(describeFirebaseError(err));
      return false;
    }
  };

  const handleDeleteAppUser = async (userId: string) => {
    try {
      await RealmSimDB.deleteAppUser(userId);
    } catch (err) {
      console.error("Delete app user failed:", err);
      alert(describeFirebaseError(err));
      return;
    }
    setAppUsers(RealmSimDB.getAppUsers());
    addSysNotification(
      "حذف مستخدم",
      "تم حذف حساب المستخدم وتجريده من صلاحيات الوصول إلى النظام بنجاح.",
      "تنبيه"
    );
    alert("تم حذف المستخدم بنجاح!");
  };

  /**
   * « مزامنة فورية للأدوار » : action EXPLICITE du directeur. Aligne rôles et
   * statuts des comptes existants sur les fiches (liens explicites), sans créer
   * de compte ni toucher aux mots de passe.
   */
  const handleHarmonizeUsersWithStaff = async () => {
    if (!isDirectorRole(currentRole)) {
      alert("هذه العملية مخصصة للمدير.");
      return;
    }
    const freshStaff = RealmSimDB.getTeachers();
    const freshUsers = RealmSimDB.getAppUsers();
    const changes = computeAccountAlignment(freshUsers, freshStaff, RealmSimDB.getStudents());
    try {
      for (const u of changes) {
        await RealmSimDB.saveAppUser(u);
      }
    } catch (err) {
      console.error("Harmonize users failed:", err);
      alert(describeFirebaseError(err));
    }
    setAppUsers(RealmSimDB.getAppUsers());
    setTeachers(freshStaff);
    addSysNotification(
      "مزامنة الحسابات والأدوار",
      `تمت مزامنة أدوار الحسابات مع شؤون العاملين وإيقاف حسابات الأشخاص المؤرشفين (${changes.length} حساب محدث).`,
      "نجاح"
    );
  };

  return {
    handleSaveSystemSettings,
    handleSaveAppUser,
    handleCreateAppUser,
    handleResetUserPassword,
    handleDeleteAppUser,
    handleHarmonizeUsersWithStaff,
  };
}
