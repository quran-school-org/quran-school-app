/**
 * Profil et mot de passe du compte connecté (charte « لوحة الكتّاب »). Même logique
 * qu'auparavant ; sans fermeture possible tant qu'un changement de mot de passe est imposé.
 */
import React from "react";
import { AtSign, Check, Eye, EyeOff, Lock, ShieldAlert, User } from "lucide-react";
import { ActionAlert, Button, FormField, InitialAvatar, Modal, SearchInput } from "../../ui";
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

  const close = mustChangePassword ? undefined : () => setShowProfileEditModal(false);

  return (
    <Modal
      modalId="profile"
      size="sm"
      icon={<InitialAvatar name={userAvatarInitial} size={44} />}
      title="الملف الشخصي والحساب"
      subtitle={`تعديل بيانات الحساب الجاري (${currentRole})`}
      onClose={close}
      onSubmit={handleSaveProfile}
      footer={
        <>
          <Button onClick={() => (mustChangePassword ? handleLogout() : setShowProfileEditModal(false))}>{mustChangePassword ? "خروج" : "إلغاء"}</Button>
          <Button type="submit" variant="primary" disabled={profileSaving} icon={<Check className="w-4 h-4" strokeWidth={1.75} />}>حفظ التغييرات</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {mustChangePassword && (
          <ActionAlert tone="warn" icon={<ShieldAlert className="w-5 h-5" strokeWidth={1.75} />} title="تغيير كلمة المرور مطلوب">
            لأسباب أمنية، يجب اختيار كلمة مرور جديدة (8 أحرف على الأقل) قبل متابعة استعمال المنظومة.
          </ActionAlert>
        )}
        {profileError && (
          <ActionAlert role="alert" tone="danger" icon={<ShieldAlert className="w-5 h-5" strokeWidth={1.75} />} title="تعذر الحفظ">
            {profileError}
          </ActionAlert>
        )}
        <FormField label="الاسم الكامل لصاحب الحساب">
          {(id) => <SearchInput id={id} type="text" icon={<User className="w-4 h-4" strokeWidth={1.75} />} value={profileFullName} onChange={(e: any) => setProfileFullName(e.target.value)} placeholder="أدخل الاسم الكامل" required />}
        </FormField>
        <FormField label="اسم المستخدم / معرّف الدخول" hint="اسم المستخدم معرّف فريد لا يمكن تعديله إلا من إدارة النظام.">
          {(id) => <SearchInput id={id} type="text" dir="ltr" icon={<AtSign className="w-4 h-4" strokeWidth={1.75} />} value={profilePhone} disabled className="[&_input]:cursor-not-allowed [&_input]:bg-sunken [&_input]:pr-10 [&_input]:pl-3 [&_input]:text-right" />}
        </FormField>
        <FormField label="كلمة المرور الحالية">
          {(id) => (
            <SearchInput
              id={id}
              type={showProfilePassword ? "text" : "password"}
              icon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
              value={profileCurrentPassword}
              onChange={(e: any) => setProfileCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="مطلوبة عند تغيير كلمة المرور إذا طال وقت الجلسة"
            />
          )}
        </FormField>
        <FormField label={mustChangePassword ? "كلمة المرور الجديدة" : "تحديث كلمة المرور (اختياري)"}>
          {(id) => (
            <div className="relative">
              <SearchInput
                id={id}
                type={showProfilePassword ? "text" : "password"}
                icon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
                value={profilePassword}
                onChange={(e: any) => setProfilePassword(e.target.value)}
                autoComplete="new-password"
                required={mustChangePassword}
                placeholder="أدخل كلمة مرور جديدة"
                className="[&_input]:pe-12"
              />
              <button
                type="button"
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                aria-label={showProfilePassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showProfilePassword}
                className="absolute inset-y-0 end-0 w-11 inline-flex items-center justify-center bg-transparent border-0 text-ink-3 hover:text-ink cursor-pointer"
              >
                {showProfilePassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
          )}
        </FormField>
      </div>
    </Modal>
  );
}
