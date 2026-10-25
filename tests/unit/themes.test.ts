/**
 * Thèmes de couleur par école (D84) : correspondance identifiant → jetons,
 * valeur par défaut, contrastes WCAG, fichier CSS généré à jour, thème de
 * référence identique à la charte, plus de couleur de la charte codée en dur
 * dans les écrans.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME, REFERENCE_TOKENS, THEMES, THEME_IDS, THEME_TOKEN_NAMES, getTheme, resolveThemeId, themeTokens, themesStylesheet,
} from "../../src/theme/palettes";
import { transposeShade } from "../../src/theme/color";
import { readLastTheme, rememberLastTheme } from "../../src/cache/localCache";

// Contraste WCAG 2.x, écrit ici indépendamment de src/theme/color.ts.
function lum(hex: string): number {
  const v = hex.replace("#", "").match(/../g)!.map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const CHARTE = {
  "bleu-nuit": { night: "#102446", primary: "#1B3A6B", gold: "#D4A017", app: "#ECEDE6", name: "الأزرق الليلي" },
  emeraude: { night: "#0E3B2E", primary: "#1F6F4A", gold: "#C9A227", app: "#EFEFE6", name: "الزمردي والذهبي" },
  sauge: { night: "#1E3A34", primary: "#2F6B5E", gold: "#D4A017", app: "#EEF0EA", name: "الأخضر الرمادي والنحاسي" },
  foret: { night: "#0B2A1E", primary: "#166534", gold: "#E0B84C", app: "#EDEFE9", name: "أخضر الغابة" },
  olive: { night: "#2E3A1F", primary: "#4D5E26", gold: "#D9B05A", app: "#F2EFE6", name: "الزيتوني والرملي" },
} as const;

const ROOT = join(__dirname, "../..");
const indexCss = readFileSync(join(ROOT, "src/index.css"), "utf8");

describe("identifiants et valeur par défaut", () => {
  it("cinq thèmes, émeraude par défaut (D88)", () => {
    expect([...THEME_IDS]).toEqual(["bleu-nuit", "emeraude", "sauge", "foret", "olive"]);
    expect(DEFAULT_THEME).toBe("emeraude");
  });

  it("valeur absente, vide ou inconnue : émeraude", () => {
    for (const v of [undefined, null, "", "vert", "FORET", 3, {}]) expect(resolveThemeId(v)).toBe("emeraude");
    for (const id of THEME_IDS) expect(resolveThemeId(id)).toBe(id);
    expect(themeTokens("inconnu")).toEqual(themeTokens(undefined));
    expect(themeTokens(undefined)).toEqual(themeTokens("emeraude"));
  });
});

describe("correspondance identifiant → jetons", () => {
  for (const id of THEME_IDS) {
    it(`${id} : couleurs de base de la charte`, () => {
      const c = CHARTE[id];
      const t = themeTokens(id);
      expect(getTheme(id).name).toBe(c.name);
      expect(t.night).toBe(c.night);
      expect(t.primary).toBe(c.primary);
      expect(t.gold).toBe(c.gold);
      expect(t.app).toBe(c.app);
      // Encre des chiffres et survol du principal : la couleur de la barre latérale.
      expect(t["primary-900"]).toBe(c.night);
      expect(t["primary-hover"]).toBe(c.night);
      for (const name of THEME_TOKEN_NAMES) expect(t[name], name).toMatch(/^#[0-9A-F]{6}$/);
    });
  }

  it("bleu-nuit = valeurs de @theme dans src/index.css (pixel pour pixel)", () => {
    const theme = indexCss.slice(indexCss.indexOf("@theme {"), indexCss.indexOf("\n}", indexCss.indexOf("@theme {")));
    const declared = Object.fromEntries([...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/g)].map((m) => [m[1], m[2].toUpperCase()]));
    for (const name of THEME_TOKEN_NAMES) expect(declared[name], name).toBe(REFERENCE_TOKENS[name]);
    expect(themeTokens("bleu-nuit")).toEqual(REFERENCE_TOKENS);
  });

  it("transposition : identité sur la palette de référence, teinte suivie sinon", () => {
    expect(transposeShade("#2E4A78", "#102446", "#102446")).toBe("#2E4A78");
    const green = transposeShade("#2E4A78", "#102446", "#0B2A1E");
    const [r, g, b] = green.slice(1).match(/../g)!.map((x) => parseInt(x, 16));
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it("src/theme/themes.css est à jour (npx tsx scripts/dev/gen-theme-css.ts)", () => {
    expect(readFileSync(join(ROOT, "src/theme/themes.css"), "utf8")).toBe(themesStylesheet());
    expect(indexCss).toContain('@import "./theme/themes.css";');
  });
});

describe("contrastes WCAG (texte ≥ 4,5:1)", () => {
  for (const def of THEMES) {
    it(`${def.id}`, () => {
      const t = themeTokens(def.id);
      const pairs: [string, string, string][] = [
        ["texte blanc sur principal", "#FFFFFF", t.primary],
        ["texte blanc sur survol du principal", "#FFFFFF", t["primary-hover"]],
        ["or sur barre latérale", t.gold, t.night],
        ["barre latérale sur or (pastilles)", t.night, t.gold],
        ["principal sur fond", t.primary, t.app],
        ["principal sur fond pâle (badge « ممتاز »)", t.primary, t["primary-100"]],
        ["encre des chiffres sur blanc", t["primary-900"], "#FFFFFF"],
        ["primary-800 sur blanc", t["primary-800"], "#FFFFFF"],
        ["primary-500 sur blanc", t["primary-500"], "#FFFFFF"],
        ["texte du menu sur barre latérale", t["night-text"], t.night],
        ["texte atténué sur barre latérale", t["night-muted"], t.night],
        ["libellés du menu sur barre latérale", t["night-label"], t.night],
        ["liens du menu sur barre latérale", t["night-link"], t.night],
        ["texte secondaire sur barre latérale", t["night-soft"], t.night],
        ["élément actif du menu", t["gold-glow"], t.night],
      ];
      for (const [label, fg, bg] of pairs) expect(ratio(fg, bg), `${label} (${fg} / ${bg})`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("couleurs de la charte codées en dur", () => {
  const CHARTE_HEX = /#(102446|1B3A6B|D4A017|ECEDE6|1B2F55|2E4A78|2B4470|EEF1F7|B8C4D8|8FA0BD|C9D3E3|A9B6CC|7586A3|3A5785|FFF7DD|FFF2C7|FFE08A|5B7FB0)\b|rgba\((16, ?36, ?70|212, ?160, ?23)/i;
  // Exceptions : jetons eux-mêmes (theme/, index.css), impressions et cartes
  // d'élève (hors périmètre, couleurs fixes), traduction de test (repli de var()).
  const SKIP = ["src/theme/", "src/print/", "src/index.css", "src/i18n-test/"];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${f}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(tsx?|css)$/.test(f)) files.push(rel);
    }
  };
  walk("src");

  it("les écrans passent par les variables du thème", () => {
    const offenders = files
      .filter((f) => !SKIP.some((s) => f.startsWith(s)))
      .flatMap((f) => readFileSync(join(ROOT, f), "utf8").split("\n").map((line, i) => [f, i + 1, line] as const))
      .filter(([, , line]) => CHARTE_HEX.test(line))
      .map(([f, n]) => `${f}:${n}`);
    expect(offenders).toEqual([]);
  });
});

describe("dernier thème de l'appareil", () => {
  it("clé hors du préfixe purgé à la déconnexion (kuttab:)", () => {
    const store = new Map<string, string>();
    const g = globalThis as unknown as { localStorage?: unknown };
    const previous = g.localStorage;
    g.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    try {
      rememberLastTheme("foret");
      expect(readLastTheme()).toBe("foret");
      expect([...store.keys()].every((k) => !k.startsWith("kuttab:"))).toBe(true);
    } finally {
      g.localStorage = previous;
    }
  });
});
