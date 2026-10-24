/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../../db";
import { OtherIncome, SalaryPayment, Expense, ActivityTrip, ActivityParticipant, ActivityExpense } from "../../types";
import type { DerivedScope } from "../scope";

export function useFinanceActions(s: DerivedScope) {
  const {
    activities,
    addSysNotification,
    loadDatabase,
  } = s;

  const handleSaveOtherIncome = (income: OtherIncome) => {
    RealmSimDB.saveOtherIncome(income);
    addSysNotification("إضافة/تعديل إيراد", `تم حفظ سجل الإيراد: ${income.title} بقيمة ${income.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteOtherIncome = (id: string) => {
    RealmSimDB.deleteOtherIncome(id);
    addSysNotification("حذف إيراد", "تم حذف سجل الإيراد بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSaveSalaryPayment = (salary: SalaryPayment) => {
    RealmSimDB.saveSalaryPayment(salary);
    addSysNotification("إصدار مستحق راتب", `تم تسجيل مستحق ${salary.personName} لمبلغ ${salary.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteSalaryPayment = (id: string) => {
    RealmSimDB.deleteSalaryPayment(id);
    addSysNotification("حذف مستحق راتب", "تم حذف سجل مستحق الراتب.", "تنبيه");
    loadDatabase();
  };

  const handleSaveExpense = (expense: Expense) => {
    RealmSimDB.saveExpense(expense);
    addSysNotification("إضافة/تعديل مصروفات", `تم تسجيل مصروف ${expense.title} بقيمة ${expense.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteExpense = (id: string) => {
    RealmSimDB.deleteExpense(id);
    addSysNotification("حذف مصروفات", "تم حذف سجل المصروفات بنجاح.", "تنبيه");
    loadDatabase();
  };

  // --- Activities & Trips Handlers (إدارة الأنشطة والرحلات) ---
  const handleSaveActivity = (activity: ActivityTrip) => {
    RealmSimDB.saveActivity(activity);
    addSysNotification(
      "إضافة/تعديل نشاط أو رحلة",
      `تم حفظ نشاط: "${activity.title}" بنجاح.`,
      "إداري"
    );
    loadDatabase();
  };

  const handleDeleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    RealmSimDB.deleteActivity(id);
    addSysNotification(
      "حذف نشاط أو رحلة",
      `تم حذف النشاط "${act?.title || ""}" وكافة سجلاته بنجاح.`,
      "تنبيه"
    );
    loadDatabase();
  };

  const handleSaveActivityParticipant = (participant: ActivityParticipant) => {
    RealmSimDB.saveActivityParticipant(participant);
    addSysNotification(
      "تسجيل مشارك في النشاط",
      `تم تسجيل المشارك "${participant.fullName}" وحفظ حالة الأداء [${participant.paymentStatus}].`,
      "مالي"
    );
    loadDatabase();
  };

  const handleDeleteActivityParticipant = (id: string) => {
    RealmSimDB.deleteActivityParticipant(id);
    addSysNotification("إلغاء تسجيل مشارك", "تم حذف سجل المشارك بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSaveActivityExpense = (expense: ActivityExpense) => {
    RealmSimDB.saveActivityExpense(expense);
    addSysNotification(
      "تسجيل مصروف نشاط/رحلة",
      `تم قيد مصروف "${expense.title}" بمبلغ ${expense.amount} د.م.`,
      "مالي"
    );
    loadDatabase();
  };

  const handleDeleteActivityExpense = (id: string) => {
    RealmSimDB.deleteActivityExpense(id);
    addSysNotification("حذف مصروف نشاط", "تم حذف المصروف بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSyncActivityToFinance = (
    activity?: ActivityTrip,
  ) => {
    RealmSimDB.syncAllActivitiesToFinance();
    loadDatabase();

    const title = activity ? activity.title : "الأنشطة والرحلات";
    addSysNotification(
      "الربط المالي التلقائي المباشر",
      `تم تحديث الربط المالي التلقائي لنشاط "${title}" بنجاح مع قيود المحاسبة والمالية الجمعوية ورصيد الصندوق.`,
      "مالي"
    );
  };

  return {
    handleSaveOtherIncome,
    handleDeleteOtherIncome,
    handleSaveSalaryPayment,
    handleDeleteSalaryPayment,
    handleSaveExpense,
    handleDeleteExpense,
    handleSaveActivity,
    handleDeleteActivity,
    handleSaveActivityParticipant,
    handleDeleteActivityParticipant,
    handleSaveActivityExpense,
    handleDeleteActivityExpense,
    handleSyncActivityToFinance,
  };
}
