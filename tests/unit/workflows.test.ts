/**
 * Garde-fou statique des workflows GitHub Actions (revue du durcissement, D68).
 * Complète actionlint et zizmor (non installés dans la CI) par des règles
 * simples, vérifiées à chaque `npm test` :
 *  - toute action est épinglée par SHA de commit ;
 *  - aucune expression `${{ }}` dans un script `run:` (injection), tout passe par `env` ;
 *  - un job qui obtient un jeton OIDC (`id-token: write`) déclare un
 *    environnement GitHub, n'utilise pas de cache npm partagé et installe
 *    les paquets sans scripts (`npm ci --ignore-scripts`) ; sa version sans
 *    environnement (forfait Free, D75) reprend exactement ses permissions, ses
 *    variables et ses étapes (alias YAML) et ne s'exécute qu'en mode `prefixe` ;
 *  - D75 : une variable préfixée DEV_ / PROD_ n'est lue que sous la condition
 *    du préfixe correspondant (jamais celle de l'autre environnement) ;
 *  - les déploiements et aperçus ne se lancent qu'à la main ;
 *    jamais de `pull_request_target` ;
 *  - D77 : `seed-demo` / `remove-demo` d'ops.yml réservés au dev (garde-fou
 *    joué avec bash sur des variables factices) ;
 *  - D80 : `dev-super-admin` / `dev-super-admin-revoke` réservés au dev, entrée
 *    `username` validée par une expression régulière stricte, passée par env ;
 *  - D82 : `seed-school-fixtures` / `remove-school-fixtures` réservés au dev,
 *    entrée `school_id` stricte, `alfajr` refusée, passée par env.
 * Analyse ligne à ligne (pas de dépendance YAML) : suffisante pour ces fichiers.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

  it("D75 : chaque job à jeton OIDC a un jumeau sans environnement, identique par alias", () => {
    for (const f of ["deploy.yml", "deploy-lot0.yml", "ops.yml"]) {
      const all = jobs(read(f));
      expect([...all.keys()], f).toContain("configuration");
      // Le job de configuration ne reçoit aucun jeton OIDC et ne déclare pas d'environnement.
      expect(all.get("configuration")!.join("\n"), f).not.toMatch(/id-token|environment:/);
      const oidc = [...all].filter(([, b]) => /id-token:\s*write/.test(b.join("\n")));
      expect(oidc.length, f).toBe(1);
      const [name, body] = oidc[0];
      const src = body.join("\n");
      expect(src, f).toMatch(/^\s{4}if: needs\.configuration\.outputs\.mode == 'environnement'$/m);
      const anchor = (key: string) => src.match(new RegExp(`^\\s{4}${key}: &(\\w+)\\s*$`, "m"))?.[1];
      const [perm, env, steps] = ["permissions", "env", "steps"].map(anchor);
      expect([perm, env, steps], `${f} › ${name}`).not.toContain(undefined);
      const twins = [...all].filter(([n]) => n === `${name}-sans-environnement`);
      expect(twins.length, f).toBe(1);
      const twin = twins[0][1].join("\n");
      expect(twin, f).toMatch(/^\s{4}if: needs\.configuration\.outputs\.mode == 'prefixe'$/m);
      expect(twin, f).not.toMatch(/environment:/);
      expect(twin, f).toMatch(new RegExp(`^\\s{4}permissions: \\*${perm}$`, "m"));
      expect(twin, f).toMatch(new RegExp(`^\\s{4}env: \\*${env}$`, "m"));
      expect(twin, f).toMatch(new RegExp(`^\\s{4}steps: \\*${steps}$`, "m"));
      // Aucun autre contenu propre au jumeau (pas d'étape ni de variable ajoutée).
      expect(twin, f).not.toMatch(/^\s{6}\S/m);
    }
  });

  it("D75 : DEV_* ne sert jamais à la production, ni PROD_* au dev (sélection gardée, pas d'index calculé)", () => {
    for (const f of files) {
      const text = read(f);
      expect(text, f).not.toMatch(/vars\[/);
      for (const [name, body] of jobs(text)) {
        for (const l of body) {
          for (const m of l.matchAll(/vars\.(DEV|PROD)_[A-Z0-9_]+/g)) {
            const before = l.slice(0, m.index);
            // Lecture brute admise seulement pour détecter la configuration (jamais utilisée comme valeur).
            if (/^\s+(DEV|PROD)_PROJECT: \$\{\{ vars\.(DEV|PROD)_FIREBASE_PROJECT_ID \}\}$/.test(l)) continue;
            expect(before, `${f} › ${name} : ${l.trim()}`).toMatch(new RegExp(`(prefix|other_prefix) == '${m[1]}_' && $`));
          }
        }
      }
    }
  });

  it("D75 : préfixe déterminé par inputs.environment, jamais l'inverse", () => {
    for (const f of ["deploy.yml", "deploy-lot0.yml", "ops.yml"]) {
      const text = read(f);
      expect(text, f).toContain("dev) PREFIX=DEV_; OTHER=PROD_ ;;");
      expect(text, f).toContain("production) PREFIX=PROD_; OTHER=DEV_ ;;");
      expect(text, f).toContain(
        "environnement:dev::PROD_|environnement:production::DEV_|prefixe:dev:DEV_:PROD_|prefixe:production:PROD_:DEV_) ;;",
      );
    }
  });

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

  it("aperçu (D75) : arrêté avant tout job à environnement si le dépôt est configuré sans environnements", () => {
    const all = jobs(read("preview.yml"));
    expect(all.get("disponibilite")!.join("\n")).not.toMatch(/environment:|id-token/);
    expect(all.get("construire")!.join("\n")).toMatch(/^\s{4}needs: disponibilite$/m);
    expect(all.get("apercu")!.join("\n")).toMatch(/^\s{4}needs: construire$/m);
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

  describe("ops.yml (A-06, D86) : chiffrement des artefacts sans échec ouvert", () => {
    const lines = read("ops.yml").split("\n");
    const stepIndex = (name: string) => lines.findIndex((l) => l.trim() === `- name: ${name}`);
    /** Bloc YAML complet de l'étape nommée. */
    const stepBlock = (name: string) => {
      const i = stepIndex(name);
      const base = indent(lines[i]);
      const out = [lines[i]];
      for (const l of lines.slice(i + 1)) {
        if (l.trim() !== "" && indent(l) <= base) break;
        out.push(l);
      }
      return out.join("\n");
    };
    const CHECK = "Clé de chiffrement utilisable";
    const ENC = "Chiffrement des artefacts (clé publique du propriétaire)";

    it("la clé est importée et essayée avant toute opération", () => {
      const check = stepIndex(CHECK);
      expect(check).toBeGreaterThan(stepIndex("Garde-fous"));
      expect(check).toBeLessThan(lines.findIndex((l) => l.trim().startsWith("- name: Code (")));
      expect(check).toBeLessThan(lines.findIndex((l) => l.trim().startsWith("- name: ${{ inputs.action }} (script")));
      expect(stepBlock(CHECK)).toMatch(/--encrypt > \/dev\/null/);
    });

    it("aucun artefact n'est envoyé si le chiffrement échoue", () => {
      expect(stepBlock(ENC)).toMatch(/^\s+id: chiffrement$/m);
      for (const name of ["Rapport (données personnelles, 3 jours)", "Mots de passe temporaires (SECRET, 1 jour)"]) {
        expect(stepBlock(name)).toMatch(/steps\.chiffrement\.outcome == 'success'/);
      }
    });

    it("les fichiers en clair ne sont supprimés qu'après un chiffrement réussi", () => {
      const block = stepBlock(ENC);
      expect(block.indexOf("--encrypt")).toBeGreaterThan(0);
      expect(block.indexOf("--encrypt")).toBeLessThan(block.indexOf("-mindepth 1 -delete"));
    });

    it.skipIf(spawnSync("gpg", ["--version"]).status !== 0)("une clé illisible arrête le run sans rien transmettre (exécution réelle)", () => {
      const block = stepBlock(CHECK).split("\n");
      const j = block.findIndex((l) => /^\s+run: \|$/.test(l));
      const body = block.slice(j + 1);
      const pad = Math.min(...body.filter((l) => l.trim()).map(indent));
      const dir = mkdtempSync(join(tmpdir(), "cle-"));
      const script = join(dir, "cle.sh");
      writeFileSync(script, body.map((l) => l.slice(pad)).join("\n"));
      writeFileSync(join(dir, "env"), "");
      const r = spawnSync("bash", [script], {
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", RUNNER_TEMP: dir, GITHUB_ENV: join(dir, "env"), ARTIFACT_KEY: "cle-invalide" },
        encoding: "utf8",
      });
      expect(r.status).not.toBe(0);
      expect(readFileSync(join(dir, "env"), "utf8")).not.toContain("ARTIFACT_FPR");
    });

    // Linux seulement (comme la CI qui exécute ops.yml) : le gpg de Git pour Windows gère mal les chemins Windows.
    it.skipIf(process.platform === "win32" || spawnSync("gpg", ["--version"]).status !== 0)("une clé valide : vérifiée, puis rapport et secrets chiffrés sans fichier en clair (exécution réelle)", () => {
      const scriptOf = (name: string) => {
        const block = stepBlock(name).split("\n");
        const body = block.slice(block.findIndex((l) => /^\s+run: \|$/.test(l)) + 1);
        const pad = Math.min(...body.filter((l) => l.trim()).map(indent));
        return body.map((l) => l.slice(pad)).join("\n");
      };
      // Clé de test jetable, dans un trousseau à part.
      const keyDir = mkdtempSync(join(tmpdir(), "trousseau-"));
      const gpgEnv = { ...process.env, GNUPGHOME: keyDir };
      spawnSync("gpg", ["--batch", "--pinentry-mode", "loopback", "--passphrase", "", "--quick-gen-key", "test-ops <test@example.invalid>", "default", "default", "1d"], { env: gpgEnv });
      const publicKey = spawnSync("gpg", ["--batch", "--armor", "--export", "test@example.invalid"], { env: gpgEnv, encoding: "utf8" }).stdout;
      expect(publicKey).toContain("BEGIN PGP PUBLIC KEY BLOCK");

      const dir = mkdtempSync(join(tmpdir(), "chiffrement-"));
      const reports = join(dir, "rapports");
      const secrets = join(dir, "secret");
      for (const d of [reports, secrets]) mkdirSync(d);
      writeFileSync(join(reports, "comptes.csv"), "nom\nfictif\n");
      writeFileSync(join(secrets, "mots-de-passe-temporaires-1.csv"), "compte,mdp\nfictif,xxxx\n");
      writeFileSync(join(dir, "env"), "");
      const base = { PATH: process.env.PATH ?? "/usr/bin:/bin", RUNNER_TEMP: dir, GITHUB_ENV: join(dir, "env"), ARTIFACT_KEY: publicKey };
      writeFileSync(join(dir, "cle.sh"), scriptOf(CHECK));
      const check = spawnSync("bash", [join(dir, "cle.sh")], { env: base, encoding: "utf8" });
      expect(check.status, check.stderr).toBe(0);
      const fpr = /ARTIFACT_FPR=(\S+)/.exec(readFileSync(join(dir, "env"), "utf8"))?.[1];
      expect(fpr).toBeTruthy();

      writeFileSync(join(dir, "chiffrement.sh"), scriptOf(ENC));
      const enc = spawnSync("bash", [join(dir, "chiffrement.sh")], { env: { ...base, ARTIFACT_FPR: fpr!, REPORTS: reports, SECRETS_DIR: secrets }, encoding: "utf8" });
      expect(enc.status, enc.stderr).toBe(0);
      expect(readdirSync(reports)).toEqual(["contenu.tar.gz.gpg"]);
      expect(readdirSync(secrets)).toEqual(["contenu.tar.gz.gpg"]);
    });
  });

  describe("ops.yml (D77) : école de démonstration réservée au dev", () => {
    const text = read("ops.yml");
    /** Script `run:` de l'étape nommée, désindenté. */
    const stepScript = (name: string) => {
      const lines = text.split("\n");
      const i = lines.findIndex((l) => l.trim() === `- name: ${name}`);
      const j = lines.findIndex((l, k) => k > i && /^\s+run: \|$/.test(l));
      const base = indent(lines[j]);
      const body: string[] = [];
      for (const l of lines.slice(j + 1)) {
        if (l.trim() !== "" && indent(l) <= base) break;
        body.push(l);
      }
      const pad = Math.min(...body.filter((l) => l.trim()).map(indent));
      return body.map((l) => l.slice(pad)).join("\n");
    };
    const garde = stepScript("Garde-fous");
    const DEV = "fajr-c4c6e";
    const PROD = "gen-lang-client-0481880143";
    const run = (vars: Record<string, string>) => {
      const dir = mkdtempSync(join(tmpdir(), "garde-"));
      const script = join(dir, "garde.sh");
      writeFileSync(script, garde);
      for (const f of ["out", "env"]) writeFileSync(join(dir, f), "");
      const production = vars.ENVIRONMENT === "production";
      const project = production ? PROD : DEV;
      const env = {
        PATH: process.env.PATH ?? "/usr/bin:/bin",
        RUNNER_TEMP: dir, GITHUB_OUTPUT: join(dir, "out"), GITHUB_ENV: join(dir, "env"),
        PROD_PROJECT_ID: PROD, PROD_BACKUP_BUCKET: `${PROD}-sauvegardes`,
        ENVIRONMENT: "dev", ACTION: "seed-demo", APPLY: "true", ROTATE: "none", CONFIG_MODE: "prefixe",
        VAR_PREFIX: production ? "PROD_" : "DEV_", OTHER_PREFIX: production ? "DEV_" : "PROD_",
        PROJECT_ID: project, DATABASE_ID: "base-nommee", BACKUP_BUCKET: `${project}-sauvegardes`,
        WIF_PROVIDER: `projects/1/locations/global/workloadIdentityPools/github/providers/${project}`,
        OPS_SA: `github-ops@${project}.iam.gserviceaccount.com`,
        ARTIFACT_KEY: "cle-publique-factice", SUPER_ADMIN_USERNAME: "",
        OTHER_PROJECT_ID: "", OTHER_WIF_PROVIDER: "", OTHER_OPS_SA: "", OTHER_BACKUP_BUCKET: "",
        CONFIRM: project, IMPORT_SOURCE: "", USERNAME_INPUT: "", SCHOOL_ID_INPUT: "", SIZE_INPUT: "large", REF: "refs/heads/main",
        ...vars,
      };
      const r = spawnSync("bash", [script], { env, encoding: "utf8" });
      return { code: r.status, out: r.stdout + r.stderr, outputs: readFileSync(join(dir, "out"), "utf8") };
    };

    it("choix d'action : seed-demo et remove-demo", () => {
      expect(text).toMatch(/options: \[describe-db, export-firestore, import-firestore, lot0-provision, migrate-to-tenants, verify-counts, seed-demo, remove-demo, dev-super-admin, dev-super-admin-revoke, seed-school-fixtures, remove-school-fixtures\]/);
    });

    it("dev, apply=true, confirm = projet de dev, clé publique : accepté, code de main", () => {
      for (const action of ["seed-demo", "remove-demo"]) {
        const r = run({ ACTION: action });
        expect(r.code, r.out).toBe(0);
        expect(r.outputs).toContain("code_ref=main");
      }
      expect(run({ ACTION: "remove-demo", ARTIFACT_KEY: "" }).code).toBe(0);
    });

    it("refusé en production (même confirmé, depuis main), sans apply, sans confirmation exacte, sans clé publique", () => {
      for (const action of ["seed-demo", "remove-demo"]) {
        const prod = run({ ENVIRONMENT: "production", ACTION: action });
        expect(prod.code).toBe(1);
        expect(prod.out).toMatch(/refusé en production/);
        expect(run({ ACTION: action, APPLY: "false" }).out).toMatch(/exige apply=true/);
        expect(run({ ACTION: action, CONFIRM: "" }).out).toMatch(/Confirmation incorrecte/);
        expect(run({ ACTION: action, CONFIRM: PROD }).code).toBe(1);
        expect(run({ ACTION: action, ROTATE: "all" }).out).toMatch(/rotate_passwords ne concerne/);
      }
      const noKey = run({ ACTION: "seed-demo", ARTIFACT_KEY: "" });
      expect(noKey.code).toBe(1);
      expect(noKey.out).toMatch(/seed-demo exige la variable DEV_ARTIFACT_GPG_PUBLIC_KEY/);
      // Un dev mal configuré qui viserait la prod.
      const croise = run({ PROJECT_ID: PROD, CONFIRM: PROD, OPS_SA: `github-ops@${PROD}.iam.gserviceaccount.com`, BACKUP_BUCKET: "autre-bucket" });
      expect(croise.code).toBe(1);
      expect(croise.out).toMatch(/pointe vers la prod/);
    });

    it("les autres actions ne changent pas (contrôle du garde-fou joué)", () => {
      expect(run({ ENVIRONMENT: "production", ACTION: "describe-db", APPLY: "false", CONFIRM: "" }).code).toBe(0);
      expect(run({ ACTION: "verify-counts", APPLY: "false", CONFIRM: "" }).code).toBe(0);
      expect(run({ ACTION: "verify-counts", APPLY: "true" }).out).toMatch(/apply=true n'a pas de sens/);
    });

    it("script : seed-demo.ts revalidé hors dev ; mots de passe vers l'artefact chiffré d'un jour ; import refusé si schools/demo existe", () => {
      const script = stepScript("${{ inputs.action }} (script Admin SDK, journal en artefact)");
      expect(script).toContain("SCRIPT=scripts/dev/seed-demo.ts");
      expect(script).toMatch(/if \[ "\$\{ENVIRONMENT\}" != "dev" \] \|\| \[ "\$\{PROJECT_ID\}" = "\$\{PROD_PROJECT_ID\}" \]; then echo "::error::\$\{ACTION\} refusé hors dev."; exit 1; fi/);
      expect(script).toContain("-path '*/seed-demo-*/resume.json'");
      expect(script).toContain("-name 'mots-de-passe-temporaires.csv'");
      expect(text).toMatch(/if: inputs\.action == 'lot0-provision' \|\| inputs\.action == 'migrate-to-tenants' \|\| inputs\.action == 'seed-demo' \|\| inputs\.action == 'remove-demo' \|\| inputs\.action == 'dev-super-admin' \|\| inputs\.action == 'dev-super-admin-revoke' \|\| inputs\.action == 'seed-school-fixtures' \|\| inputs\.action == 'remove-school-fixtures'\n/);
      const secret = text.slice(text.indexOf("- name: Mots de passe temporaires (SECRET, 1 jour)"));
      expect(secret).toMatch(/^\s+retention-days: 1$/m);
      const imp = stepScript("import-firestore (dev seulement)");
      expect(imp).toContain("documents/schools/demo");
      expect(imp.indexOf("documents/schools/demo")).toBeLessThan(imp.indexOf("gcloud firestore import"));
    });

    describe("D80 : super-admin du dev (dev-super-admin, dev-super-admin-revoke)", () => {
      const USER = "superadmin_demo";
      const ACTIONS = ["dev-super-admin", "dev-super-admin-revoke"];

      it("dev, apply=true, confirm = projet de dev, identifiant valide, clé publique : accepté, code de main", () => {
        for (const action of ACTIONS) {
          const r = run({ ACTION: action, USERNAME_INPUT: USER });
          expect(r.code, r.out).toBe(0);
          expect(r.outputs).toContain("code_ref=main");
        }
        for (const ok of ["ab", "superadmin.demo", "a-b_c.d", "9" + "x".repeat(39)]) {
          expect(run({ ACTION: "dev-super-admin", USERNAME_INPUT: ok }).code, ok).toBe(0);
        }
        // Le retrait ne produit aucun mot de passe : la clé publique n'est pas exigée.
        expect(run({ ACTION: "dev-super-admin-revoke", USERNAME_INPUT: USER, ARTIFACT_KEY: "" }).code).toBe(0);
      });

      it("refusé en production (même confirmé, depuis main), sans apply, sans confirmation exacte", () => {
        for (const action of ACTIONS) {
          const prod = run({ ENVIRONMENT: "production", ACTION: action, USERNAME_INPUT: USER });
          expect(prod.code).toBe(1);
          expect(prod.out).toMatch(/refusé en production/);
          const noApply = run({ ACTION: action, USERNAME_INPUT: USER, APPLY: "false" });
          expect(noApply.code).toBe(1);
          expect(noApply.out).toMatch(/exige apply=true/);
          const noConfirm = run({ ACTION: action, USERNAME_INPUT: USER, CONFIRM: "" });
          expect(noConfirm.code).toBe(1);
          expect(noConfirm.out).toMatch(/Confirmation incorrecte/);
          expect(run({ ACTION: action, USERNAME_INPUT: USER, CONFIRM: PROD }).code).toBe(1);
          expect(run({ ACTION: action, USERNAME_INPUT: USER, ROTATE: "all" }).out).toMatch(/rotate_passwords ne concerne/);
        }
        // Un dev mal configuré qui viserait la prod.
        const croise = run({ ACTION: "dev-super-admin", USERNAME_INPUT: USER, PROJECT_ID: PROD, CONFIRM: PROD, OPS_SA: `github-ops@${PROD}.iam.gserviceaccount.com`, BACKUP_BUCKET: "autre-bucket" });
        expect(croise.code).toBe(1);
        expect(croise.out).toMatch(/pointe vers la prod/);
      });

      it("identifiant invalide ou absent refusé, sans jamais être affiché ni exécuté", () => {
        const bad = ["", "a", "-x", "_x", "Superadmin", "super admin", "x".repeat(41), "a;id", "$(id)", "a`id`", "::error::x", "a\nb", "ab/../c", "é_demo"];
        for (const action of ACTIONS) {
          for (const u of bad) {
            const r = run({ ACTION: action, USERNAME_INPUT: u });
            expect(r.code, JSON.stringify(u)).toBe(1);
            expect(r.out, JSON.stringify(u)).toMatch(/username invalide/);
            if (u.length > 2) expect(r.out).not.toContain(u);
          }
        }
        // L'entrée ne sert à aucune autre action.
        expect(run({ ACTION: "seed-demo", USERNAME_INPUT: USER }).out).toMatch(/username ne concerne que/);
        expect(run({ ACTION: "describe-db", APPLY: "false", CONFIRM: "", USERNAME_INPUT: USER }).code).toBe(1);
      });

      it("clé publique absente : dev-super-admin refusé (le mot de passe ne part que chiffré)", () => {
        const noKey = run({ ACTION: "dev-super-admin", USERNAME_INPUT: USER, ARTIFACT_KEY: "" });
        expect(noKey.code).toBe(1);
        expect(noKey.out).toMatch(/dev-super-admin exige la variable DEV_ARTIFACT_GPG_PUBLIC_KEY/);
      });

      it("script : revalidé hors dev, identifiant par env, résumé en liste blanche, mot de passe vers l'artefact chiffré d'un jour", () => {
        const script = stepScript("${{ inputs.action }} (script Admin SDK, journal en artefact)");
        expect(script).toContain("SCRIPT=scripts/admin/dev-super-admin.ts");
        expect(script).toContain('ARGS+=(--username="${USERNAME_INPUT}")');
        expect(script).toContain('[ "${ACTION}" = "dev-super-admin-revoke" ] && ARGS+=(--revoke)');
        const branch = script.slice(script.indexOf('elif [ "${ACTION}" = "dev-super-admin" ]'), script.indexOf("SCRIPT=scripts/admin/dev-super-admin.ts"));
        expect(branch).toMatch(/if \[ "\$\{ENVIRONMENT\}" != "dev" \] \|\| \[ "\$\{PROJECT_ID\}" = "\$\{PROD_PROJECT_ID\}" \]; then echo "::error::\$\{ACTION\} refusé hors dev."; exit 1; fi/);
        expect(branch).toContain('[[ "${USERNAME_INPUT}" =~ ^[a-z0-9][a-z0-9._-]{1,39}$ ]]');
        expect(script).toContain("-path '*/dev-super-admin-*/resume.json'");
        const filter = script.match(/FILTER='(\{mode, operation, username[^']*\})'/)?.[1];
        expect(filter).toBe("{mode, operation, username, accountFound, created, reset, superAdmin, schoolMemberships, disabled, sessionsRevoked, passwordsFile}");
        expect(filter).not.toMatch(/password[^s]|reportDir/i);
        // L'entrée n'arrive dans les scripts que par env.
        expect(text).toMatch(/^\s+USERNAME_INPUT: \$\{\{ inputs\.username \}\}$/m);
        expect(runScripts(text).some((r) => r.content.includes("inputs.username"))).toBe(false);
      });
    });

    describe("D82 : données fictives dans une école de test (seed-school-fixtures, remove-school-fixtures)", () => {
      const SCHOOL = "test1234";
      const ACTIONS = ["seed-school-fixtures", "remove-school-fixtures"];

      it("dev, apply=true, confirm = projet de dev, école valide, clé publique : accepté, code de main", () => {
        for (const action of ACTIONS) {
          const r = run({ ACTION: action, SCHOOL_ID_INPUT: SCHOOL });
          expect(r.code, r.out).toBe(0);
          expect(r.outputs).toContain("code_ref=main");
        }
        expect(run({ ACTION: "seed-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, SIZE_INPUT: "small" }).code).toBe(0);
        for (const ok of ["abc", "ecole-test-2", "a".repeat(40), "123"]) {
          expect(run({ ACTION: "seed-school-fixtures", SCHOOL_ID_INPUT: ok }).code, ok).toBe(0);
        }
        // Le retrait ne produit aucun mot de passe : la clé publique n'est pas exigée.
        expect(run({ ACTION: "remove-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, ARTIFACT_KEY: "" }).code).toBe(0);
      });

      it("refusé en production (même confirmé, depuis main), sans apply, sans confirmation exacte", () => {
        for (const action of ACTIONS) {
          const prod = run({ ENVIRONMENT: "production", ACTION: action, SCHOOL_ID_INPUT: SCHOOL });
          expect(prod.code).toBe(1);
          expect(prod.out).toMatch(/refusé en production/);
          const noApply = run({ ACTION: action, SCHOOL_ID_INPUT: SCHOOL, APPLY: "false" });
          expect(noApply.code).toBe(1);
          expect(noApply.out).toMatch(/exige apply=true/);
          const noConfirm = run({ ACTION: action, SCHOOL_ID_INPUT: SCHOOL, CONFIRM: "" });
          expect(noConfirm.code).toBe(1);
          expect(noConfirm.out).toMatch(/Confirmation incorrecte/);
          expect(run({ ACTION: action, SCHOOL_ID_INPUT: SCHOOL, CONFIRM: PROD }).code).toBe(1);
          expect(run({ ACTION: action, SCHOOL_ID_INPUT: SCHOOL, ROTATE: "all" }).out).toMatch(/rotate_passwords ne concerne/);
        }
        const croise = run({ ACTION: "seed-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, PROJECT_ID: PROD, CONFIRM: PROD, OPS_SA: `github-ops@${PROD}.iam.gserviceaccount.com`, BACKUP_BUCKET: "autre-bucket" });
        expect(croise.code).toBe(1);
        expect(croise.out).toMatch(/pointe vers la prod/);
      });

      it("école alfajr refusée explicitement, identifiant invalide ou absent refusé sans être affiché", () => {
        for (const action of ACTIONS) {
          const alfajr = run({ ACTION: action, SCHOOL_ID_INPUT: "alfajr" });
          expect(alfajr.code).toBe(1);
          expect(alfajr.out).toMatch(/school_id=alfajr refusé/);
          const bad = ["", "ab", "Alfajr", "ALFAJR", "alfajr ", " alfajr", "test_1234", "a".repeat(41), "a;id", "$(id)", "a`id`", "::error::x", "a\nb", "../alfajr", "école"];
          for (const u of bad) {
            const r = run({ ACTION: action, SCHOOL_ID_INPUT: u });
            expect(r.code, JSON.stringify(u)).toBe(1);
            expect(r.out, JSON.stringify(u)).toMatch(/school_id invalide/);
            if (u.length > 3) expect(r.out).not.toContain(u);
          }
        }
        // L'entrée ne sert à aucune autre action ; size seulement au seed.
        expect(run({ ACTION: "seed-demo", SCHOOL_ID_INPUT: SCHOOL }).out).toMatch(/school_id ne concerne que/);
        expect(run({ ACTION: "describe-db", APPLY: "false", CONFIRM: "", SCHOOL_ID_INPUT: SCHOOL }).code).toBe(1);
        expect(run({ ACTION: "remove-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, SIZE_INPUT: "small" }).out).toMatch(/size ne concerne que/);
        expect(run({ ACTION: "seed-demo", SIZE_INPUT: "small" }).out).toMatch(/size ne concerne que/);
        expect(run({ ACTION: "seed-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, SIZE_INPUT: "huge" }).out).toMatch(/size inconnu/);
      });

      it("clé publique absente : seed-school-fixtures refusé (mots de passe chiffrés seulement)", () => {
        const noKey = run({ ACTION: "seed-school-fixtures", SCHOOL_ID_INPUT: SCHOOL, ARTIFACT_KEY: "" });
        expect(noKey.code).toBe(1);
        expect(noKey.out).toMatch(/seed-school-fixtures exige la variable DEV_ARTIFACT_GPG_PUBLIC_KEY/);
      });

      it("script : revalidé hors dev et pour alfajr, entrées par env, résumé en liste blanche, mots de passe vers l'artefact chiffré", () => {
        const script = stepScript("${{ inputs.action }} (script Admin SDK, journal en artefact)");
        const start = script.indexOf('elif [ "${ACTION}" = "seed-school-fixtures" ]');
        const branch = script.slice(start, script.indexOf("elif", start + 10));
        expect(branch).toMatch(/if \[ "\$\{ENVIRONMENT\}" != "dev" \] \|\| \[ "\$\{PROJECT_ID\}" = "\$\{PROD_PROJECT_ID\}" \]; then echo "::error::\$\{ACTION\} refusé hors dev."; exit 1; fi/);
        expect(branch).toContain('[[ "${SCHOOL_ID_INPUT}" =~ ^[a-z0-9-]{3,40}$ ]]');
        expect(branch).toContain('[ "${SCHOOL_ID_INPUT}" != "alfajr" ]');
        expect(branch).toContain("SCRIPT=scripts/dev/seed-school-fixtures.ts");
        expect(branch).toContain('ARGS+=(--school="${SCHOOL_ID_INPUT}")');
        expect(branch).toContain('ARGS+=(--remove); else ARGS+=(--size="${SIZE_INPUT}")');
        expect(script).toContain("-path '*/seed-school-fixtures-*/resume.json'");
        const filter = script.match(/FILTER='(\{mode, operation, schoolId, size[^']*\})'/)?.[1];
        expect(filter).toBeDefined();
        expect(filter).not.toMatch(/password[^s]|reportDir|credentials/i);
        expect(script).toMatch(/seed-school-fixtures\)\\\] \(ÉCHEC/);
        for (const input of ["school_id", "size"]) {
          expect(runScripts(text).some((r) => r.content.includes(`inputs.${input}`)), input).toBe(false);
        }
        expect(text.match(/^\s+SCHOOL_ID_INPUT: \$\{\{ inputs\.school_id \}\}$/gm)).toHaveLength(2);
        // Jamais confondue avec l'école migrée (SCHOOL_ID = alfajr, migrate-to-tenants).
        expect(branch).not.toMatch(/\$\{SCHOOL_ID\}/);
      });
    });
  });
});


describe("paramètres des Functions fournis au déploiement", () => {
  // En mode non interactif, `firebase deploy` échoue si un paramètre n'a pas de
  // valeur, même quand il a un défaut dans le code.
  const SRC = "functions/src";
  const params = [
    ...new Set(
      readdirSync(SRC, { recursive: true })
        .map(String)
        .filter((f) => f.endsWith(".ts"))
        .flatMap((f) => [...readFileSync(join(SRC, f), "utf8").matchAll(/define(?:String|Boolean|Int)\("([A-Z_]+)"/g)].map((m) => m[1])),
    ),
  ];

  it("trouve les paramètres", () => {
    expect(params.length).toBeGreaterThan(0);
  });

  it("le fichier versionné de la prod les définit tous", () => {
    const env = readFileSync("functions/.env.gen-lang-client-0481880143", "utf8");
    for (const p of params) expect(env, p).toMatch(new RegExp(`^${p}=`, "m"));
  });

  it("deploy.yml les écrit tous pour le dev", () => {
    const dev = runScripts(read("deploy.yml")).map((l) => l.content).join("\n");
    for (const p of params) expect(dev, p).toMatch(new RegExp(`\\b${p}=`));
  });
});
