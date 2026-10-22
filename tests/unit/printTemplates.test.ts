/**
 * Revue de sécurité, constat C-01 : XSS stockée dans les fenêtres d'impression.
 * Les fenêtres `window.open("")` partagent l'origine de l'application : toute
 * donnée insérée dans leur HTML doit être échappée. Ce test vérifie la
 * fonction d'échappement et interdit toute interpolation brute dans les
 * gabarits d'impression (garde-fou contre une régression).
 * La démonstration de bout en bout est dans tests/e2e/smoke.spec.ts (C-01).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { escapeHtml } from "../../src/security/html";

// Valeurs déjà sûres : HTML produit par React (innerHTML), lignes déjà échappées,
// constantes du code.
const ALLOWED = new Set(["tableRows", "printContent.innerHTML", "reportElement.innerHTML", "printContent", "tailwindCdn", "labScale", "sideSuffix"]);
// Tous les fichiers sources : le garde-fou suit les gabarits si App.tsx est découpé.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
// Gabarits : `document.write(` + littéral, lignes de tableaux (`tableRows`), et
// fonctions de src/print qui renvoient le HTML d'une impression (`return \``).
const isPrintModule = (f: string) => /[\\/]print[\\/]/.test(f);
const FILES = sourceFiles("src").filter((f) => {
  const src = readFileSync(f, "utf8");
  return src.includes("document.write(") || /const tableRows = .*\.map\(/.test(src) || (isPrintModule(f) && /^\s*return `/m.test(src));
});

function printBlocks(source: string, file = ""): string[][] {
  const lines = source.split("\n");
  const blocks: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const isWrite = lines[i].includes("document.write(`");
    const isRows = /const tableRows = .*\.map\(/.test(lines[i]);
    const isReturn = isPrintModule(file) && /^\s*return `/.test(lines[i]);
    if (!isWrite && !isRows && !isReturn) continue;
    const end = isWrite ? /^\s*`\);\s*$/ : isReturn ? /^\s*`;\s*$/ : /^\s*\}\)\.join\(""\);\s*$/;
    let j = i;
    while (j < lines.length && !end.test(lines[j])) j++;
    blocks.push(lines.slice(i, j + 1));
    i = j;
  }
  return blocks;
}

describe("échappement HTML des impressions", () => {
  it("neutralise balises, attributs et entités", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(escapeHtml(`</title><script>x</script>`)).not.toContain("<");
    expect(escapeHtml("a & b ' `")).toBe("a &amp; b &#39; &#96;");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml("محمد العلمي")).toBe("محمد العلمي");
  });

  it("des gabarits d'impression sont bien trouvés et inspectés", () => {
    expect(FILES.length).toBeGreaterThan(0);
    // Après le découpage d'App.tsx (Lot 2), les gabarits vivent dans src/print.
    expect(FILES.filter(isPrintModule).length).toBeGreaterThanOrEqual(6);
    // Chaque gabarit (littéral HTML) est bien découpé en blocs inspectés.
    for (const f of FILES.filter((x) => /document\.write\(`|^\s*return `/m.test(readFileSync(x, "utf8")))) {
      expect(printBlocks(readFileSync(f, "utf8"), f).length, f).toBeGreaterThan(0);
    }
  });

  for (const file of FILES) {
    it(`${file} : aucune donnée insérée sans échappement dans un gabarit d'impression`, () => {
      const blocks = printBlocks(readFileSync(file, "utf8"), file);
      const raw: string[] = [];
      for (const block of blocks) {
        for (const line of block) {
          for (const m of line.matchAll(/\$\{([^{}`]*)\}/g)) {
            const expr = m[1].trim();
            if (!ALLOWED.has(expr) && !expr.startsWith("escapeHtml(")) raw.push(expr);
          }
        }
      }
      expect(raw).toEqual([]);
    });
  }
});
