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
        <div className="bg-white p-3.5 rounded-xl border border-sand-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-sand-500">
            <span className="text-[11px] font-bold text-sand-600">إجمالي الطاقم</span>
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-xl font-extrabold text-sand-800">{stats.totalCount}</div>
          <p className="text-[10px] text-primary-600 font-semibold">طاقم نشط ومسجل</p>
        </div>

        {/* Executive Board */}
        <div className="bg-primary-50/50 p-3.5 rounded-xl border border-primary-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-primary-700">
            <span className="text-[11px] font-bold">أعضاء المكتب</span>
            <span className="text-sm">🏛️</span>
          </div>
          <div className="text-xl font-extrabold text-primary-800">{stats.boardCount}</div>
          <p className="text-[10px] text-primary-700 font-medium">مسيرون وأعضاء</p>
        </div>

        {/* Teachers */}
        <div className="bg-primary-50/50 p-3.5 rounded-xl border border-primary-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-primary-700">
            <span className="text-[11px] font-bold">محفظون وأساتذة</span>
            <span className="text-sm">👨‍🏫</span>
          </div>
          <div className="text-xl font-extrabold text-primary-800">{stats.teachersCount}</div>
          <p className="text-[10px] text-primary-700 font-medium">مشرفين على الحلقات</p>
        </div>

        {/* Admins */}
        <div className="bg-primary-50/50 p-3.5 rounded-xl border border-primary-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-primary-700">
            <span className="text-[11px] font-bold">إداريون وكتاب</span>
            <span className="text-sm">📋</span>
          </div>
          <div className="text-xl font-extrabold text-primary-800">{stats.adminsCount}</div>
          <p className="text-[10px] text-primary-700 font-medium">شؤون الإدارة والكتابة</p>
        </div>

        {/* Mentors */}
        <div className="bg-primary-50/50 p-3.5 rounded-xl border border-primary-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-primary-700">
            <span className="text-[11px] font-bold">مؤطرون ومشرفون</span>
            <span className="text-sm">🌟</span>
          </div>
          <div className="text-xl font-extrabold text-primary-800">{stats.mentorsCount}</div>
          <p className="text-[10px] text-primary-700 font-medium">الأنشطة والتربية</p>
        </div>

        {/* Cleaners & Maintenance */}
        <div className="bg-primary-50/50 p-3.5 rounded-xl border border-primary-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-primary-700">
            <span className="text-[11px] font-bold">نظافة وصيانة</span>
            <span className="text-sm">🧹</span>
          </div>
          <div className="text-xl font-extrabold text-primary-800">{stats.cleanersCount}</div>
          <p className="text-[10px] text-primary-700 font-medium">مرافق المقر والمسجد</p>
        </div>

        {/* Volunteers */}
        <div className="bg-gold-50/50 p-3.5 rounded-xl border border-gold-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-gold-700">
            <span className="text-[11px] font-bold">متطوعون</span>
            <span className="text-sm">🤝</span>
          </div>
          <div className="text-xl font-extrabold text-gold-800">{stats.volunteersCount}</div>
          <p className="text-[10px] text-gold-700 font-medium">مساهمات تطوعية</p>
        </div>
      </div>
    </>
  );
}
