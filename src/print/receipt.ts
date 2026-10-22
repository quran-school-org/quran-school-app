/**
 * Reçu de paiement d'une cotisation, aux couleurs de la charte et avec les
 * paramètres de l'école (nom, logo, cachet). Toute donnée est échappée (C-01).
 */
import { escapeHtml } from "../security/html";
import type { Payment, Student, SystemSettings } from "../types";
import { EMBLEM_SVG } from "./docStyles";

export const RECEIPT_CSS = `
  @page { size: A5; margin: 10mm; }
  .receipt { max-width: 460px; margin: 24px auto; border: 1.5px solid #D9DBD0; border-radius: 18px; overflow: hidden; background: #fff; }
  .receipt-head { background: #102446; color: #EEF1F7; padding: 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .receipt-head .logo { border-color: #2E4A78; }
  .receipt-head h1 { margin: 0; font-size: 20px; color: #F6EDD2; }
  .receipt-head p { margin: 0; font-size: 12px; color: #B8C4D8; }
  .receipt-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px dashed #E1E3D8; padding-bottom: 8px; }
  .row span:first-child { color: #6B7080; }
  .row span:last-child { font-weight: 600; color: #1A1F2B; }
  .amount { margin-top: 6px; background: #F6EDD2; border-radius: 12px; padding: 14px; text-align: center; }
  .amount span { display: block; font-size: 12px; color: #5C4300; }
  .amount strong { font-size: 26px; color: #1A1F2B; }
  .note { background: #F1F2EB; border-radius: 10px; padding: 8px 10px; font-size: 12px; color: #4A5060; }
  .receipt-foot .stamp { white-space: nowrap; }
  .receipt-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; border-top: 1px solid #E1E3D8; font-size: 11px; color: #6B7080; }
`;

export function receiptHtml(p: Payment, stud: Student, systemSettings: SystemSettings | null, schoolName: string): string {
  return `
      <main class="receipt">
        <header class="receipt-head">
          <div class="logo">${systemSettings?.associationLogo ? `<img src="${escapeHtml(systemSettings.associationLogo)}" alt="" />` : EMBLEM_SVG}</div>
          <h1>${escapeHtml(schoolName)}</h1>
          <p>وصل استلام مالي • واجب الاشتراك الشهري</p>
        </header>
        <section class="receipt-body">
          <div class="row"><span>رقم الإيصال</span><span class="ltr">${escapeHtml(p.receiptNo || "—")}</span></div>
          <div class="row"><span>تاريخ الأداء</span><span class="ltr">${escapeHtml(p.paymentDate || "—")}</span></div>
          <div class="row"><span>اسم الطالب</span><span>${escapeHtml(stud.fullName)}</span></div>
          <div class="row"><span>ولي الأمر</span><span>${escapeHtml(stud.parentName)}</span></div>
          <div class="row"><span>الفترة المستحقة</span><span>شهر ${escapeHtml(p.month)} ${escapeHtml(p.year)}</span></div>
          <div class="row"><span>طريقة الأداء</span><span>${escapeHtml(p.paymentMethod || "نقداً")}</span></div>
          ${p.notes ? `<div class="note">ملاحظات: ${escapeHtml(p.notes)}</div>` : ""}
          <div class="amount"><span>المبلغ المستلم</span><strong>${escapeHtml(p.amount)} ${escapeHtml(systemSettings?.currency || "درهم")}</strong></div>
        </section>
        <footer class="receipt-foot">
          <span>شكرًا لكم على ثقتكم والتزامكم • ${escapeHtml(schoolName)}</span>
          ${systemSettings?.showStampOnReceipts ? `<span class="stamp">${escapeHtml(systemSettings.stampText || schoolName)}</span>` : ""}
        </footer>
      </main>
  `;
}
