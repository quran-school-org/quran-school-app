/**
 * Attestation d'examen (A4 paysage), aux couleurs de la charte et avec les
 * paramètres de l'école (nom, logo, devise, directeur, cachet). Toute donnée
 * est échappée (C-01).
 */
import { escapeHtml } from "../security/html";
import type { SystemSettings } from "../types";
import { EMBLEM_SVG } from "./docStyles";

export const CERTIFICATE_CSS = `
  @page { size: A4 landscape; margin: 8mm; }
  body { padding: 16px; background: #fff; }
  @media print { body { padding: 0; } }
  .cert { position: relative; max-width: 1040px; margin: 0 auto; background: #FBF6E6; border: 10px double #D4A017; border-radius: 22px; padding: 34px 48px; text-align: center; font-family: 'Amiri', serif; color: #1A1F2B; overflow: hidden; }
  .cert::before { content: ""; position: absolute; inset: 10px; border: 1px solid #E5C566; border-radius: 14px; pointer-events: none; }
  .cert-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid #EEDCA4; font-family: 'IBM Plex Sans Arabic', sans-serif; }
  .cert-head .who { text-align: right; }
  .cert-head .who strong { display: block; font-family: 'Reem Kufi', sans-serif; font-size: 18px; color: #1B3A6B; }
  .cert-head .who span { font-size: 12px; color: #4A5060; }
  .cert-head .ref { font-size: 12px; color: #5C4300; background: #F6EDD2; border-radius: 999px; padding: 4px 12px; }
  .logo { width: 72px; height: 72px; border: 1.5px solid #D4A017; border-radius: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; padding: 6px; }
  .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .logo svg { width: 56px; height: 56px; }
  .cert h1 { font-family: 'Reem Kufi', sans-serif; font-size: 40px; color: #102446; margin: 22px 0 6px; }
  .rule { width: 180px; height: 2px; margin: 0 auto 16px; background: linear-gradient(to left, transparent, #D4A017, transparent); }
  .hadith { font-size: 20px; color: #1B3A6B; margin: 0 auto 18px; }
  .lead { font-size: 19px; margin: 6px auto; max-width: 760px; line-height: 1.9; }
  .name { display: inline-block; font-family: 'Reem Kufi', sans-serif; font-size: 34px; color: #102446; border-bottom: 2px solid #D4A017; padding: 4px 18px; margin: 10px 0; }
  .portion { display: inline-block; background: #fff; border: 1px solid #EEDCA4; border-radius: 14px; padding: 6px 22px; font-size: 22px; font-weight: 700; color: #3A2A00; margin: 8px 0; }
  .grades { display: flex; justify-content: center; gap: 14px; margin: 12px 0; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 13px; }
  .grades span { background: #fff; border: 1px solid #D9DBD0; border-radius: 10px; padding: 6px 14px; color: #4A5060; }
  .grades strong { color: #1B3A6B; }
  .note { font-size: 16px; color: #5C4300; max-width: 640px; margin: 8px auto; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 26px; padding-top: 16px; border-top: 1px dashed #EEDCA4; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 12px; color: #6B7080; }
  .sign div { display: flex; flex-direction: column; gap: 10px; min-height: 70px; }
  .sign .end { align-items: flex-end; text-align: left; }
  .sign .start { align-items: flex-start; text-align: right; }
  .sign b { color: #1A1F2B; font-size: 13px; }
  .stamp { display: inline-block; border: 1.5px dashed #A33A2E; color: #A33A2E; border-radius: 999px; padding: 4px 14px; font-weight: 700; font-size: 12px; transform: rotate(-3deg); }
`;

export function certificateHtml(stud: any, gr: any, associationName: string, associationLogo: string, systemSettings: SystemSettings | null): string {
  return `
      <main class="cert">
        <header class="cert-head">
          <div class="who">
            <strong>${escapeHtml(associationName)}</strong>
            <span>${escapeHtml(systemSettings?.mottoVision || "نادي القرآن الكريم وتجويده")}</span><br />
            <span>تاريخ الاختبار: <span class="ltr">${escapeHtml(gr.examDate)}</span></span>
          </div>
          <div class="logo">${associationLogo ? `<img src="${escapeHtml(associationLogo)}" alt="" />` : EMBLEM_SVG}</div>
          <span class="ref">الرقم الترتيبي: <span class="ltr">${escapeHtml(String(gr.id || "").slice(-5).toUpperCase())}</span></span>
        </header>

        <h1>شهادة تقدير وتميّز</h1>
        <div class="rule"></div>
        <p class="hadith">«الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ»<br /><span style="font-size: 13px; color: #6B7080;">— حديث شريف مروي عن عائشة رضي الله عنها</span></p>

        <p class="lead">بكل فخر واعتزاز، تشهد إدارة <strong>${escapeHtml(associationName)}</strong> أن الطالب / الطالبة:</p>
        <div class="name">${escapeHtml(stud.fullName)}</div>
        <p class="lead">قد اجتاز بنجاح وتفوق اختبار حفظ وتجويد القرآن الكريم في:</p>
        <div class="portion">${escapeHtml(gr.testedPortion)}</div>
        <p class="lead">وحصل على تقدير عام <strong>${escapeHtml(gr.overallGrade)}</strong> بمعدل مشرف ينم عن جد ومثابرة.</p>
        <div class="grades">
          <span>درجة الحفظ: <strong>${escapeHtml(gr.memorizationGrade)}</strong> / 20</span>
          <span>درجة التجويد: <strong>${escapeHtml(gr.tajweedGrade)}</strong> / 20</span>
        </div>
        ${gr.notes ? `<p class="note">«ملاحظة وتوجيه المدرس: ${escapeHtml(gr.notes)}»</p>` : ""}
        <p class="lead">سائلين المولى عز وجل له دوام التوفيق والسداد، والختم القريب لكتاب الله تعالى بالبركة والقبول.</p>

        <div class="sign">
          <div class="start">
            <span>توقيع وختم الإدارة</span>
            ${systemSettings?.directorName ? `<b>${escapeHtml(systemSettings.directorName)}</b>` : ""}
            ${systemSettings?.showStampOnReceipts ? `<span class="stamp">${escapeHtml(systemSettings.stampText || associationName)}</span>` : ""}
          </div>
          <div class="end">
            <span>توقيع محفظ الحلقة</span>
          </div>
        </div>
      </main>
  `;
}
