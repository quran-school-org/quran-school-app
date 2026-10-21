/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Compass, Users, DollarSign, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useActivities } from "./ActivitiesContext";

export default function ActivitiesOverview() {
  const {
    canCreateActivity,
    onNavigateToFinance,
    globalStats,
    handleOpenAddActivity,
  } = useActivities();

  return (
    <>
        {/* Top Header & Stats */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة الأنشطة والرحلات</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  النسخة الاحترافية
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                تخطيط الرحلات والمخيمات، تسجيل المشاركين وتتبع المساهمات، ضبط المصاريف والربط المالي التلقائي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canCreateActivity && (
              <button
                id="btn-add-new-activity"
                data-action="open-activity-form"
                onClick={handleOpenAddActivity}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نشاط / رحلة جديدة</span>
              </button>
            )}
            {onNavigateToFinance && (
              <button
                id="btn-nav-to-finance"
                onClick={onNavigateToFinance}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-medium transition-all text-sm border border-slate-200"
              >
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>المحاسبة والمالية الجمعوية</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">إجمالي الأنشطة والرحلات</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalActs} <span className="text-xs font-normal text-slate-500">({globalStats.activeOrUpcoming} جارية/قادمة)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">المشاركون المسجلون</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalParts} <span className="text-xs font-normal text-slate-500">مشارك ومستفيد</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">المساهمات المحصلة</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalIncome.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.م</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${globalStats.totalNet >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} flex items-center justify-center shrink-0`}>
              {globalStats.totalNet >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">الصافي المالي العام للأنشطة</div>
              <div className={`text-xl font-bold mt-0.5 ${globalStats.totalNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {globalStats.totalNet >= 0 ? `+${globalStats.totalNet.toLocaleString()}` : globalStats.totalNet.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
