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
    <div data-modal="profile" className="fixed inset-0 bg-sand-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-sand-200 w-full max-w-md overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-primary-900 to-primary-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-700 border-2 border-primary-400 flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0">
              {userAvatarInitial}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الملف الشخصي والحساب</h3>
              <p className="text-xs text-primary-200 font-medium">تعديل بيانات الحساب الجاري ({currentRole})</p>
            </div>
          </div>
          {!mustChangePassword && (
            <button
              type="button"
              onClick={() => setShowProfileEditModal(false)}
              className="p-1.5 text-primary-200 hover:text-white hover:bg-primary-800/80 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          {mustChangePassword && (
            <div className="p-3 bg-gold-50 border border-gold-200 text-gold-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-gold-600" />
              <span>لأسباب أمنية، يجب اختيار كلمة مرور جديدة (8 أحرف على الأقل) قبل متابعة استعمال المنظومة.</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-danger-600" />
              <span>{profileError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-sand-700 mb-1">الاسم الكامل لصاحب الحساب</label>
            <div className="relative">
              <User className="w-4 h-4 text-sand-500 absolute right-3 top-3" />
              <input
                type="text"
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white font-medium"
                placeholder="أدخل الاسم الكامل"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sand-700 mb-1">اسم المستخدم / معرّف الدخول</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-sand-500 absolute right-3 top-3" />
              <input
                type="text"
                value={profilePhone}
                disabled
                className="w-full pr-9 pl-3 py-2 bg-sand-100 border border-sand-200 rounded-xl text-sm font-medium text-sand-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-sand-500 mt-1">اسم المستخدم معرّف فريد لا يمكن تعديله إلا من إدارة النظام.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-sand-700 mb-1">كلمة المرور الحالية</label>
            <div className="relative mb-3">
              <Lock className="w-4 h-4 text-sand-500 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profileCurrentPassword}
                onChange={(e) => setProfileCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pr-9 pl-3 py-2 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white font-mono"
                placeholder="مطلوبة عند تغيير كلمة المرور إذا طال وقت الجلسة"
              />
            </div>
            <label className="block text-xs font-bold text-sand-700 mb-1">{mustChangePassword ? "كلمة المرور الجديدة" : "تحديث كلمة المرور (اختياري)"}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-sand-500 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                autoComplete="new-password"
                required={mustChangePassword}
                className="w-full pr-9 pl-9 py-2 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white font-mono"
                placeholder="أدخل كلمة مرور جديدة"
              />
              <button
                type="button"
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                className="absolute left-3 top-2.5 text-sand-500 hover:text-sand-600"
              >
                {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-sand-100">
            <button
              type="button"
              onClick={() => (mustChangePassword ? handleLogout() : setShowProfileEditModal(false))}
              className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {mustChangePassword ? "خروج" : "إلغاء"}
            </button>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:bg-primary-400"
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
