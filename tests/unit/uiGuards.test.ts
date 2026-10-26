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

  it("aucune fenêtre écrite à la main : `fixed inset-0` seulement dans Modal et dans le tiroir du menu (D98)", () => {
    const allowed = ["src/ui/Modal.tsx", "src/ui/AppShell.tsx"];
    const hits = offending(/fixed inset-0/).filter((f) => !allowed.includes(f.split("\\").join("/")));
    expect(hits).toEqual([]);
  });

  it("aucun alert() ni confirm() natif dans src/ : Toast et ConfirmDialog de la charte (D99)", () => {
    // `confirm` est aussi le nom de la fonction de useConfirm() : seuls l'appel nu (sans `await`) et window.confirm / window.alert sont natifs.
    const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const native = /(?<![\w.$])alert\(|(?<!await )(?<![\w.$])confirm\(|\bwindow\.(alert|confirm)\(|\bglobalThis\.(alert|confirm)\(/;
    // Le garde-fou lui-même : détecte les appels natifs, laisse passer ceux de la charte, les commentaires et les noms voisins.
    for (const bad of ["alert('x')", "if (confirm(`x`)) {}", "if (!confirm('x')) return;", "window.confirm('x')", "window.alert(msg)"]) expect(native.test(code(bad)), bad).toBe(true);
    for (const ok of ["if (await confirm({ message: 'x' })) {}", "toast.error(msg)", "// alert('x')", "/* confirm('x') */", "const confirmRestore = 1;", "ActionAlert(", "swal.alert('x')"]) expect(native.test(code(ok)), ok).toBe(false);
    const hits = all.filter(([, src]) => native.test(code(src))).map(([f]) => f);
    expect(hits).toEqual([]);
  });

  it("aucun toLocaleString() sans argument : montants par src/utils/format.ts, locale explicite sinon (UI-10)", () => {
    // WeeklyAttendance.tsx : modifié par une autre branche (UI-20), exception le temps de la fusion.
    const allowed = ["src/screens/dashboard/WeeklyAttendance.tsx"];
    const bare = offending(/\.toLocaleString\(\s*\)/).filter((f) => !allowed.includes(f.split("\\").join("/")));
    expect(bare).toEqual([]);
  });

  it("aucun montant écrit « درهم » dans les écrans de paiements, comptabilité, activités et personnel : devise « د.م » via formatMoney", () => {
    const dirs = ["src/screens/PaymentsScreen.tsx", "src/components/finance/", "src/components/activities/", "src/components/staff/", "src/components/FinanceManagement.tsx"];
    const hits = all.filter(([f]) => dirs.some((d) => f.split("\\").join("/").startsWith(d))).filter(([, src]) => /\d\s*درهم|\}\s*درهم/.test(src));
    expect(hits.map(([f]) => f)).toEqual([]);
  });
});
