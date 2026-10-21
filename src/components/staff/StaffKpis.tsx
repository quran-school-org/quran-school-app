/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Users } from "lucide-react";
import { useStaff } from "./StaffContext";

export default function StaffKpis() {
  const {
    stats,
  } = useStaff();

  return (
    <>
      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Total Active Staff */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold text-slate-600">إجمالي الطاقم</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800">{stats.totalCount}</div>
          <p className="text-[10px] text-emerald-600 font-semibold">طاقم نشط ومسجل</p>
        </div>

        {/* Executive Board */}
        <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-indigo-700">
            <span className="text-[11px] font-bold">أعضاء المكتب</span>
            <span className="text-sm">🏛️</span>
          </div>
          <div className="text-xl font-extrabold text-indigo-800">{stats.boardCount}</div>
          <p className="text-[10px] text-indigo-700 font-medium">مسيرون وأعضاء</p>
        </div>

        {/* Teachers */}
        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-[11px] font-bold">محفظون وأساتذة</span>
            <span className="text-sm">👨‍🏫</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-800">{stats.teachersCount}</div>
          <p className="text-[10px] text-emerald-700 font-medium">مشرفين على الحلقات</p>
        </div>

        {/* Admins */}
        <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-purple-700">
            <span className="text-[11px] font-bold">إداريون وكتاب</span>
            <span className="text-sm">📋</span>
          </div>
          <div className="text-xl font-extrabold text-purple-800">{stats.adminsCount}</div>
          <p className="text-[10px] text-purple-700 font-medium">شؤون الإدارة والكتابة</p>
        </div>

        {/* Mentors */}
        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-[11px] font-bold">مؤطرون ومشرفون</span>
            <span className="text-sm">🌟</span>
          </div>
          <div className="text-xl font-extrabold text-blue-800">{stats.mentorsCount}</div>
          <p className="text-[10px] text-blue-700 font-medium">الأنشطة والتربية</p>
        </div>

        {/* Cleaners & Maintenance */}
        <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-teal-700">
            <span className="text-[11px] font-bold">نظافة وصيانة</span>
            <span className="text-sm">🧹</span>
          </div>
          <div className="text-xl font-extrabold text-teal-800">{stats.cleanersCount}</div>
          <p className="text-[10px] text-teal-700 font-medium">مرافق المقر والمسجد</p>
        </div>

        {/* Volunteers */}
        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-[11px] font-bold">متطوعون</span>
            <span className="text-sm">🤝</span>
          </div>
          <div className="text-xl font-extrabold text-amber-800">{stats.volunteersCount}</div>
          <p className="text-[10px] text-amber-700 font-medium">مساهمات تطوعية</p>
        </div>
      </div>
    </>
  );
}
