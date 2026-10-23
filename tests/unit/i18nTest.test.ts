/**
 * Traduction française de TEST (D79) : moteur, dictionnaire, couverture,
 * drapeau de build (dev seulement) et garde-fous du bundle de production.
 * Retrait de la traduction : supprimer ce fichier avec src/i18n-test.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";
import { describe, expect, it } from "vitest";

import { committedProductionProjectId, frTestBuildProblems, frTestBundleProblems } from "../../scripts/dev/buildGuards";
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

describe("drapeau VITE_ENABLE_FR_TEST : dev seulement", () => {
  const envFile = (f: string) => parse(readFileSync(f));

  it(".env.development l'active, .env.production ne le contient pas", () => {
    expect(envFile(".env.development").VITE_ENABLE_FR_TEST).toBe("true");
    expect(envFile(".env.production").VITE_ENABLE_FR_TEST).toBeUndefined();
    expect(readFileSync(".env.production", "utf8")).not.toMatch(/VITE_ENABLE_FR_TEST/);
  });

  it("le module n'est importé que dynamiquement, depuis main.tsx, sous le drapeau", () => {
    const main = readFileSync("src/main.tsx", "utf8");
    expect(main).toMatch(/if \(frTestEnabled\) \{\s*import\('\.\/i18n-test'\)/);
    expect(main).not.toMatch(/from ['"]\.\/i18n-test/);
    expect(readFileSync("src/config/env.ts", "utf8")).toContain('import.meta.env.VITE_ENABLE_FR_TEST === "true"');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (full === join("src", "i18n-test")) continue;
        if (statSync(full).isDirectory()) walk(full);
        else if (full !== join("src", "main.tsx") && /(from\s*|import\s*\(\s*)['"][^'"]*i18n-test/.test(readFileSync(full, "utf8"))) offenders.push(full);
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });

  it("garde-fou : jamais vrai pour un build visant le projet de production", () => {
    const prod = committedProductionProjectId(process.cwd());
    expect(prod).toBeTruthy();
    expect(frTestBuildProblems("production", { VITE_ENABLE_FR_TEST: "true", VITE_FIREBASE_PROJECT_ID: prod }, prod)).toHaveLength(1);
    expect(frTestBuildProblems("production", { VITE_ENABLE_FR_TEST: "true", VITE_FIREBASE_PROJECT_ID: "mon-projet-dev" }, prod)).toEqual([]);
    expect(frTestBuildProblems("production", { VITE_FIREBASE_PROJECT_ID: prod }, prod)).toEqual([]);
    expect(frTestBuildProblems("development", { VITE_ENABLE_FR_TEST: "true", VITE_FIREBASE_PROJECT_ID: prod }, prod)).toEqual([]);
  });

  it("garde-fou du bundle : aucun module src/i18n-test sans le drapeau", () => {
    const ids = ["/repo/src/main.tsx", "/repo/src/i18n-test/fr.ts"];
    expect(frTestBundleProblems(false, ids)).toHaveLength(1);
    expect(frTestBundleProblems(false, ["/repo/src/main.tsx"])).toEqual([]);
    expect(frTestBundleProblems(true, ids)).toEqual([]);
  });

  it("workflows : le drapeau n'est écrit que pour le dev (deploy.yml, étape dev ; preview.yml)", () => {
    const LINE = `echo 'VITE_ENABLE_FR_TEST="true"'`;
    const dir = ".github/workflows";
    const where = readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f))
      .flatMap((f) => readFileSync(join(dir, f), "utf8").split("\n").map((l, i) => ({ f, i, l })))
      .filter(({ l }) => l.includes("VITE_ENABLE_FR_TEST"));
    expect(where.map(({ f, l }) => `${f}: ${l.trim()}`)).toEqual([`deploy.yml: ${LINE}`, `preview.yml: ${LINE}`]);

    // deploy.yml : dans l'étape propre au dev, avant l'écriture de .env.production.local.
    const deploy = readFileSync(join(dir, "deploy.yml"), "utf8").split("\n");
    const at = where.find((w) => w.f === "deploy.yml")!.i;
    const stepStart = deploy.slice(0, at).map((l, i) => ({ l, i })).filter(({ l }) => /^\s+- name:/.test(l)).pop()!;
    const step = deploy.slice(stepStart.i, at + 3).join("\n");
    expect(step).toMatch(/- name: Configuration web du projet de dev/);
    expect(step).toMatch(/^\s+if: inputs\.environment == 'dev'$/m);
    expect(deploy.slice(at, at + 2).join("\n")).toMatch(/\} > \.env\.production\.local/);

    // preview.yml : le job de construction refuse la prod et les projets demo-*.
    const preview = readFileSync(join(dir, "preview.yml"), "utf8");
    expect(preview).toMatch(/demo-\*\|gen-lang-client-0481880143\) echo "::error::Projet interdit pour un aperçu/);
  });
});
