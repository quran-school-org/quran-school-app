import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  STAFF_PRIVATE_FIELDS,
  hasStaffPrivateFields,
  mergeStaffRecords,
  splitStaffRecord,
  stripStaffPrivate,
} from "../../src/security/staffPrivate";

const full = {
  id: "t1",
  fullName: "يوسف البقالي",
  phone: "0600000001",
  category: "أستاذ / محفظ",
  monthlySalary: 2500,
  contractType: "مكافأة شهرية",
  cinNumber: "XX000001",
  emergencyContact: "0611111111",
  birthDate: "1990-01-01",
  address: "سلا",
};

describe("fiche du personnel scindée (R-06, D42)", () => {
  it("sépare les champs RH de la fiche publique", () => {
    const { publicData, privateData } = splitStaffRecord(full);
    expect(publicData).toEqual({ id: "t1", fullName: "يوسف البقالي", phone: "0600000001", category: "أستاذ / محفظ" });
    expect(Object.keys(privateData).sort()).toEqual([...STAFF_PRIVATE_FIELDS].sort());
    expect(hasStaffPrivateFields(publicData)).toBe(false);
    expect(hasStaffPrivateFields(full)).toBe(true);
  });

  it("un champ RH absent n'apparaît pas dans la partie RH (pas d'effacement en fusion)", () => {
    const { privateData } = splitStaffRecord({ id: "t2", fullName: "x", monthlySalary: 0, cinNumber: undefined });
    expect(privateData).toEqual({ monthlySalary: 0 });
  });

  it("recompose fiche publique + fiche RH, ignore les fiches RH orphelines", () => {
    const { publicData, privateData } = splitStaffRecord(full);
    const merged = mergeStaffRecords([publicData, { id: "t3", fullName: "sans RH" }], [
      { id: "t1", ...privateData, schoolId: "alfajr", teacherId: "t1" },
      { id: "orphelin", monthlySalary: 9 },
    ]);
    expect(merged).toEqual([full, { id: "t3", fullName: "sans RH" }]);
  });

  it("la fiche RH l'emporte sur un champ hérité resté dans la fiche publique", () => {
    const merged = mergeStaffRecords([{ id: "t1", monthlySalary: 1 }], [{ id: "t1", monthlySalary: 2500 }]);
    expect(merged[0].monthlySalary).toBe(2500);
  });

  it("retire les champs RH d'une fiche lue sans droit RH", () => {
    expect(stripStaffPrivate(full)).toEqual({ id: "t1", fullName: "يوسف البقالي", phone: "0600000001", category: "أستاذ / محفظ" });
  });

  it("les règles Firestore utilisent exactement la même liste de champs", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const m = rules.match(/function staffPrivateFields\(\)\s*\{\s*return\s*\[([^\]]*)\]/);
    expect(m).not.toBeNull();
    const fields = m![1].split(",").map((x) => x.trim().replace(/'/g, "")).filter(Boolean);
    expect(fields).toEqual([...STAFF_PRIVATE_FIELDS]);
  });
});
