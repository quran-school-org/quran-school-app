/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import FinanceManagement from "../components/FinanceManagement";
import { useApp } from "../app/AppContext";

export default function FinanceScreen() {
  const {
    students,
    teachers,
    payments,
    systemSettings,
    otherIncomes,
    salaryPayments,
    expenses,
    activities,
    activityParticipants,
    activityExpenses,
    currentUser,
    setActiveTab,
    currentRole,
    handleSaveOtherIncome,
    handleDeleteOtherIncome,
    handleSaveSalaryPayment,
    handleDeleteSalaryPayment,
    handleSaveExpense,
    handleDeleteExpense,
  } = useApp();

  return (
    <FinanceManagement
      students={students}
      teachers={teachers}
      payments={payments}
      otherIncomes={otherIncomes}
      salaryPayments={salaryPayments}
      expenses={expenses}
      activities={activities}
      activityParticipants={activityParticipants}
      activityExpenses={activityExpenses}
      systemSettings={systemSettings}
      canEditPayments={checkUserPermission(currentUser, currentRole, "finance", "update")}
      canCreateFinance={checkUserPermission(currentUser, currentRole, "finance", "create")}
      canUpdateFinance={checkUserPermission(currentUser, currentRole, "finance", "update")}
      canDeleteFinance={checkUserPermission(currentUser, currentRole, "finance", "delete")}
      canPrintFinance={checkUserPermission(currentUser, currentRole, "finance", "print")}
      onSaveOtherIncome={handleSaveOtherIncome}
      onDeleteOtherIncome={handleDeleteOtherIncome}
      onSaveSalaryPayment={handleSaveSalaryPayment}
      onDeleteSalaryPayment={handleDeleteSalaryPayment}
      onSaveExpense={handleSaveExpense}
      onDeleteExpense={handleDeleteExpense}
      onNavigateToActivities={() => setActiveTab("activities")}
    />
  );
}
