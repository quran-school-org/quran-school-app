/**
 * Relevé mensuel des présences d'un élève (A4).
 * Gabarit HTML déplacé tel quel depuis App.tsx (Lot 2).
 */
import { escapeHtml } from "../security/html";
import type { Payment, Student, SystemSettings } from "../types";

export function monthlyAttendanceHtml(selectedStudentForReport: Student | null, tailwindCdn: string, reportElement: HTMLElement): string {
  return `
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير حضور وغياب - ${escapeHtml(selectedStudentForReport?.fullName || "")}</title>
          ${tailwindCdn}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white p-4">
          <div class="w-full">
            ${reportElement.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 1000);
          </script>
        </body>
      </html>
  `;
}
