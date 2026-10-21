/**
 * Racine de l'application : session (connexion, choix d'école), cadre
 * (barre du haut, menus), routage par onglet actif et fenêtres. L'état et la
 * logique sont dans `useAppController` (src/app), les écrans dans src/screens.
 */
import { checkUserPermission } from "./types";
import { SchoolContext, type SchoolContextValue } from "./school/SchoolContext";
import SchoolPicker from "./school/SchoolPicker";
import SessionCheckingScreen from "./screens/SessionCheckingScreen";
import LoginScreen from "./screens/LoginScreen";
import AppFrame from "./shell/AppFrame";
import AttendanceUnavailable from "./screens/AttendanceUnavailable";
import TeacherDashboardScreen from "./screens/TeacherDashboardScreen";
import DashboardScreen from "./screens/DashboardScreen";
import StudentsScreen from "./screens/StudentsScreen";
import AttendanceScreen from "./screens/AttendanceScreen";
import GradesScreen from "./screens/GradesScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import FinanceScreen from "./screens/FinanceScreen";
import ActivitiesScreen from "./screens/ActivitiesScreen";
import ClassesScreen from "./screens/ClassesScreen";
import TeachersScreen from "./screens/TeachersScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import IdCardsScreen from "./screens/IdCardsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import TeacherStudentFileModal from "./screens/modals/TeacherStudentFileModal";
import StudentFormModal from "./screens/modals/StudentFormModal";
import GradeFormModal from "./screens/modals/GradeFormModal";
import PaymentFormModal from "./screens/modals/PaymentFormModal";
import MonthlyReportModal from "./screens/modals/MonthlyReportModal";
import ProfileModal from "./screens/modals/ProfileModal";
import { useAppController } from "./app/useAppController";
import { AppContext } from "./app/AppContext";
import { SessionContext, type SessionContextValue } from "./session/SessionContext";

export default function App() {
  const s = useAppController();
  const {
    students,
    teachers,
    classes,
    attendance,
    grades,
    payments,
    notifications,
    systemSettings,
    activities,
    firestoreQuotaExceeded,
    currentUser,
    authChecking,
    authUid,
    activeSchoolId,
    schools,
    userProfile,
    isSuperAdmin,
    showSchoolPicker,
    schoolError,
    schoolBusy,
    activeTab,
    isMobileMenuOpen,
    showStudentModal,
    showGradeModal,
    showTeacherStudentFileModal,
    teacherSelectedStudent,
    selectedStudentForReport,
    showMonthlyReportModal,
    showProfileEditModal,
    showPaymentModal,
    currentRole,
    activeSchool,
    schoolName,
    handleSelectSchool,
    handleCreateSchool,
    handleOpenSchoolPicker,
    handleLogout,
  } = s;

  if (!currentUser && authUid && showSchoolPicker) {
    return (
      <AppContext.Provider value={s}>
      <SchoolPicker
        schools={schools}
        memberSchoolIds={userProfile?.schoolIds || []}
        isSuperAdmin={isSuperAdmin}
        userName={userProfile?.displayName || userProfile?.username || ""}
        busy={schoolBusy}
        error={schoolError}
        onSelect={handleSelectSchool}
        onCreate={handleCreateSchool}
        onLogout={() => handleLogout()}
      />
      </AppContext.Provider>
    );
  }

  if (!currentUser && authChecking) {
    return <AppContext.Provider value={s}><SessionCheckingScreen /></AppContext.Provider>;
  }

  if (!currentUser) {
    return <AppContext.Provider value={s}><LoginScreen /></AppContext.Provider>;
  }

  const schoolContextValue: SchoolContextValue = {
    schoolId: activeSchoolId,
    school: activeSchool,
    schools,
    memberSchoolIds: userProfile?.schoolIds || [],
    member: currentUser,
    role: currentUser ? currentRole : null,
    settings: systemSettings,
    schoolName,
    isSuperAdmin,
    switchSchool: (id: string) => { handleSelectSchool(id); },
    openSchoolPicker: handleOpenSchoolPicker,
  };

  const sessionContextValue: SessionContextValue = {
    currentUser,
    currentRole,
    authUid: s.authUid,
    userProfile,
    isSuperAdmin,
    schools,
    activeSchoolId,
    mustChangePassword: s.mustChangePassword,
    accountOwnerName: s.accountOwnerName,
    logout: s.handleLogout,
    selectSchool: handleSelectSchool,
    openSchoolPicker: handleOpenSchoolPicker,
    openProfile: s.handleOpenProfileModal,
  };

  return (
    <AppContext.Provider value={s}>
    <SessionContext.Provider value={sessionContextValue}>
    <SchoolContext.Provider value={schoolContextValue}>
    <AppFrame>
      {activeTab === "teacher-dashboard" && currentRole === "مدرس" && <TeacherDashboardScreen />}
      {activeTab === "dashboard" && checkUserPermission(currentUser, currentRole, "dashboard", "read") && <DashboardScreen />}
      {activeTab === "students" && <StudentsScreen />}
      {activeTab === "attendance" && ((currentRole === "مدير" || currentRole === "مدرس") ? <AttendanceScreen /> : <AttendanceUnavailable />)}
      {activeTab === "grades" && <GradesScreen />}
      {activeTab === "payments" && <PaymentsScreen />}
      {activeTab === "finance" && <FinanceScreen />}
      {activeTab === "activities" && <ActivitiesScreen />}
      {activeTab === "classes" && <ClassesScreen />}
      {activeTab === "teachers" && <TeachersScreen />}
      {activeTab === "notifications" && <NotificationsScreen />}
      {activeTab === "id-cards-lab" && <IdCardsScreen />}
      {activeTab === "settings" && systemSettings && <SettingsScreen />}
    </AppFrame>

    {/* Fenêtres */}
    {showTeacherStudentFileModal && teacherSelectedStudent && <TeacherStudentFileModal />}
    {showStudentModal && <StudentFormModal />}
    {showGradeModal && <GradeFormModal />}
    {showPaymentModal && <PaymentFormModal />}
    {showMonthlyReportModal && selectedStudentForReport && <MonthlyReportModal />}
    {showProfileEditModal && <ProfileModal />}
    </SchoolContext.Provider>
    </SessionContext.Provider>
    </AppContext.Provider>
  );
}
