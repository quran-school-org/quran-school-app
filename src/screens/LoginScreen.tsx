/**
 * Écran de connexion (charte « لوحة الكتّاب ») : panneau bleu nuit à motif doré
 * (bureau), formulaire inchangé (identifiant, mot de passe, envoi).
 */
import React from "react";
import { ShieldAlert, RefreshCw, Eye, Lock, User, LogIn, EyeOff } from "lucide-react";
import { ActionAlert, Button, Emblem, FormField, GeometricPattern, SearchInput } from "../ui";
import { useApp } from "../app/AppContext";

export default function LoginScreen() {
  const {
    systemSettings,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    loginError,
    loginLoading,
    schoolName,
    handleLoginSubmit,
  } = useApp();

  const logo = systemSettings?.associationLogo;

  return (
    <div data-screen="login" className="min-h-screen bg-app grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" dir="rtl">
      <aside aria-hidden="true" className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-night text-night-text p-10">
        <GeometricPattern opacity={0.16} fade="bottom" />
        <div className="relative flex items-center gap-3">
          <Emblem size={48} />
          <span className="font-display font-semibold text-[22px] text-white">{schoolName}</span>
        </div>
        <div className="relative flex flex-col gap-4 max-w-md">
          <p className="m-0 font-quran text-[30px] leading-[1.9] text-gold-100">«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</p>
          <p className="m-0 text-[15px] text-night-muted leading-relaxed">منظومة موحدة لمتابعة الحفظ والتجويد، الحضور، الرسوم والأنشطة في الكتّاب.</p>
        </div>
        <span className="relative text-[13px] text-night-muted">نظام إدارة حلقات تحفيظ القرآن الكريم</span>
      </aside>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-2xl border border-line bg-surface flex items-center justify-center overflow-hidden p-1.5">
              {logo ? <img src={logo} alt="شعار الجمعية" className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <Emblem size={64} />}
            </div>
            <h1 className="m-0 font-display font-bold text-[28px] sm:text-[32px] leading-tight text-primary">{schoolName}</h1>
            <p className="m-0 text-[14.5px] text-ink-2">بوابة الدخول الموحدة لإدارة شؤون حفظ وتجويد القرآن الكريم</p>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-5 sm:p-7 flex flex-col gap-4">
            {loginError && (
              <ActionAlert role="alert" tone="danger" icon={<ShieldAlert className="w-5 h-5" strokeWidth={1.75} />} title={loginError} />
            )}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <FormField label="اسم المستخدم" hint="استخدم اسم المستخدم الذي زودتك به إدارة الجمعية (وليس الاسم الكامل أو رقم الهاتف).">
                {(id) => (
                  <SearchInput
                    id={id}
                    type="text"
                    icon={<User className="w-4 h-4" strokeWidth={1.75} />}
                    value={loginUsername}
                    onChange={(e: any) => setLoginUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="ltr"
                    className="[&_input]:pr-10 [&_input]:pl-3 [&_input]:text-right"
                  />
                )}
              </FormField>
              <FormField label="كلمة المرور">
                {(id) => (
                  <div className="relative">
                    <SearchInput
                      id={id}
                      type={showPassword ? "text" : "password"}
                      icon={<Lock className="w-4 h-4" strokeWidth={1.75} />}
                      value={loginPassword}
                      onChange={(e: any) => setLoginPassword(e.target.value)}
                      placeholder="• • • • • •"
                      autoComplete="current-password"
                      className="[&_input]:pe-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 end-0 w-11 inline-flex items-center justify-center bg-transparent border-0 text-ink-3 hover:text-ink cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                    </button>
                  </div>
                )}
              </FormField>
              <Button
                type="submit"
                variant="primary"
                block
                disabled={loginLoading}
                icon={loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : <LogIn className="w-4 h-4" strokeWidth={1.75} />}
              >
                {loginLoading ? "جاري التحقق من الهوية..." : "تسجيل الدخول الآمن"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
