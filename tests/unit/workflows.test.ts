/**
 * Garde-fou statique des workflows GitHub Actions (revue du durcissement, D68).
 * Complète actionlint et zizmor (non installés dans la CI) par des règles
 * simples, vérifiées à chaque `npm test` :
 *  - toute action est épinglée par SHA de commit ;
 *  - aucune expression `${{ }}` dans un script `run:` (injection), tout passe par `env` ;
 *  - un job qui obtient un jeton OIDC (`id-token: write`) déclare un
 *    environnement GitHub, n'utilise pas de cache npm partagé et installe
 *    les paquets sans scripts (`npm ci --ignore-scripts`) ;
 *  - les déploiements et aperçus ne se lancent qu'à la main ;
 *    jamais de `pull_request_target`.
 * Analyse ligne à ligne (pas de dépendance YAML) : suffisante pour ces fichiers.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = ".github/workflows";
const files = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f));
const read = (f: string) => readFileSync(join(DIR, f), "utf8");
const indent = (l: string) => l.length - l.trimStart().length;

/** Lignes des scripts `run:` (une ligne, ou bloc `|` indenté). */
function runScripts(text: string): { line: number; content: string }[] {
  const lines = text.split("\n");
  const out: { line: number; content: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:- )?run:\s*(.*)$/);
    if (!m) continue;
    const base = indent(lines[i]);
    if (m[2] && !/^[|>]-?$/.test(m[2].trim())) {
      out.push({ line: i + 1, content: m[2] });
      continue;
    }
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() !== "" && indent(lines[j]) <= base) break;
      out.push({ line: j + 1, content: lines[j] });
    }
  }
  return out;
}

/** Découpe la section `jobs:` en jobs (nom → lignes). */
function jobs(text: string): Map<string, string[]> {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  const map = new Map<string, string[]>();
  let cur: string | null = null;
  for (const l of lines.slice(start + 1)) {
    const m = l.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (m) { cur = m[1]; map.set(cur, []); continue; }
    if (cur) map.get(cur)!.push(l);
  }
  return map;
}

describe("workflows GitHub Actions (D68)", () => {
  it("trouve les workflows", () => {
    expect(files).toEqual(expect.arrayContaining(["ci.yml", "deploy.yml", "preview.yml"]));
  });

  for (const f of files) {
    const text = read(f);

    it(`${f} : actions épinglées par SHA de commit`, () => {
      const uses = text.split("\n").filter((l) => /^\s*(- )?uses:/.test(l));
      expect(uses.length).toBeGreaterThan(0);
      for (const u of uses) expect(u, u).toMatch(/uses:\s*[\w.-]+\/[\w./-]+@[0-9a-f]{40}(\s|$)/);
    });

    it(`${f} : aucune expression \${{ }} dans un script run:`, () => {
      const bad = runScripts(text).filter((r) => r.content.includes("${{"));
      expect(bad.map((b) => `${f}:${b.line} ${b.content.trim()}`)).toEqual([]);
    });

    it(`${f} : jamais pull_request_target ; permissions par défaut en lecture`, () => {
      expect(text).not.toMatch(/pull_request_target/);
      expect(text).toMatch(/^permissions:\s*\n\s+contents: read\s*$/m);
    });

    it(`${f} : un job à jeton OIDC a un environnement, sans cache npm ni scripts d'installation`, () => {
      for (const [name, body] of jobs(text)) {
        const src = body.join("\n");
        if (!/id-token:\s*write/.test(src)) continue;
        expect(src, `${f} › ${name}`).toMatch(/^\s{4}environment:\s*\S+/m);
        expect(src, `${f} › ${name}`).not.toMatch(/cache:\s*npm/);
        const installs = body.filter((l) => /npm ci\b/.test(l));
        for (const l of installs) expect(l, `${f} › ${name}`).toContain("--ignore-scripts");
      }
    });
  }

  it("déploiement et aperçu : déclenchement manuel uniquement", () => {
    for (const f of ["deploy.yml", "preview.yml"]) {
      const on = read(f).split("\n");
      const i = on.findIndex((l) => /^on:\s*$/.test(l));
      const triggers = on.slice(i + 1).filter((l) => /^ {2}[a-z_]+:/.test(l)).slice(0, 5);
      expect(triggers[0], f).toMatch(/^ {2}workflow_dispatch:/);
      expect(read(f), f).not.toMatch(/^ {2}(push|pull_request|schedule|workflow_run|repository_dispatch):/m);
    }
  });

  it("aperçu : environnement preview (compte Hosting seulement), jamais dev ni production", () => {
    const text = read("preview.yml");
    expect(text).toMatch(/environment: preview/);
    expect(text).not.toMatch(/environment: (dev|production)\b/);
  });

  it("ops.yml (D74) : artefacts chiffrés avant envoi ; remplacement de mots de passe refusé sans clé publique", () => {
    if (!files.includes("ops.yml")) return;
    const text = read("ops.yml");
    const enc = text.indexOf("Chiffrement des artefacts");
    const uploads = [...text.matchAll(/uses: actions\/upload-artifact@/g)].map((m) => m.index!);
    expect(enc).toBeGreaterThan(0);
    for (const u of uploads) expect(u).toBeGreaterThan(enc);
    expect(text).toMatch(/ARTIFACT_GPG_PUBLIC_KEY/);
    expect(text).toMatch(/\[ "\$\{ROTATE\}" != "none" \] && \[ -z "\$\{ARTIFACT_KEY\}" \]/);
  });
});
