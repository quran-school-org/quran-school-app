/**
 * Bandeau « mode hors ligne » quand le quota Firestore est dépassé.
 * Les identifiants affichés sont ceux de la configuration (src/config/env.ts),
 * au lieu des identifiants de production codés en dur auparavant (constat F4).
 */
import { Database, Info } from "lucide-react";
import { firebaseWebConfig, firestoreDatabaseId } from "../config/env";
import { ActionAlert } from "../ui";

export default function QuotaBanner() {
  return (
    <div className="px-4 sm:px-8 pt-4 max-w-[1240px] w-full box-border" dir="rtl">
      <ActionAlert
        tone="warn"
        role="alert"
        icon={<Database className="w-5 h-5" strokeWidth={1.75} />}
        title="وضع التشغيل المحلي (أوفلاين) نشط تلقائياً"
        action={
          <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold-800 underline underline-offset-4">
            <Info className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            تفاصيل الحصص
          </a>
        }
      >
        قاعدة البيانات السحابية تجاوزت حصة الاستخدام المسموح بها لهذا اليوم. <strong>بياناتك آمنة ومحفوظة محلياً</strong> في متصفحك:
        يمكنك متابعة العمل، وستتم مزامنة التغييرات تلقائياً عند إعادة تعيين الحصة أو ترقية الخطة.
        <span className="block mt-1 text-small font-semibold" dir="ltr">Project: {firebaseWebConfig.projectId} · Database: {firestoreDatabaseId}</span>
      </ActionAlert>
    </div>
  );
}
