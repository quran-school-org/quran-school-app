/**
 * Aperçu imprimable de la carte officielle de l'élève (recto et verso), dans la
 * fiche de l'élève. Impression via la fenêtre d'impression de la charte.
 */
import React, { useRef } from "react";
import { Printer } from "lucide-react";
import type { Class, Student } from "../types";
import { RealmSimDB } from "../db";
import { useApp } from "../app/AppContext";
import { Button } from "../ui";
import { OfficialCardBack, OfficialCardFront } from "../print/cards/StudentCards";
import { openPrintWindow } from "../print/printWindow";

interface StudentCardProps {
  student: Student;
  studentClass?: Class;
  canPrint?: boolean;
}

export default function StudentCard({ student, canPrint = true }: StudentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { systemSettings, schoolName } = useApp();
  if (!student) return null;
  const ctx = { settings: systemSettings, schoolName };
  // Cotisations lues dans le cache local, comme l'ancienne carte.
  const payments = RealmSimDB.getPayments();

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;
    openPrintWindow({
      title: `بطاقة الطالب - ${student.fullName}`,
      withAppStyles: true,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة البطاقة.",
      delay: 500,
      css: `@page { size: auto; margin: 8mm; } .print-page { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-items: center; padding: 16px; } @media print { .print-page { min-height: 100vh; } }`,
      body: `<div class="print-page">${printContent}</div>`,
    });
  };

  return (
    <div className="flex flex-col items-center gap-5 p-1 w-full">
      {canPrint && (
        <Button variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" strokeWidth={1.75} />} className="no-print">
          طباعة وتصدير بطاقة الطالب
        </Button>
      )}
      <div ref={cardRef} className="flex flex-col 2xl:flex-row gap-6 justify-center items-center" style={{ direction: "rtl" }}>
        <OfficialCardFront student={student} ctx={ctx} />
        <OfficialCardBack student={student} payments={payments} ctx={ctx} />
      </div>
    </div>
  );
}
