/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Info, Database } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function QuotaBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3.5 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-amber-500 to-amber-600"></div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-900 leading-snug">
              وضع التشغيل المحلي (أوفلاين) نشط تلقائياً • Offline Fallback Mode Active
            </h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed max-w-4xl">
              قاعدة البيانات السحابية <strong>Firestore</strong> تجاوزت حصة الاستخدام المجاني اليومي المسموح بها لهذا اليوم.
              <span className="block mt-1 sm:inline sm:mr-1">
                <strong>لا تقلق! بياناتك آمنة تماماً ومحفوظة محلياً</strong> في متصفحك. يمكنك الاستمرار في استخدام التطبيق بشكل كامل (إضافة، تعديل، تسجيل الحضور والدفع) وسيتم تخزين جميع التغييرات محلياً ولن تفقد أي تقدم. ستتم مزامنة التغييرات تلقائياً عند إعادة تعيين الحصة أو ترقية الخطة.
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[11px]">
              <span className="text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-mono font-bold">
                Project ID: gen-lang-client-0481880143
              </span>
              <span className="text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-mono font-bold">
                Database ID: ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 md:mr-12">
          <a 
            href="https://console.firebase.google.com/project/gen-lang-client-0481880143/firestore/databases/ai-studio-a6572431-c7db-4071-82bf-a922d18511ec/data?openUpgradeDialog=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all border border-amber-700 text-center"
          >
            <Database className="w-4 h-4" />
            <span>ترقية خطة Firebase (Blaze)</span>
          </a>
          <a 
            href="https://firebase.google.com/pricing#cloud-firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all text-center"
          >
            <Info className="w-4 h-4" />
            <span>تفاصيل الحصص</span>
          </a>
        </div>
      </div>
    </div>
  );
}
