/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { ShieldAlert, RefreshCw, Eye, Lock, User, LogIn, EyeOff } from "lucide-react";
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

  return (
    <div data-screen="login" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden animate-fade-in" dir="rtl">
      {/* Subtle decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl -z-10 opacity-70"></div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Top colored accent line */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700"></div>

        <div className="p-6 md:p-8">
          {/* Logo and Association Name */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-3 overflow-hidden p-1.5">
              {systemSettings?.associationLogo ? (
                <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" fill="#f0fdf4" />
                  <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#F59E0B" />
                  <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36 M19 48 L29 48 M81 48 L71 48" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M42 63 C42 58, 44 53, 39 48 C37 46, 34 48, 32 50" stroke="#059669" strokeWidth="5.5" strokeLinecap="round" />
                  <circle cx="41" cy="44" r="3.5" fill="#059669" />
                  <path d="M58 63 C58 58, 56 53, 61 48 C63 46, 66 48, 68 50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
                  <circle cx="59" cy="44" r="3.5" fill="#DC2626" />
                  <path d="M28 63 C38 71, 62 71, 72 63" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {schoolName}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              بوابة الدخول الموحدة لإدارة شؤون حفظ وتجويد القرآن الكريم
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">
                اسم المستخدم
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder=""
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 mr-1">استخدم اسم المستخدم الذي زودتك به إدارة الجمعية (وليس الاسم الكامل أو رقم الهاتف).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">
                كلمة المرور
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="• • • • • •"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:bg-emerald-400 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من الهوية...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول الآمن</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
