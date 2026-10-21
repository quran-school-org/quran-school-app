/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import SchoolSwitcher from "../school/SchoolSwitcher";
import { Bell, Edit3, X, Database, LogOut, Menu } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function AppHeader() {
  const {
    notifications,
    systemSettings,
    syncStatus,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    schoolName,
    handleLogout,
    accountOwnerName,
    userAvatarInitial,
    userNotifications,
    handleOpenProfileModal,
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="px-3 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-2">

        {/* Left group: Mobile Hamburger Toggle + Logo + Association Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors focus:outline-none cursor-pointer"
            title="القائمة الرئيسية"
            aria-label="القائمة الرئيسية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-base overflow-hidden shrink-0">
            {systemSettings?.associationLogo ? (
              <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              "🌅"
            )}
          </div>

          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-emerald-900 flex items-center gap-1.5 truncate">
              <span className="truncate">{schoolName}</span>
              <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-amber-500 text-zinc-950 font-bold px-2 py-0.5 rounded-full shrink-0">نادي القرآن</span>
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium truncate">
              لوحة التحكم الشاملة • برعاية {schoolName}
            </p>
          </div>
        </div>

        {/* Right group: Controls & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Cloud Sync Status Indicator */}
          <div 
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold shadow-xs transition-all ${
              syncStatus === "synced" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : syncStatus === "syncing"
                ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
            title={
              syncStatus === "synced"
                ? "البيانات متزامنة مع قاعدة البيانات السحابية Firestore في الوقت الفعلي"
                : syncStatus === "syncing"
                ? "جاري الاتصال والمزامنة مع السحابة..."
                : "حدث خطأ أثناء مزامنة البيانات السحابية"
            }
          >
            <Database className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                syncStatus === "synced" 
                  ? "bg-emerald-400" 
                  : syncStatus === "syncing"
                  ? "bg-amber-400"
                  : "bg-rose-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                syncStatus === "synced" 
                  ? "bg-emerald-500" 
                  : syncStatus === "syncing"
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}></span>
            </span>
            <span className="hidden sm:inline">
              {syncStatus === "synced" 
                ? "متزامن" 
                : syncStatus === "syncing"
                ? "مزامنة..."
                : "أوفلاين"}
            </span>
          </div>

          {/* Sélecteur d'école (plusieurs écoles ou super-admin) */}
          <SchoolSwitcher />

          {/* Unread notification icon indicator */}
          <div className="relative">
            <button 
              onClick={() => {
                setActiveTab("notifications");
                setIsMobileMenuOpen(false);
              }} 
              className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors relative cursor-pointer"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              {userNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {userNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>

          {/* Live Interactive Profile representation */}
          <div 
            data-action="open-profile"
            onClick={handleOpenProfileModal}
            className="flex items-center gap-2 border-r border-slate-200 pr-2 sm:pr-3 mr-0.5 sm:mr-1 pl-1 sm:pl-2 py-1 rounded-xl hover:bg-emerald-50/80 active:bg-emerald-100/70 border border-transparent hover:border-emerald-200 transition-all cursor-pointer group select-none relative"
            title="تعديل بيانات ملفك الشخصي"
          >
            <div className="relative shrink-0">
              <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white border border-emerald-400/60 flex items-center justify-center text-xs font-bold font-sans shadow-xs group-hover:scale-105 transition-all">
                {userAvatarInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="hidden sm:block text-right">
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-slate-400 font-bold group-hover:text-emerald-700 transition-colors">أهلاً بك</p>
                <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-none group-hover:text-emerald-900 transition-colors whitespace-nowrap">
                {accountOwnerName}
              </p>
            </div>
          </div>

          {/* Safe Logout Button */}
          <button
            onClick={() => handleLogout()}
            className="p-1.5 sm:p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
            title="تسجيل الخروج الآمن"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
