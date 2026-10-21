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
import AppHeader from "./shell/AppHeader";
import QuotaBanner from "./shell/QuotaBanner";
import MobileAccountBar from "./shell/MobileAccountBar";
import MobileDrawer from "./shell/MobileDrawer";
import DesktopSidebar from "./shell/DesktopSidebar";
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
import AppFooter from "./shell/AppFooter";
import TeacherStudentFileModal from "./screens/modals/TeacherStudentFileModal";
import StudentFormModal from "./screens/modals/StudentFormModal";
import GradeFormModal from "./screens/modals/GradeFormModal";
import PaymentFormModal from "./screens/modals/PaymentFormModal";
import MonthlyReportModal from "./screens/modals/MonthlyReportModal";
import ProfileModal from "./screens/modals/ProfileModal";
import { useAppController } from "./app/useAppController";
import { AppContext } from "./app/AppContext";

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

  return (
    <AppContext.Provider value={s}>
    <SchoolContext.Provider value={schoolContextValue}>
    <div data-app-shell className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* HEADER NAVBAR */}
      <AppHeader />

      {/* FIRESTORE QUOTA EXCEEDED FALLBACK BANNER */}
      {firestoreQuotaExceeded && <QuotaBanner />}

      {/* SYSTEM CONTROLS BAR FOR MOBILE */}
      <MobileAccountBar />

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && <MobileDrawer />}

      {/* CORE FRAMEWORK GRID */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <DesktopSidebar />

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          
          {/* TAB: TEACHER DASHBOARD */}
          {activeTab === "teacher-dashboard" && currentRole === "مدرس" && <TeacherDashboardScreen />}

          {/* TAB 1: DASHBOARD & ANALYTICS */}
          {activeTab === "dashboard" && checkUserPermission(currentUser, currentRole, "dashboard", "read") && <DashboardScreen />}

          {/* TAB 2: STUDENTS DIRECTORY & DOSSIERS */}
          {activeTab === "students" && <StudentsScreen />}

          {/* TAB 3: ATTENDANCE MONITORING */}
          {activeTab === "attendance" && (currentRole === "مدير" || currentRole === "مدرس") && <AttendanceScreen />}

          {/* TAB 4: EXAM GRADES & CERTIFICATES */}
          {activeTab === "grades" && <GradesScreen />}

          {/* TAB 5: PAYMENTS & ADMINISTRATIVE FEES */}
          {activeTab === "payments" && <PaymentsScreen />}

          {/* TAB 5.5: ASSOCIATION FINANCE & ACCOUNTING */}
          {activeTab === "finance" && <FinanceScreen />}

          {/* TAB 5.6: ACTIVITIES & TRIPS MANAGEMENT */}
          {activeTab === "activities" && <ActivitiesScreen />}

          {/* TAB 6: CLASSES & SCHEDULES */}
          {activeTab === "classes" && <ClassesScreen />}

          {/* TAB: TEACHERS MANAGEMENT */}
          {activeTab === "teachers" && <TeachersScreen />}

          {/* TAB 7: NOTIFICATIONS BOX */}
          {activeTab === "notifications" && <NotificationsScreen />}

          {/* TAB: ID CARDS LAB */}
          {activeTab === "id-cards-lab" && <IdCardsScreen />}

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === "settings" && systemSettings && <SettingsScreen />}

        </main>
      </div>

      {/* FOOTER */}
      <AppFooter />

      {/* TEACHER STUDENT FILE & DOSSIER MODAL */}
      {showTeacherStudentFileModal && teacherSelectedStudent && <TeacherStudentFileModal />}

      {/* STUDENT REGISTRATION / EDIT MODAL */}
      {showStudentModal && <StudentFormModal />}

      {/* GRADE REPORT ENTRY MODAL */}
      {showGradeModal && <GradeFormModal />}

      {/* ADD/EDIT PAYMENT MODAL */}
      {showPaymentModal && <PaymentFormModal />}

      {/* MONTHLY ATTENDANCE REPORT MODAL */}
      {showMonthlyReportModal && selectedStudentForReport && <MonthlyReportModal />}

      {/* PROFILE EDIT MODAL */}
      {showProfileEditModal && <ProfileModal />}

    </div>
    </SchoolContext.Provider>
    </AppContext.Provider>
  );
}
