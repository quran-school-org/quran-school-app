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
        <div className="bg-surface rounded-2xl border border-sand-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line-soft pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink tracking-tight">إدارة الأنشطة والرحلات</h1>
                <span className="bg-primary-100 text-primary-800 text-[13px] font-semibold px-2.5 py-0.5 rounded-full">
                  النسخة الاحترافية
                </span>
              </div>
              <p className="text-sm text-ink-3 mt-0.5">
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
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نشاط / رحلة جديدة</span>
              </button>
            )}
            {onNavigateToFinance && (
              <button
                id="btn-nav-to-finance"
                onClick={onNavigateToFinance}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer gap-2"
              >
                <DollarSign className="w-4 h-4 text-primary-700" />
                <span>المحاسبة والمالية الجمعوية</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-sand-50 border border-sand-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] text-ink-3 font-medium">إجمالي الأنشطة والرحلات</div>
              <div className="text-xl font-bold text-ink mt-0.5">
                {globalStats.totalActs} <span className="text-[13px] font-normal text-ink-3">({globalStats.activeOrUpcoming} جارية/قادمة)</span>
              </div>
            </div>
          </div>

          <div className="bg-sand-50 border border-sand-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] text-ink-3 font-medium">المشاركون المسجلون</div>
              <div className="text-xl font-bold text-ink mt-0.5">
                {globalStats.totalParts} <span className="text-[13px] font-normal text-ink-3">مشارك ومستفيد</span>
              </div>
            </div>
          </div>

          <div className="bg-sand-50 border border-sand-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] text-ink-3 font-medium">المساهمات المحصلة</div>
              <div className="text-xl font-bold text-ink mt-0.5">
                {globalStats.totalIncome.toLocaleString()} <span className="text-[13px] font-normal text-ink-3">د.م</span>
              </div>
            </div>
          </div>

          <div className="bg-sand-50 border border-sand-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${globalStats.totalNet >= 0 ? "bg-primary-100 text-primary-700" : "bg-danger-100 text-danger-700"} flex items-center justify-center shrink-0`}>
              {globalStats.totalNet >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[13px] text-ink-3 font-medium">الصافي المالي العام للأنشطة</div>
              <div className={`text-xl font-bold mt-0.5 ${globalStats.totalNet >= 0 ? "text-primary-700" : "text-danger-700"}`}>
                {globalStats.totalNet >= 0 ? `+${globalStats.totalNet.toLocaleString()}` : globalStats.totalNet.toLocaleString()} <span className="text-[13px] font-normal text-ink-3">د.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
