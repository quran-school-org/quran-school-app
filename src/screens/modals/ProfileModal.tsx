/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Check, X, Phone, ShieldAlert, Eye, Lock, User, EyeOff } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function ProfileModal() {
  const {
    setShowProfileEditModal,
    profileFullName,
    setProfileFullName,
    profilePassword,
    setProfilePassword,
    profilePhone,
    showProfilePassword,
    setShowProfilePassword,
    profileCurrentPassword,
    setProfileCurrentPassword,
    profileSaving,
    profileError,
    currentRole,
    handleLogout,
    userAvatarInitial,
    mustChangePassword,
    handleSaveProfile,
  } = useApp();

  return (
    <div data-modal="profile" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0">
              {userAvatarInitial}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الملف الشخصي والحساب</h3>
              <p className="text-xs text-emerald-200 font-medium">تعديل بيانات الحساب الجاري ({currentRole})</p>
            </div>
          </div>
          {!mustChangePassword && (
            <button
              type="button"
              onClick={() => setShowProfileEditModal(false)}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          {mustChangePassword && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>لأسباب أمنية، يجب اختيار كلمة مرور جديدة (8 أحرف على الأقل) قبل متابعة استعمال المنظومة.</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل لصاحب الحساب</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                placeholder="أدخل الاسم الكامل"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم / معرّف الدخول</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={profilePhone}
                disabled
                className="w-full pr-9 pl-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">اسم المستخدم معرّف فريد لا يمكن تعديله إلا من إدارة النظام.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
            <div className="relative mb-3">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profileCurrentPassword}
                onChange={(e) => setProfileCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                placeholder="مطلوبة عند تغيير كلمة المرور إذا طال وقت الجلسة"
              />
            </div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{mustChangePassword ? "كلمة المرور الجديدة" : "تحديث كلمة المرور (اختياري)"}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                autoComplete="new-password"
                required={mustChangePassword}
                className="w-full pr-9 pl-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                placeholder="أدخل كلمة مرور جديدة"
              />
              <button
                type="button"
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => (mustChangePassword ? handleLogout() : setShowProfileEditModal(false))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {mustChangePassword ? "خروج" : "إلغاء"}
            </button>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:bg-emerald-400"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
