/**
 * Traduction française (D79, disponible en production par D93) : moteur,
 * dictionnaire, couverture, chargement dynamique et garde-fou du bundle.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { frChunkProblems } from "../../scripts/dev/buildGuards";
import { computeCoverage } from "../../src/i18n-test/coverage";
import { KEEP_ARABIC, NOT_DISPLAYED } from "../../src/i18n-test/exclusions";
import { FR } from "../../src/i18n-test/fr";
import { ARABIC, createTranslator } from "../../src/i18n-test/translate";

const t = createTranslator(FR, Object.keys(KEEP_ARABIC));

describe("moteur de traduction", () => {
  it("correspondance exacte, espaces normalisés et conservés autour du texte", () => {
    expect(t.translate("تسجيل الدخول الآمن")).toBe("Connexion sécurisée");
    expect(t.translate("  تسجيل   الدخول\nالآمن ")).toBe("  Connexion sécurisée ");
  });

  it("texte sans arabe ou inconnu : rien à traduire", () => {
    expect(t.translate("Admin 2026")).toBeNull();
    expect(t.translate("ياسين العلمي")).toBeNull();
    expect(t.isMissing("ياسين العلمي")).toBe(true);
    expect(t.isMissing("ع")).toBe(false); // initiale d'avatar
  });

  it("motifs : nombres et noms repris tels quels, valeurs connues traduites", () => {
    expect(t.translate("{0} حزب".replace("{0}", "12"))).toBe("12 hizbs");
    expect(t.translate("هل أنت متأكد من حذف الطالب ياسين العلمي نهائياً؟")).toBe("Supprimer définitivement l'élève ياسين العلمي ?");
    // Valeur capturée elle-même au dictionnaire (statut) : traduite.
    expect(t.translate("[متطوع]")).toBe("[Bénévole]");
    expect(t.translate("متطوعون (1)")).toBe("Bénévoles (1)");
    // Composition générique sans valeur connue : non traduite (reste signalée manquante).
    expect(t.translate("حلقة النور (5)")).toBeNull();
    // Motif faible (« {0} و{1} ») : jamais appliqué à une citation (« وَ » n'est pas « et »).
    expect(t.translate("«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»")).toBeNull();
    expect(t.translate("الاثنين والخميس")).toBe("Lundi et Jeudi");
  });

  it("dates formatées : mois et jours traduits mot à mot", () => {
    expect(t.translate("الخميس، 23 أكتوبر 2026")).toBe("jeudi 23 octobre 2026");
    expect(t.translate("يناير 2026")).toBe("janvier 2026");
  });

  it("valeurs de rôles : libellé traduit, la clé arabe n'est pas modifiée", () => {
    expect(t.translate("مدير")).toBe("Directeur");
    expect(t.translate("ولي أمر")).toBe("Parent");
    expect(FR["مدير"]).toBe("Directeur");
  });
});

describe("dictionnaire", () => {
  const entries = Object.entries(FR);

  it("aucune traduction ne contient d'arabe, aucune n'est vide", () => {
    const bad = entries.filter(([, fr]) => !fr.trim() || ARABIC.test(fr));
    expect(bad).toEqual([]);
  });

  it("un motif ne réutilise que ses propres variables", () => {
    for (const [ar, fr] of entries) {
      const own = new Set(ar.match(/\{\d+\}/g) || []);
      for (const v of fr.match(/\{\d+\}/g) || []) expect(own.has(v), `${ar} → ${fr}`).toBe(true);
    }
  });

  it("exclusions motivées et disjointes du dictionnaire", () => {
    for (const [k, why] of [...Object.entries(KEEP_ARABIC), ...Object.entries(NOT_DISPLAYED)]) {
      expect(why.length, k).toBeGreaterThan(5);
      expect(FR[k], k).toBeUndefined();
    }
  });
});

describe("couverture des chaînes de l'interface (src/, messages des Functions, hors src/print)", () => {
  it("toutes les chaînes affichées ont une traduction ou un motif", () => {
    const r = computeCoverage();
    expect(r.total).toBeGreaterThan(1500);
    expect(r.missing.map((m) => `${m.file}:${m.line} ${m.text}`)).toEqual([]);
    expect(r.ratio).toBe(1);
  }, 60_000);
});

describe("disponible dans tous les builds (D93), chargée à la demande", () => {
  it("plus de drapeau de build : ni dans les env, ni dans le code, ni dans les workflows", () => {
    for (const f of [".env.development", ".env.production", "src/config/env.ts", "src/vite-env.d.ts", "vite.config.ts", "scripts/dev/buildGuards.ts", ".github/workflows/deploy.yml", ".github/workflows/preview.yml"]) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/VITE_ENABLE_FR_TEST|frTestEnabled/);
    }
  });

  it("le module n'est importé que dynamiquement, depuis src/i18n/language.ts", () => {
    expect(readFileSync("src/i18n/language.ts", "utf8")).toMatch(/import\("\.\.\/i18n-test"\)/);
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (full === join("src", "i18n-test")) continue;
        if (statSync(full).isDirectory()) walk(full);
        // Import statique (`from`) interdit ; `import type` ne génère aucun code.
        else if (/from\s*['"][^'"]*i18n-test/.test(readFileSync(full, "utf8").replace(/import type[^;]*;/g, ""))) offenders.push(full);
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });

  it("langue : préférence de l'appareil, hors cache d'école, jamais dans Firestore", () => {
    const lang = readFileSync("src/i18n/language.ts", "utf8");
    expect(lang).toMatch(/LANG_KEY = "ui:lang"/);
    expect(lang).not.toMatch(/from\s*"[^"]*(firebase|db)"/);
    expect(lang).toMatch(/try \{[\s\S]*localStorage/);
  });

  it("garde-fou du bundle : le dictionnaire est dans un chunk séparé du chunk d'entrée", () => {
    const fr = "/repo/src/i18n-test/fr.ts";
    const ok = [
      { fileName: "index.js", isEntry: true, moduleIds: ["/repo/src/main.tsx", "/repo/src/i18n/language.ts"] },
      { fileName: "fr-abc.js", isEntry: false, moduleIds: [fr] },
    ];
    expect(frChunkProblems(ok)).toEqual([]);
    // Dictionnaire dans le chunk d'entrée : bundle principal alourdi.
    expect(frChunkProblems([{ fileName: "index.js", isEntry: true, moduleIds: ["/repo/src/main.tsx", fr] }])).toHaveLength(2);
    // Dictionnaire absent : l'option ne marcherait pas.
    expect(frChunkProblems([ok[0]])).toHaveLength(1);
  });
});
