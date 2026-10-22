/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useEffect } from "react";
import { runTransaction } from "firebase/firestore";
import { RealmSimDB } from "../db";
import { subscribeToCollection, subscribeToSettings, subscribeToDocument, subscribeToDocumentsByIds, subscribeToQueryIn, subscribeToStaff, schoolDocRef, sanitizeForFirestore, db } from "../firebase";
import { Student, Teacher, Class, Attendance, Grade, Payment, Notification, AppUser, UserProfile, DailyProgress, OtherIncome, SalaryPayment, Expense, ActivityTrip, ActivityParticipant, ActivityExpense } from "../types";
import { isEducatorRole, isFamilyRole, isOfficeRole, fullyReadableCollections, canReadStaffPrivate } from "../security/access";
import { linkedStudentIdsOf } from "../security/accountAlignment";
import { getOpeningPeriod, monthIndex } from "../school/businessRules";
import { parseClassSchedule, mergeSessionProfile } from "../app/helpers";
import type { SessionScope } from "../app/scope";

export function useSchoolSync(s: SessionScope) {
  const {
    activeSchoolId,
    activities,
    activityExpenses,
    activityParticipants,
    appUsers,
    attendance,
    attendanceDate,
    authUid,
    classes,
    currentRole,
    currentUser,
    dailyProgress,
    expenses,
    getSubscriptionAmount,
    grades,
    handleLogout,
    keepBillable,
    loadDatabase,
    notifications,
    otherIncomes,
    payments,
    paymentsLoadedRef,
    salaryPayments,
    schools,
    setActivities,
    setActivityExpenses,
    setActivityParticipants,
    setAppUsers,
    setAttendance,
    setClasses,
    setCurrentUser,
    setDailyProgress,
    setExpenses,
    setGrades,
    setNotifications,
    setOtherIncomes,
    setPayments,
    setProfileCurrentPassword,
    setProfileError,
    setProfileFullName,
    setProfilePassword,
    setProfilePhone,
    setSalaryPayments,
    setSelectedLabStudentId,
    setSelectedStudent,
    setShowProfileEditModal,
    setStudents,
    setSyncStatus,
    setSystemSettings,
    setTeachers,
    setUserProfile,
    students,
    systemSettings,
    teachers,
    unsubscribeAllRef,
  } = s;

  // Clé de session : on ne se réabonne que si l'école, le compte, le rôle ou les liens changent.
  const sessionKey = currentUser && authUid && activeSchoolId
    ? `${activeSchoolId}|${authUid}|${currentUser.role}|${linkedStudentIdsOf(currentUser).join(",")}`
    : "";

  // Real-time Firestore synchronization (abonnements limités à ce que le rôle peut lire)
  useEffect(() => {
    if (!currentUser || !authUid || !activeSchoolId) {
      return;
    }
    const schoolId = activeSchoolId;
    let active = true;
    const unsubscribes: (() => void)[] = [];
    const role = currentUser.role;
    const readable = new Set(fullyReadableCollections(role));
    const linkedIds = linkedStudentIdsOf(currentUser);

    setSyncStatus("syncing");
    try {
      // Appartenance : une suspension ou un changement de rôle s'applique immédiatement.
      unsubscribes.push(subscribeToDocument<AppUser>(["schools", schoolId, "members", authUid], (member) => {
        if (!active) return;
        if (!member || member.isActive === false) {
          handleLogout("تم إيقاف هذا الحساب في هذه المدرسة. يرجى التواصل مع إدارتها.");
          return;
        }
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const merged = { ...mergeSessionProfile(member, null, authUid, schoolId), mustChangePassword: prev.mustChangePassword };
          return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
        });
      }));

      // Profil global : obligation de changer le mot de passe.
      unsubscribes.push(subscribeToDocument<UserProfile>(["users", authUid], (profile) => {
        if (!active || !profile) return;
        setUserProfile(profile);
        setCurrentUser((prev) => (prev && Boolean(prev.mustChangePassword) !== Boolean(profile.mustChangePassword)
          ? { ...prev, mustChangePassword: Boolean(profile.mustChangePassword) }
          : prev));
      }));

      unsubscribes.push(subscribeToSettings(schoolId, (settings) => {
        if (active && settings) setSystemSettings(settings);
      }, "settings_system"));

      const sub = <T extends { id: string }>(col: string, key: string, setter: (items: T[]) => void) => {
        if (!readable.has(col)) return;
        unsubscribes.push(subscribeToCollection<T>(schoolId, col, (items) => {
          if (active) setter(items);
        }, key));
      };

      const onStudents = (items: Student[]) => {
        setStudents(items);
        if (items.length > 0) {
          setSelectedStudent(prev => prev ? (items.find(s => s.id === prev.id) || items[0]) : items[0]);
          setSelectedLabStudentId(prev => prev ? (items.some(s => s.id === prev) ? prev : items[0].id) : items[0].id);
        } else {
          setSelectedStudent(null);
        }
      };

      if (readable.has("students")) {
        sub<Student>("students", "students", onStudents);
      } else if (isFamilyRole(role)) {
        // Familles : uniquement les dossiers explicitement liés au compte.
        unsubscribes.push(subscribeToDocumentsByIds<Student>(schoolId, "students", linkedIds, (items) => {
          if (active) onStudents(items);
        }, "students"));
      }

      const onPayments = (items: Payment[]) => {
        paymentsLoadedRef.current = true;
        setPayments(keepBillable(items));
      };

      // Liste des comptes de l'école = membres (bureau uniquement).
      if (readable.has("appUsers")) {
        unsubscribes.push(subscribeToCollection<AppUser>(schoolId, "members", (items) => {
          if (active) setAppUsers(items);
        }, "settings_users"));
      }
      if (readable.has("teachers")) {
        // Fiches publiques ; fiches RH (salaire, CIN…) fusionnées pour le bureau seulement (D42).
        unsubscribes.push(subscribeToStaff<Teacher>(schoolId, canReadStaffPrivate(role), (items) => {
          if (active) setTeachers(items);
        }, "teachers"));
      }
      sub<Class>("classes", "classes", setClasses);
      sub<Payment>("payments", "payments", onPayments);
      sub<Notification>("notifications", "notifications", setNotifications);
      sub<OtherIncome>("otherIncomes", "other_incomes", setOtherIncomes);
      sub<SalaryPayment>("salaryPayments", "salary_payments", setSalaryPayments);
      sub<Expense>("expenses", "expenses", setExpenses);
      sub<ActivityTrip>("activities", "activities", setActivities);
      sub<ActivityParticipant>("activityParticipants", "activity_participants", setActivityParticipants);
      sub<ActivityExpense>("activityExpenses", "activity_expenses", setActivityExpenses);

      if (readable.has("attendance")) {
        sub<Attendance>("attendance", "attendance", setAttendance);
        sub<Grade>("grades", "grades", setGrades);
        sub<DailyProgress>("dailyProgress", "daily_progress", setDailyProgress);
      } else if (isFamilyRole(role)) {
        // Familles : requêtes filtrées sur les élèves liés (vérifiées par les règles).
        unsubscribes.push(subscribeToQueryIn<Attendance>(schoolId, "attendance", "studentId", linkedIds, (items) => { if (active) setAttendance(items); }, "attendance"));
        unsubscribes.push(subscribeToQueryIn<Grade>(schoolId, "grades", "studentId", linkedIds, (items) => { if (active) setGrades(items); }, "grades"));
        unsubscribes.push(subscribeToQueryIn<DailyProgress>(schoolId, "dailyProgress", "studentId", linkedIds, (items) => { if (active) setDailyProgress(items); }, "daily_progress"));
        if (role === "ولي أمر") {
          // Parents : paiements de leurs enfants uniquement.
          unsubscribes.push(subscribeToQueryIn<Payment>(schoolId, "payments", "studentId", linkedIds, (items) => { if (active) onPayments(items); }, "payments"));
        }
      }

      setSyncStatus("synced");
    } catch (err) {
      console.error("Error setting up Firebase sync:", err);
      if (active) {
        setSyncStatus("error");
        loadDatabase();
      }
    }

    const stopAll = () => {
      if (!active) return;
      active = false;
      unsubscribes.forEach(unsub => unsub());
    };
    unsubscribeAllRef.current = stopAll;
    return stopAll;
  }, [sessionKey]);

  // Changement de mot de passe obligatoire (comptes migrés, créés ou réinitialisés).
  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setProfileFullName(currentUser.fullName || "");
      setProfilePhone(currentUser.username || "");
      setProfilePassword("");
      setProfileCurrentPassword("");
      setProfileError("");
      setShowProfileEditModal(true);
    }
  }, [currentUser?.mustChangePassword]);

  // Les paramètres de l'école arrivent parfois après les paiements : on masque
  // alors les mois antérieurs à l'ouverture dès qu'ils sont connus.
  useEffect(() => {
    if (systemSettings) setPayments((prev) => keepBillable(prev));
  }, [systemSettings?.openingYear, systemSettings?.openingMonth]);

  // Titre de l'onglet : nom de l'école active.
  useEffect(() => {
    if (typeof document !== "undefined" && activeSchoolId && systemSettings?.associationName) {
      document.title = systemSettings.associationName;
    }
  }, [activeSchoolId, systemSettings?.associationName]);

  /**
   * Migration métier idempotente et propre à l'école : chaque élève inscrit
   * avant l'ouverture officielle doit avoir une ligne de cotisation pour le
   * mois d'ouverture. Création UNIQUEMENT si le document n'existe pas
   * (transaction), jamais d'écrasement ; bureau seulement ; après réception des
   * paiements depuis le serveur.
   */
  useEffect(() => {
    if (!activeSchoolId || !isOfficeRole(currentRole) || !paymentsLoadedRef.current || !systemSettings) return;
    const opening = getOpeningPeriod(systemSettings);
    if (!opening) return;
    const openingKey = opening.year * 12 + monthIndex(opening.month);
    const missing = students.filter((stud) => {
      if (stud.isArchived) return false;
      const reg = (stud.registrationDate || "").split("-");
      const regKey = reg.length >= 2 ? parseInt(reg[0], 10) * 12 + (parseInt(reg[1], 10) - 1) : -Infinity;
      if (regKey > openingKey) return false; // facturé depuis son inscription (handleSaveStudent)
      return !payments.some((pay) => pay.studentId === stud.id && pay.month === opening.month && Number(pay.year) === opening.year);
    });
    if (missing.length === 0) return;
    const schoolId = activeSchoolId;
    missing.slice(0, 50).forEach((stud) => {
      const ref = schoolDocRef(schoolId, "payments", `p_init_${stud.id}`);
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) return;
        tx.set(ref, sanitizeForFirestore({
          id: `p_init_${stud.id}`,
          studentId: stud.id,
          year: opening.year,
          month: opening.month,
          amount: getSubscriptionAmount(opening.month, opening.year),
          paymentDate: "",
          status: "غير مدفوع",
          schoolId,
        }));
      }).catch((err) => console.warn("Opening payment creation skipped:", err));
    });
  }, [activeSchoolId, currentRole, students, payments, systemSettings]);

  // Auto-process absences based on schedule
  useEffect(() => {
    if (students.length === 0 || classes.length === 0) return;
    // Seuls les comptes pédagogiques écrivent les présences (règles Firestore).
    if (!currentUser || !isEducatorRole(currentRole)) return;

    const dateObj = new Date(attendanceDate);
    // Get day of the week for selected date
    const dayOfWeek = dateObj.getDay(); // 0-6 (0 is Sunday, 6 is Saturday)

    let hasChanges = false;
    const currentAttendance = RealmSimDB.getAttendance();

    students.forEach((st) => {
      const cls = classes.find(c => c.id === st.classId);
      if (!cls || st.isArchived) return;

      const parsed = parseClassSchedule(cls.schedule);

      // Is the selected date a scheduled day for this class?
      if (parsed.activeDays.includes(dayOfWeek)) {
        // Is there an existing record for this student on this date?
        const existing = currentAttendance.find(att => att.date === attendanceDate && att.studentId === st.id);
        if (!existing) {
          const todayStr = new Date().toISOString().split("T")[0];

          if (attendanceDate < todayStr) {
            // It's a past date, so the student missed the ring/session
            const newRecord: Attendance = {
              id: `a_${attendanceDate}_${st.id}`,
              date: attendanceDate,
              studentId: st.id,
              status: "غائب" as const,
              notes: "غياب تلقائي (انتهاء وقت الحلقة)"
            };
            RealmSimDB.saveAttendance(newRecord);
            hasChanges = true;
          } else if (attendanceDate === todayStr) {
            // It's today. Let's check if the session start time has arrived.
            if (parsed.startTime) {
              const now = new Date();
              const currentTotalMin = now.getHours() * 60 + now.getMinutes();
              const startTotalMin = parsed.startTime.hours * 60 + parsed.startTime.minutes;

              if (currentTotalMin >= startTotalMin) {
                // The session has started, so any student who hasn't registered yet is automatically absent!
                const newRecord: Attendance = {
                  id: `a_${attendanceDate}_${st.id}`,
                  date: attendanceDate,
                  studentId: st.id,
                  status: "غائب" as const,
                  notes: "غياب تلقائي (بدأت الحلقة ولم يسجل حضوره)"
                };
                RealmSimDB.saveAttendance(newRecord);
                hasChanges = true;
              }
            }
          }
        }
      }
    });

    if (hasChanges) {
      loadDatabase();
    }
  }, [attendanceDate, students.length, classes.length]);

  return {
    sessionKey,
  };
}
