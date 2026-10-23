/** Revue de sécurité R-01 / R-08 : politique de remplacement des mots de passe exposés. */
import { describe, expect, it } from "vitest";

import { generateTemporaryPassword, isWeakPassword, parseRotationPolicy, shouldRotate } from "../../scripts/admin/lib/passwords";

describe("mots de passe temporaires", () => {
  it("sont aléatoires, longs et sans caractère ambigu", () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateTemporaryPassword()));
    expect(seen.size).toBe(200);
    for (const p of seen) expect(p).toMatch(/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/);
  });

  it("4 groupes (comptes de démonstration, D77) : 19 caractères ; nombre de groupes borné", () => {
    const p = generateTemporaryPassword(4);
    expect(p).toMatch(/^([a-hjkmnp-z2-9]{4}-){3}[a-hjkmnp-z2-9]{4}$/);
    expect(p.length).toBe(19);
    expect(() => generateTemporaryPassword(0)).toThrow();
    expect(() => generateTemporaryPassword(2.5)).toThrow();
  });
});

describe("politique de remplacement", () => {
  const acc = (role: string, knownPassword: string | null, username = "x_user", phone = "") => ({ role, knownPassword, username, phone });

  it("par défaut (all) : tout compte non encore provisionné", () => {
    expect(parseRotationPolicy(undefined)).toBe("all");
    expect(shouldRotate("all", acc("ولي أمر", "Un-mot-de-passe-solide-2026"))).toBe(true);
    expect(shouldRotate("all", acc("ولي أمر", null))).toBe(false); // déjà provisionné : jamais régénéré
  });

  it("weak : faibles, publiés, dérivés de l'identifiant ou du téléphone, et tout le bureau", () => {
    expect(isWeakPassword("123", "u")).toBe(true);
    expect(isWeakPassword("FajrAcademy@2026!", "u")).toBe(true);
    expect(isWeakPassword("mohammed_alami2026", "mohammed_alami")).toBe(true);
    expect(isWeakPassword("0661000001", "u", "06 61 00 00 01")).toBe(true);
    expect(isWeakPassword("12345678", "u")).toBe(true);
    expect(isWeakPassword("Un-mot-de-passe-solide-2026", "u")).toBe(false);
    expect(shouldRotate("weak", acc("إداري", "Un-mot-de-passe-solide-2026"))).toBe(true);
    expect(shouldRotate("weak", acc("مدرس", "Un-mot-de-passe-solide-2026"))).toBe(false);
    expect(shouldRotate("none", acc("مدير", "123"))).toBe(false);
  });

  it("refuse une politique inconnue", () => {
    expect(() => parseRotationPolicy("parfois")).toThrow(/rotate-passwords/);
  });
});
