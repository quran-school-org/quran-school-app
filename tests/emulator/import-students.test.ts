/**
 * scripts/admin/import-students.ts sur les émulateurs, avec un CSV FICTIF
 * (tests/fixtures/eleves-fictifs.csv). Voir docs/runbooks/NOUVELLE-ECOLE.md, D72.
 */
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { initAdmin, parseCommonArgs, type AdminHandles } from "../../scripts/admin/lib/cli";
import { nextStudentNumber, parseCsv, runStudentImport, validateRows } from "../../scripts/admin/import-students";
import { getMonthsToGenerate } from "../../src/school/businessRules";

const PROJECT = "demo-quran-school";
const S = "nouvelle";
const CSV = readFileSync("tests/fixtures/eleves-fictifs.csv", "utf8");
const NOW = new Date("2026-10-22T10:00:00Z");
let admin: AdminHandles;

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
}

beforeAll(() => {
  admin = initAdmin(PROJECT, "(default)", true, "import-test");
});

afterAll(async () => {
  await admin?.close();
});

beforeEach(async () => {
  await clear();
  const db = admin.db;
  for (const s of [S, "autre"]) {
    await db.doc(`schools/${s}`).set({ name: s, status: "active" });
    await db.doc(`schools/${s}/settings/system`).set({ schoolId: s, subscriptionFee: 80, openingYear: 2026, openingMonth: "شتمبر", feeOverrides: [] });
  }
  await db.doc(`schools/${S}/classes/c1`).set({ schoolId: S, name: "حلقة الفرقان", teacherId: "t1" });
  await db.doc(`schools/autre/classes/c9`).set({ schoolId: "autre", name: "حلقة غير موجودة", teacherId: "t1" });
  // Un élève déjà inscrit (même nom, même date de naissance vide que la dernière ligne du CSV).
  await db.doc(`schools/${S}/students/S-140`).set({ schoolId: S, fullName: "إلياس البركاني", birthDate: "" });
});

const opts = (extra: Partial<Parameters<typeof runStudentImport>[1]> = {}) => ({ schoolId: S, csv: CSV, apply: false, now: NOW, outDir: null, ...extra });

describe("analyse et validation du CSV (fichier fictif)", () => {
  it("BOM, séparateur « ; », guillemets, champ contenant le séparateur", () => {
    const t = parseCsv(CSV);
    expect(t[0][0]).toBe("fullName");
    expect(t[1][9]).toBe("ملاحظة; مع فاصلة منقوطة");
  });

  it("codes d'anomalie : genre, date impossible, halaqa inconnue (même si elle existe dans une AUTRE école), hizb, tajwid, doublon", () => {
    const { rows, unknownColumns } = validateRows(parseCsv(CSV), [{ id: "c1", name: "حلقة الفرقان" }]);
    expect(unknownColumns).toEqual(["colonneInconnue"]);
    expect(rows.map((r) => r.codes)).toEqual([
      [],
      [],
      ["GENRE_INVALIDE"],
      ["DATE_NAISSANCE_INVALIDE", "HIZB_INVALIDE", "TAJWID_INVALIDE", "HALAQA_INCONNUE"],
      ["DOUBLON_FICHIER:ligne_2"], // espaces multiples normalisés
      [],
    ]);
    expect(rows[0].data.classId).toBe("c1");
    expect(rows[1].data.gender).toBe("أنثى");
  });

  it("refus : colonne de mot de passe, en-tête incomplet ; halaqa homonyme ambiguë", () => {
    expect(() => validateRows(parseCsv("fullName,gender,password\nx,ذكر,123\n"), [])).toThrow(/mot de passe/);
    expect(() => validateRows(parseCsv("nom,genre\nx,ذكر\n"), [])).toThrow(/fullName/);
    const { rows } = validateRows(parseCsv("fullName,gender,className\nx,ذكر,حلقة\n"), [{ id: "a", name: "حلقة" }, { id: "b", name: "حلقة" }]);
    expect(rows[0].codes).toEqual(["HALAQA_AMBIGUE"]);
    // Jamais de correspondance approximative (includes) : « حلقة الفرقان » ne désigne pas « حلقة الفرقان 2 ».
    expect(validateRows(parseCsv("fullName,gender,className\nx,ذكر,حلقة الفرقان\n"), [{ id: "a", name: "حلقة الفرقان 2" }]).rows[0].codes).toEqual(["HALAQA_INCONNUE"]);
  });

  it("identifiants : même règle que l'interface (S-101 au minimum, suite du plus grand)", () => {
    expect(nextStudentNumber([])).toBe(101);
    expect(nextStudentNumber(["S-140", "s_7", "1784000000000", "x"])).toBe(141);
  });
});

describe("import sur l'émulateur", () => {
  it("simulation par défaut : rien n'est écrit ; anomalies bloquantes : rien n'est écrit même avec --apply", async () => {
    const dry = await runStudentImport(admin.db, opts());
    expect(dry.summary).toMatchObject({ mode: "simulation", rows: 6, rejected: 3, alreadyPresent: 1, created: 0, blocked: true });
    const blocked = await runStudentImport(admin.db, opts({ apply: true }));
    expect(blocked.summary.created).toBe(0);
    expect((await admin.db.collection(`schools/${S}/students`).get()).size).toBe(1);
  });

  it("--skip-invalid : seules les lignes valides et nouvelles sont créées, avec schoolId, sans toucher l'autre école ni l'élève existant", async () => {
    const { summary, report } = await runStudentImport(admin.db, opts({ apply: true, skipInvalid: true }));
    expect(summary).toMatchObject({ created: 2, rejected: 3, alreadyPresent: 1, paymentsCreated: 0 });
    expect(report.filter((r) => r.status === "créé").map((r) => r.studentId)).toEqual(["S-141", "S-142"]);
    const a = (await admin.db.doc(`schools/${S}/students/S-141`).get()).data()!;
    expect(a).toMatchObject({ schoolId: S, fullName: "يوسف الوهمي", gender: "ذكر", classId: "c1", hizbCount: 3, tajweedLevel: "ممتاز", isArchived: false, photo: "" });
    expect(a.password).toBeUndefined();
    expect((await admin.db.doc(`schools/${S}/students/S-142`).get()).data()).toMatchObject({ gender: "أنثى", tajweedLevel: "متوسط", classId: "" });
    expect((await admin.db.doc(`schools/${S}/students/S-140`).get()).data()).toEqual({ schoolId: S, fullName: "إلياس البركاني", birthDate: "" });
    expect((await admin.db.collection("schools/autre/students").get()).size).toBe(0);
    expect((await admin.db.collection("students").get()).size).toBe(0); // racine intacte

    // Relance : idempotente (tout est « déjà présent » ou rejeté).
    const again = await runStudentImport(admin.db, opts({ apply: true, skipInvalid: true }));
    expect(again.summary).toMatchObject({ created: 0, alreadyPresent: 3 });
    expect((await admin.db.collection(`schools/${S}/students`).get()).size).toBe(3);
  });

  it("--payments=ui : cotisations « غير مدفوع » comme l'interface, au tarif de l'école", async () => {
    const { summary } = await runStudentImport(admin.db, opts({ apply: true, skipInvalid: true, payments: "ui" }));
    const settings = (await admin.db.doc(`schools/${S}/settings/system`).get()).data()!;
    const months = getMonthsToGenerate(settings, "2026-09-01", NOW).length; // septembre et octobre 2026
    expect(months).toBe(2);
    expect(summary.paymentsCreated).toBe(2 * months);
    const p = (await admin.db.doc(`schools/${S}/payments/p_new_S-141_0`).get()).data()!;
    expect(p).toMatchObject({ schoolId: S, studentId: "S-141", amount: 80, status: "غير مدفوع", month: "شتمبر", year: 2026 });
  });

  it("école inconnue ou sans paramètres : refus", async () => {
    await expect(runStudentImport(admin.db, opts({ schoolId: "inconnue" }))).rejects.toThrow(/École inconnue/);
    await admin.db.doc("schools/vide").set({ name: "vide" });
    await expect(runStudentImport(admin.db, opts({ schoolId: "vide" }))).rejects.toThrow(/Paramètres absents/);
  });

  it("rapport : numéros de ligne, identifiants et codes, aucun nom ni téléphone", async () => {
    const out = mkdtempSync(join(tmpdir(), "import-"));
    const { summary } = await runStudentImport(admin.db, opts({ outDir: out }));
    const dir = summary.reportDir!;
    expect(readdirSync(dir).sort()).toEqual(["rapport.csv", "resume.json"]);
    const csv = readFileSync(join(dir, "rapport.csv"), "utf8");
    expect(csv).toContain("GENRE_INVALIDE");
    for (const personal of ["يوسف", "مريم", "0611111111", "أب وهمي"]) expect(csv).not.toContain(personal);
  });

  it("garde-fous de la ligne de commande : --project obligatoire, vrai projet refusé sous émulateurs", () => {
    expect(() => parseCommonArgs(["--school=x"], process.env)).toThrow(/--project/);
    expect(() => parseCommonArgs(["--project=gen-lang-client-0481880143", "--school=x"], process.env)).toThrow(/émulateur/);
    expect(parseCommonArgs(["--project=demo-quran-school"], process.env).apply).toBe(false);
  });
});
