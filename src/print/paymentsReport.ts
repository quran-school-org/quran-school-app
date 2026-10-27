/**
 * Rapport financier des cotisations (A4), aux couleurs de la charte.
 * `tableRows` est construit dans usePrintActions avec des valeurs échappées ;
 * toute autre donnée est échappée ici (C-01).
 */
import { escapeHtml } from "../security/html";
import { formatMoney } from "../format/money";
import type { Payment, SystemSettings } from "../types";
import { EMBLEM_SVG } from "./docStyles";

export function paymentsReportHtml(reportTitle: string, tableRows: string, filteredPayments: Payment[], totalCollected: number, totalPending: number, systemSettings: SystemSettings | null, schoolName: string): string {
  return `
      <main class="doc">
        <header class="doc-head">
          <div class="brand">
            <div class="logo">${systemSettings?.associationLogo ? `<img src="${escapeHtml(systemSettings.associationLogo)}" alt="" />` : EMBLEM_SVG}</div>
            <div>
              <h1>${escapeHtml(schoolName)}</h1>
              <p>التقرير المالي التفصيلي للاشتراكات والرسوم الإدارية</p>
            </div>
          </div>
          <div class="meta">تاريخ إصدار التقرير<strong class="ltr">${escapeHtml(new Date().toLocaleDateString("ar-MA-u-nu-latn"))}</strong></div>
        </header>

        <section class="band">
          <h2>${escapeHtml(reportTitle)}</h2>
          <p>عدد السجلات الإجمالي في التقرير: ${escapeHtml(filteredPayments.length)} معاملة</p>
        </section>

        <section class="kpis">
          <div class="kpi ok"><span>إجمالي المداخيل المحصلة</span><strong>${escapeHtml(formatMoney(totalCollected))}</strong></div>
          <div class="kpi ko"><span>إجمالي المستحقات المعلقة</span><strong>${escapeHtml(formatMoney(totalPending))}</strong></div>
          <div class="kpi"><span>المجموع المتوقع للدفعة</span><strong>${escapeHtml(formatMoney(totalCollected + totalPending))}</strong></div>
        </section>

        <table class="grid">
          <thead>
            <tr>
              <th>اسم الطالب</th>
              <th class="c">الفترة</th>
              <th class="c">المبلغ</th>
              <th class="c">حالة السداد</th>
              <th class="c">تاريخ الدفع</th>
              <th class="c">طريقة الدفع</th>
              <th class="c">رقم الوصل</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <footer class="doc-foot">
          <span>${escapeHtml(schoolName)} • إدارة الحسابات والمالية</span>
          <span>${escapeHtml(systemSettings?.footerNotice || "")}</span>
        </footer>
      </main>
  `;
}
