/**
 * Relevé mensuel des présences d'un élève (A4), aux couleurs de la charte.
 * L'aperçu rendu à l'écran (`#printable-monthly-report`, HTML produit par React,
 * donc déjà échappé) est imprimé avec les styles de l'application ; le titre est
 * échappé par `printDocument` (C-01).
 */
import type { Student } from "../types";
import { openPrintWindow } from "./printWindow";

export const MONTHLY_ATTENDANCE_CSS = `
  @page { size: A4 portrait; margin: 14mm; }
  body { background: #ffffff !important; padding: 0; }
  .no-print { display: none !important; }
`;

export function printMonthlyAttendance(student: Student | null, reportElement: HTMLElement): Window | null {
  return openPrintWindow({
    title: "تقرير حضور وغياب - " + (student?.fullName || ""),
    body: '<main class="w-full">' + reportElement.innerHTML + "</main>",
    css: MONTHLY_ATTENDANCE_CSS,
    withAppStyles: true,
    blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.",
    delay: 700,
  });
}
