/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */

import { useApp } from "../app/AppContext";

export default function AppFooter() {
  const {
    schoolName,
  } = useApp();

  return (
    <footer className="h-10 bg-slate-100 border-t border-slate-200 px-4 md:px-8 flex items-center justify-between text-[10px] text-slate-500 italic">
      <div>نظام إدارة الأكاديمية وحلقات تحفيظ القرآن الكريم • {schoolName}</div>
      <div>جميع الحقوق محفوظة © {new Date().getFullYear()}</div>
    </footer>
  );
}
