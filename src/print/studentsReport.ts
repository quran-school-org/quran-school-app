/**
 * Rapport des élèves et de leur progression (A4), aux couleurs de la charte.
 * `tableRows` est construit dans usePrintActions avec des valeurs échappées ;
 * toute autre donnée est échappée ici (C-01).
 */
import { escapeHtml } from "../security/html";
import type { SystemSettings } from "../types";
import { EMBLEM_SVG } from "./docStyles";

export function studentsReportHtml(reportTitle: string, tableRows: string, totalCount: number, maleCount: number, femaleCount: number, avgHizb: number, systemSettings: SystemSettings | null, schoolName: string): string {
  return `
      <main class="doc">
        <header class="doc-head">
          <div class="brand">
            <div class="logo">${systemSettings?.associationLogo ? `<img src="${escapeHtml(systemSettings.associationLogo)}" alt="" />` : EMBLEM_SVG}</div>
            <div>
              <h1>${escapeHtml(schoolName)}</h1>
              <p>تقرير كشف شؤون الطلاب والتقدم الدراسي</p>
            </div>
          </div>
          <div class="meta">تاريخ التقرير<strong class="ltr">${escapeHtml(new Date().toLocaleDateString("ar-MA-u-nu-latn"))}</strong></div>
        </header>

        <section class="band">
          <h2>${escapeHtml(reportTitle)}</h2>
          <p>نسخة مطبوعة من سجلات الطلاب والتقدم الدراسي الحالية</p>
        </section>

        <section class="kpis">
          <div class="kpi"><span>إجمالي الطلاب في الكشف</span><strong>${escapeHtml(totalCount)} طالب</strong></div>
          <div class="kpi"><span>التوزيع حسب الجنس</span><strong>${escapeHtml(maleCount)} ذكور / ${escapeHtml(femaleCount)} إناث</strong></div>
          <div class="kpi"><span>متوسط الحفظ الفعلي</span><strong>${escapeHtml(avgHizb)} حزب</strong></div>
        </section>

        <table class="grid">
          <thead>
            <tr>
              <th>الاسم الكامل</th>
              <th class="c">تاريخ الميلاد</th>
              <th class="c">الجنس</th>
              <th>ولي الأمر / الهاتف</th>
              <th>التقدم في الحفظ</th>
              <th class="c">مستوى التجويد</th>
              <th class="c">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <footer class="doc-foot">
          <span>${escapeHtml(schoolName)} • إدارة شؤون الطلاب</span>
          <span>${escapeHtml(systemSettings?.footerNotice || "")}</span>
        </footer>
      </main>
  `;
}
