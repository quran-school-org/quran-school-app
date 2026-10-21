/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * État et logique : finance/useFinanceState ; sections : finance/.
 */
import { Student, Teacher, Payment, SystemSettings, OtherIncome, SalaryPayment, Expense, ActivityTrip, ActivityParticipant, ActivityExpense } from "../types";
import { useFinanceState } from "./finance/useFinanceState";
import { FinanceContext } from "./finance/FinanceContext";
import FinanceHeader from "./finance/FinanceHeader";
import FinanceFilterBar from "./finance/FinanceFilterBar";
import RevenuesSection from "./finance/RevenuesSection";
import SalariesSection from "./finance/SalariesSection";
import ExpensesSection from "./finance/ExpensesSection";
import FinanceReportSection from "./finance/FinanceReportSection";
import IncomeModal from "./finance/IncomeModal";
import SalaryModal from "./finance/SalaryModal";
import ExpenseModal from "./finance/ExpenseModal";
import PrintReportModal from "./finance/PrintReportModal";

export interface FinanceManagementProps {
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  otherIncomes: OtherIncome[];
  salaryPayments: SalaryPayment[];
  expenses: Expense[];
  activities?: ActivityTrip[];
  activityParticipants?: ActivityParticipant[];
  activityExpenses?: ActivityExpense[];
  systemSettings: SystemSettings | null;
  canEditPayments?: boolean;
  canCreateFinance?: boolean;
  canUpdateFinance?: boolean;
  canDeleteFinance?: boolean;
  canPrintFinance?: boolean;
  onSaveOtherIncome: (income: OtherIncome) => void;
  onDeleteOtherIncome: (id: string) => void;
  onSaveSalaryPayment: (salary: SalaryPayment) => void;
  onDeleteSalaryPayment: (id: string) => void;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToActivities?: () => void;
}

export default function FinanceManagement(props: FinanceManagementProps) {
  const state = useFinanceState(props);
  return (
    <FinanceContext.Provider value={state}>
    <div data-screen="finance" className="space-y-6">
      <FinanceHeader />

      <FinanceFilterBar />

      <RevenuesSection />

      <SalariesSection />

      <ExpensesSection />

      <FinanceReportSection />

      <IncomeModal />

      <SalaryModal />

      <ExpenseModal />

      <PrintReportModal />
    </div>
    </FinanceContext.Provider>
  );
}
