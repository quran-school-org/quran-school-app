/** Hiérarchie du tableau de bord (audit UX, L5, D100) : alertes qui remontent, hauteur de la carte du ḥifẓ. */
import { describe, expect, it } from "vitest";
import { actionAlertCount } from "../../src/screens/dashboard/dashboardData";
import { hifzPlotHeight } from "../../src/ui/HifzMap";

const st = (id: string, extra: Record<string, unknown> = {}) => ({
  id, fullName: id, docParentId: true, docBirthCert: true, docPhotos: true, hizbCount: 3, classId: "c1", ...extra,
}) as any;
const classes = [{ id: "c1", name: "A", teacherId: "t1" }] as any;
const teachers = [{ id: "t1" }] as any;

describe("actionAlertCount", () => {
  it("zéro quand tout est en ordre (le rappel de présence ne compte pas)", () => {
    expect(actionAlertCount([st("a")], classes, teachers, [])).toBe(0);
  });
  it("compte une alerte par famille : documents, halaqas, cotisations", () => {
    expect(actionAlertCount([st("a", { docPhotos: false })], classes, teachers, [])).toBe(1);
    expect(actionAlertCount([st("a")], [{ id: "c1", teacherId: "" }] as any, teachers, [])).toBe(1);
    expect(actionAlertCount([st("a", { classId: "" })], classes, teachers, [])).toBe(1);
    expect(actionAlertCount([st("a")], classes, teachers, [{ id: "p", status: "غير مدفوع" }] as any)).toBe(1);
    expect(actionAlertCount([st("a", { docPhotos: false, classId: "" })], classes, teachers, [{ id: "p", status: "غير مدفوع" }] as any)).toBe(3);
  });
  it("ignore les paiements réglés et les élèves archivés", () => {
    expect(actionAlertCount([st("a"), st("b", { docPhotos: false, isArchived: true })], classes, teachers, [{ id: "p", status: "مدفوع" }] as any)).toBe(0);
  });
});

describe("hifzPlotHeight", () => {
  it("minimum raisonnable quand les élèves sont peu dispersés", () => {
    expect(hifzPlotHeight(0)).toBe(96);
    expect(hifzPlotHeight(1)).toBe(96);
    expect(hifzPlotHeight(3)).toBe(96);
  });
  it("croît avec le ḥizb le plus peuplé, sans jamais dépasser la hauteur historique de 236 px", () => {
    expect(hifzPlotHeight(8)).toBeGreaterThan(hifzPlotHeight(3));
    expect(hifzPlotHeight(12)).toBeGreaterThan(hifzPlotHeight(8));
    expect(hifzPlotHeight(20)).toBe(236);
    expect(hifzPlotHeight(45)).toBe(236);
  });
  it("rien de négatif ou d'aberrant", () => {
    expect(hifzPlotHeight(-4)).toBe(96);
    expect(hifzPlotHeight(2.7)).toBe(96);
  });
});
