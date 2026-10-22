/**
 * Faces des cartes de l'atelier (carte numérique QR et carte officielle),
 * dessinées par src/print/cards/StudentCards.tsx aux couleurs de la charte.
 */
import { RealmSimDB } from "../../db";
import type { Student, SystemSettings } from "../../types";
import { DigitalCardBack, DigitalCardFront, OfficialCardBack, OfficialCardFront } from "../../print/cards/StudentCards";

export function makeCardRenderers(systemSettings: SystemSettings | null, schoolName: string) {
  const ctx = { settings: systemSettings, schoolName };
  const renderFrontSide = (student: Student, studentClass: any) =>
    student ? <DigitalCardFront student={student} studentClassName={studentClass?.name} ctx={ctx} /> : null;
  const renderBackSide = (student: Student) => (student ? <DigitalCardBack student={student} ctx={ctx} /> : null);
  const renderOfficialFrontSide = (student: Student, _studentClass: any) => (student ? <OfficialCardFront student={student} ctx={ctx} /> : null);
  // Cotisations lues dans le cache local, comme l'ancienne carte.
  const renderOfficialBackSide = (student: Student) => (student ? <OfficialCardBack student={student} payments={RealmSimDB.getPayments()} ctx={ctx} /> : null);
  return { renderFrontSide, renderBackSide, renderOfficialFrontSide, renderOfficialBackSide };
}
