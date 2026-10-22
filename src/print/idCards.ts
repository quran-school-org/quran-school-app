/**
 * Impression des cartes d'élève, à l'unité ou par lot.
 * Gabarit HTML déplacé tel quel depuis App.tsx (Lot 2).
 */
import { escapeHtml } from "../security/html";
import type { Payment, Student, SystemSettings } from "../types";

export function singleCardHtml(labStudent: Student, sideSuffix: string, printSide: "both" | "front" | "back", labScale: number, printContent: HTMLElement): string {
  return `
        <html dir="rtl" lang="ar">
          <head>
            <title>بطاقة الطالب - ${escapeHtml(labStudent.fullName)}${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 0;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              @page {
                margin: 0;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  padding: 0;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: center center; display: flex; justify-content: center; align-items: center; gap: 24px; padding: 20px;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 600);
              };
            </script>
          </body>
        </html>
  `;
}

export function bulkCardsHtml(sideSuffix: string, printSide: "both" | "front" | "back", labScale: number, printContent: HTMLElement): string {
  return `
        <html dir="rtl" lang="ar">
          <head>
            <title>الطباعة الجماعية للبطاقات${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 1.5cm;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 1cm;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  padding: 0;
                }
                .break-inside-avoid {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: top center; width: 100%;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 800);
              };
            </script>
          </body>
        </html>
  `;
}
