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
    <div data-modal="profile" className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 bg-night/55 backdrop-blur-[2px]" dir="rtl">
      <div className="bg-surface border border-line w-full max-w-md overflow-hidden rounded-3xl shadow-pop">
        <div className="p-5 bg-night text-night-text flex items-center justify-between border-b border-night-line">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-700 border-2 border-primary-400 flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0">
              {userAvatarInitial}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الملف الشخصي والحساب</h3>
              <p className="text-[13px] text-primary-200 font-medium">تعديل بيانات الحساب الجاري ({currentRole})</p>
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
            <div className="p-3 bg-gold-50 border border-gold-200 text-gold-900 rounded-xl text-[13px] font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-gold-600" />
              <span>لأسباب أمنية، يجب اختيار كلمة مرور جديدة (8 أحرف على الأقل) قبل متابعة استعمال المنظومة.</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-xl text-[13px] font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-danger-600" />
              <span>{profileError}</span>
            </div>
          )}
          <div>
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الاسم الكامل لصاحب الحساب</label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-3 absolute right-3 top-3" />
              <input
                type="text"
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3"
                placeholder="أدخل الاسم الكامل"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المستخدم / معرّف الدخول</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-ink-3 absolute right-3 top-3" />
              <input
                type="text"
                value={profilePhone}
                disabled
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3 cursor-not-allowed"
              />
            </div>
            <p className="text-[11.5px] text-ink-3 mt-1">اسم المستخدم معرّف فريد لا يمكن تعديله إلا من إدارة النظام.</p>
          </div>

          <div>
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">كلمة المرور الحالية</label>
            <div className="relative mb-3">
              <Lock className="w-4 h-4 text-ink-3 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profileCurrentPassword}
                onChange={(e) => setProfileCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3 font-mono"
                placeholder="مطلوبة عند تغيير كلمة المرور إذا طال وقت الجلسة"
              />
            </div>
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">{mustChangePassword ? "كلمة المرور الجديدة" : "تحديث كلمة المرور (اختياري)"}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-3 absolute right-3 top-3" />
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                autoComplete="new-password"
                required={mustChangePassword}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-9 font-mono"
                placeholder="أدخل كلمة مرور جديدة"
              />
              <button
                type="button"
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                className="absolute left-3 top-2.5 text-ink-3 hover:text-ink-2"
              >
                {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-line-soft">
            <button
              type="button"
              onClick={() => (mustChangePassword ? handleLogout() : setShowProfileEditModal(false))}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
            >
              {mustChangePassword ? "خروج" : "إلغاء"}
            </button>
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
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
