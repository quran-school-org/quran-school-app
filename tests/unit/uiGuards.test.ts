/**
 * Garde-fous de l'intégration design + durcissement (D63) : valeurs codées en
 * dur retirées de l'interface, qui ne doivent pas revenir.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
const all = sourceFiles("src").map((f) => [f, readFileSync(f, "utf8")] as const);
const offending = (re: RegExp) => all.filter(([, src]) => re.test(src)).map(([f]) => f);

describe("interface : valeurs codées en dur retirées", () => {
  it("aucun téléphone de secours d'une école (06.74.633.108) : téléphone de l'école ou vide", () => {
    expect(offending(/06[.\s-]?74[.\s-]?633[.\s-]?108/)).toEqual([]);
  });

  it("aucun mot de passe par défaut affiché ou proposé (comptes créés par les Functions, mot de passe temporaire)", () => {
    expect(offending(/كلمة المرور الافتراضية|>\s*123\s*<|(password|Password)\s*[:=]\s*["']123["']/)).toEqual([]);
  });

  it("niveau de tajwīd : aucune option hors du modèle (« مبتدئ », constat F5)", () => {
    expect(offending(/<option value="مبتدئ"/)).toEqual([]);
    expect(readFileSync("src/types.ts", "utf8")).toContain('export type TajweedLevel = "ممتاز" | "متوسط" | "ضعيف";');
  });

  it("aucun <select> natif : liste déroulante de la charte (src/ui/Select.tsx, D83)", () => {
    expect(offending(/^\s*<select\b/m)).toEqual([]);
  });
});
