/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clearLocalCache, ensureCacheOwner, purgeLegacySensitiveStorage, setActiveSchool } from "../db";
import { signInWithUsername, signOutUser, fetchUserProfile, fetchMember, fetchSchool, listAllSchools, isCurrentUserSuperAdmin, updateOwnUserFields, updateOwnMemberFields, createSchoolRemote, describeFirebaseError, getIdToken, auth } from "../firebase";
import { UserProfile, SchoolInfo } from "../types";
import { clearSchoolCache, readLastSchool, rememberLastSchool } from "../cache/localCache";
import { mergeSessionProfile } from "../app/helpers";
import type { CoreScope } from "../app/scope";

export function useSessionActions(s: CoreScope) {
  const {
    activeSchoolId,
    authUid,
    currentUser,
    loadDatabase,
    loginInProgressRef,
    loginPassword,
    loginUsername,
    paymentsLoadedRef,
    schools,
    setActiveSchoolId,
    setActiveTab,
    setActivities,
    setActivityExpenses,
    setActivityParticipants,
    setAppUsers,
    setAttendance,
    setAuthChecking,
    setAuthUid,
    setClasses,
    setCurrentUser,
    setDailyProgress,
    setExpenses,
    setGrades,
    setIsSuperAdmin,
    setLoginError,
    setLoginLoading,
    setLoginPassword,
    setLoginUsername,
    setNotifications,
    setOtherIncomes,
    setPayments,
    setSalaryPayments,
    setSchoolBusy,
    setSchoolError,
    setSchools,
    setSelectedLabStudentId,
    setSelectedStudent,
    setShowProfileEditModal,
    setShowSchoolPicker,
    setStudents,
    setSystemSettings,
    setTeachers,
    setUserProfile,
    unsubscribeAllRef,
    userProfile,
  } = s;

  /**
   * Profil de session : `users/{uid}` (profil global, écoles accessibles),
   * claim super-admin, puis liste des écoles accessibles.
   */
  const loadUserSession = async (uid: string): Promise<{ profile: UserProfile; superAdmin: boolean; schools: SchoolInfo[] } | { error: string }> => {
    const [profile, superAdmin] = await Promise.all([fetchUserProfile(uid), isCurrentUserSuperAdmin()]);
    if (!profile && !superAdmin) {
      return { error: "هذا الحساب غير مرتبط بأي مدرسة في المنظومة. يرجى التواصل مع إدارة الجمعية." };
    }
    let list: SchoolInfo[] = [];
    if (superAdmin) {
      list = await listAllSchools();
    } else {
      const fetched = await Promise.all((profile?.schoolIds || []).map((id) => fetchSchool(id).catch(() => null)));
      list = fetched.filter((x): x is SchoolInfo => !!x);
    }
    list.sort((x, y) => (x.name || x.id).localeCompare(y.name || y.id, "ar"));
    const effectiveProfile: UserProfile = profile || { uid, username: auth.currentUser?.email?.split("@")[0] || "", schoolIds: [] };
    return { profile: effectiveProfile, superAdmin, schools: list };
  };

  /** Remet à zéro tout l'état de données (déconnexion, changement d'école). */
  const resetSessionState = () => {
    setStudents([]);
    setTeachers([]);
    setClasses([]);
    setAttendance([]);
    setGrades([]);
    setPayments([]);
    setNotifications([]);
    setAppUsers([]);
    setDailyProgress([]);
    setOtherIncomes([]);
    setSalaryPayments([]);
    setExpenses([]);
    setActivities([]);
    setActivityParticipants([]);
    setActivityExpenses([]);
    setSystemSettings(null);
    setSelectedStudent(null);
    setSelectedLabStudentId("");
    paymentsLoadedRef.current = false;
  };

  /**
   * Entrée dans une école : lecture de l'appartenance (rôle, liens), puis
   * cloisonnement du cache. Changer d'école = désabonnement (effet de
   * synchronisation), purge de l'état et du cache de l'école quittée,
   * réabonnement.
   */
  const enterSchool = async (schoolId: string, uid: string, profile: UserProfile | null): Promise<string | null> => {
    const member = await fetchMember(schoolId, uid).catch(() => null);
    if (!member) return "لست عضواً في هذه المدرسة.";
    if (member.isActive === false) return "حسابك موقوف في هذه المدرسة. يرجى التواصل مع إدارتها.";

    const previous = activeSchoolId;
    unsubscribeAllRef.current(); // plus aucune écoute de l'école quittée
    setActiveSchool(null); // les derniers instantanés de l'école quittée n'écrivent plus le cache
    if (previous && previous !== schoolId) clearSchoolCache(previous);
    resetSessionState();
    setActiveSchool(schoolId);
    setActiveSchoolId(schoolId);
    rememberLastSchool(schoolId);
    const merged = mergeSessionProfile(member, profile, uid, schoolId);
    loadDatabase(merged.role);
    setCurrentUser(merged);
    setActiveTab("dashboard");
    setShowSchoolPicker(false);
    setSchoolError("");
    if (profile && profile.lastSchoolId !== schoolId) {
      updateOwnUserFields(uid, { lastSchoolId: schoolId }).catch((err) => console.warn("lastSchoolId update failed:", err));
    }
    updateOwnMemberFields(schoolId, uid, { lastLogin: new Date().toISOString() }).catch((err) => console.warn("lastLogin update failed:", err));
    return null;
  };

  /** Après authentification : choix automatique de l'école ou page de choix. */
  const startSession = async (uid: string): Promise<string | null> => {
    const res = await loadUserSession(uid);
    if ("error" in res) return res.error;
    ensureCacheOwner(uid);
    setAuthUid(uid);
    setUserProfile(res.profile);
    setIsSuperAdmin(res.superAdmin);
    setSchools(res.schools);

    const memberOf = new Set(res.profile.schoolIds || []);
    const candidates = res.schools.filter((sc) => memberOf.has(sc.id));
    const remembered = [res.profile.lastSchoolId, readLastSchool()].find((id) => id && candidates.some((sc) => sc.id === id));
    const target = remembered || (candidates.length === 1 ? candidates[0].id : null);
    if (target) {
      const err = await enterSchool(target, uid, res.profile);
      if (!err) return null;
      setSchoolError(err);
    }
    // Plusieurs écoles (ou super-admin) : page de choix.
    setCurrentUser(null);
    setShowSchoolPicker(true);
    return null;
  };

  const handleSelectSchool = async (schoolId: string) => {
    if (!authUid) return;
    setSchoolBusy(true);
    try {
      const err = await enterSchool(schoolId, authUid, userProfile);
      if (err) setSchoolError(err);
    } catch (e) {
      console.error("Enter school failed:", e);
      setSchoolError(describeFirebaseError(e));
    } finally {
      setSchoolBusy(false);
    }
  };

  /** Création d'une école (super-admin, Cloud Function createSchool). */
  const handleCreateSchool = async (schoolId: string, name: string) => {
    setSchoolBusy(true);
    setSchoolError("");
    try {
      await createSchoolRemote({ schoolId, name, makeMeDirector: true });
      if (authUid) {
        // Le jeton et le profil changent : on recharge la session.
        await auth.currentUser?.getIdToken(true);
        const res = await loadUserSession(authUid);
        if (!("error" in res)) {
          setUserProfile(res.profile);
          setSchools(res.schools);
        }
      }
      return true;
    } catch (e) {
      console.error("Create school failed:", e);
      setSchoolError(describeFirebaseError(e));
      return false;
    } finally {
      setSchoolBusy(false);
    }
  };

  /** Retour à la page de choix d'école (désabonnement et purge de l'école active). */
  const handleOpenSchoolPicker = () => {
    unsubscribeAllRef.current();
    setActiveSchool(null);
    if (activeSchoolId) clearSchoolCache(activeSchoolId);
    resetSessionState();
    setActiveSchoolId(null);
    setCurrentUser(null);
    setShowSchoolPicker(true);
  };

  /** Déconnexion réelle : Firebase Auth + purge du cache local. */
  const handleLogout = async (reason?: string) => {
    // Écoutes coupées et école active retirée AVANT tout : plus aucune écriture du cache.
    unsubscribeAllRef.current();
    setActiveSchool(null);
    clearLocalCache();
    try {
      await signOutUser();
    } catch (e) {
      console.error("Firebase sign-out error:", e);
    }
    clearLocalCache();
    resetSessionState();
    setActiveSchoolId(null);
    setSchools([]);
    setUserProfile(null);
    setIsSuperAdmin(false);
    setShowSchoolPicker(false);
    setAuthUid(null);
    setCurrentUser(null);
    setActiveTab("dashboard");
    setShowProfileEditModal(false);
    if (reason) setLoginError(reason);
  };

  // Démarrage : purge des traces de la version mono-école, puis restauration de
  // la session par Firebase Auth (jamais depuis localStorage).
  useEffect(() => {
    purgeLegacySensitiveStorage();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUid(null);
        setCurrentUser(null);
        setAuthChecking(false);
        return;
      }
      if (loginInProgressRef.current) return; // pris en charge par handleLoginSubmit
      try {
        const err = await startSession(fbUser.uid);
        if (err) {
          await signOutUser();
          clearLocalCache();
          setLoginError(err);
        }
      } catch (e) {
        console.error("Session restore error:", e);
        setLoginError("تعذر التحقق من الحساب. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.");
      } finally {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);
  /**
   * Connexion (Lot 0) : Firebase Auth D'ABORD, puis lecture du lien
   * d'autorisation et du profil. Aucun mot de passe n'est comparé côté client
   * et aucun compte n'est créé à la connexion.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    loginInProgressRef.current = true;

    try {
      const inputUsername = loginUsername.trim();
      const inputPassword = loginPassword;

      if (!inputUsername || !inputPassword.trim()) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور");
        return;
      }

      let credential;
      try {
        credential = await signInWithUsername(inputUsername, inputPassword);
      } catch (authErr: any) {
        const code = authErr?.code || "";
        if (code === "auth/network-request-failed") {
          setLoginError("تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.");
        } else if (code === "auth/too-many-requests") {
          setLoginError("محاولات كثيرة غير ناجحة. يرجى الانتظار قليلاً ثم المحاولة من جديد.");
        } else if (code === "auth/user-disabled") {
          setLoginError("هذا الحساب معطل حالياً. يرجى التواصل مع إدارة الجمعية.");
        } else {
          setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
        return;
      }

      const err = await startSession(credential.user.uid);
      if (err) {
        await signOutUser();
        setLoginError(err);
        return;
      }
      setLoginUsername("");
      setLoginPassword("");
      updateOwnUserFields(credential.user.uid, { lastLogin: new Date().toISOString() })
        .catch((e) => console.warn("lastLogin update failed:", e));
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      loginInProgressRef.current = false;
      setLoginLoading(false);
      setAuthChecking(false);
    }
  };

  return {
    loadUserSession,
    resetSessionState,
    enterSchool,
    startSession,
    handleSelectSchool,
    handleCreateSchool,
    handleOpenSchoolPicker,
    handleLogout,
    handleLoginSubmit,
  };
}
