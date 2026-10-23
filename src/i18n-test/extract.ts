/**
 * Extraction des chaînes arabes de l'interface (outil Node, jamais importé par
 * l'application) : littéraux, gabarits `${…}` et texte JSX de `src/`.
 * Sert au calcul de couverture du dictionnaire de test FR (D79).
 *
 * Exclus : les gabarits d'impression (`src/print/`, fenêtre séparée, hors
 * périmètre, sauf `src/print/cards` affiché dans l'atelier des cartes), ce module lui-même, et les chaînes qui ne s'affichent jamais
 * (clés de stockage, sélecteurs, commentaires).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
// Normalisation commune à l'extraction et à l'exécution.
import { ARABIC, normalize } from "./translate";

export { ARABIC, normalize };

export interface ExtractedString {
  /** Texte normalisé ; les expressions d'un gabarit deviennent {0}, {1}… */
  text: string;
  /** `template` : chaîne à variables, à couvrir par un motif. */
  kind: "static" | "template";
  file: string;
  line: number;
}

const EXCLUDED_DIRS = ["src/print", "src/i18n-test"];
/** Composants React affichés DANS l'application (atelier des cartes), malgré leur dossier. */
const INCLUDED_DIRS = ["src/print/cards"];

function listFiles(dir: string, root: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full).replace(/\\/g, "/");
    const under = (d: string) => rel === d || rel.startsWith(d + "/") || d.startsWith(rel + "/");
    if (EXCLUDED_DIRS.some(under) && !INCLUDED_DIRS.some(under)) continue;
    if (statSync(full).isDirectory()) listFiles(full, root, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(full);
  }
  return out;
}

/** Fichiers sans chaîne affichée (table de translittération des identifiants). */
const NON_DISPLAY_FILES = ["src/utils/usernames.ts"];

/**
 * Chaînes jamais affichées : console, stockage, sélecteurs, imports, clés
 * d'objet et recherches de sous-chaîne (`.includes(…)`, `.startsWith(…)`).
 * Les valeurs stockées (rôles, statuts, types littéraux) restent extraites :
 * leur LIBELLÉ affiché doit être traduit, la valeur elle-même ne change pas.
 */
function isNonDisplayContext(node: ts.Node): boolean {
  const parent = node.parent;
  if (parent) {
    if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === node) return true;
    if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return true;
    if (ts.isCallExpression(parent) && parent.arguments[0] === node && ts.isPropertyAccessExpression(parent.expression)
      && /^(includes|startsWith|endsWith|indexOf|has|replace|replaceAll|split|match|test)$/.test(parent.expression.name.text)) return true;
  }
  let p: ts.Node | undefined = node.parent;
  for (let depth = 0; p && depth < 4; depth++, p = p.parent) {
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
    if (ts.isCallExpression(p)) {
      const callee = p.expression.getText();
      if (/^console\./.test(callee)) return true;
      if (/^(localStorage|sessionStorage)\./.test(callee)) return true;
      if (/\.(querySelector|querySelectorAll|getItem|setItem|removeItem)$/.test(callee)) return true;
      break;
    }
  }
  return false;
}

export function extractFromSource(code: string, file: string): ExtractedString[] {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: ExtractedString[] = [];
  const push = (raw: string, kind: ExtractedString["kind"], node: ts.Node) => {
    const text = normalize(raw);
    if (!text || !ARABIC.test(text)) return;
    // Fragments HTML d'impression et noms de fichiers d'export : jamais dans le DOM de l'application.
    if (/<\/?[a-z][^>]*>/i.test(text) || /\.(csv|json)$/.test(text)) return;
    out.push({ text, kind, file, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
  };
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isNonDisplayContext(node)) push(node.text, "static", node);
    } else if (ts.isTemplateExpression(node)) {
      if (!isNonDisplayContext(node)) {
        let s = node.head.text;
        node.templateSpans.forEach((span, i) => { s += `{${i}}` + span.literal.text; });
        push(s, "template", node);
      }
    } else if (ts.isJsxText(node)) {
      push(node.text, "static", node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/**
 * Chaînes de l'interface : `src/` et les messages des Cloud Functions
 * (`functions/src`, `HttpsError` affichés tels quels par l'application).
 */
export function extractArabicStrings(root = process.cwd()): ExtractedString[] {
  const all: ExtractedString[] = [];
  const files = [...listFiles(join(root, "src"), root), ...listFiles(join(root, "functions", "src"), root)];
  for (const f of files) {
    if (NON_DISPLAY_FILES.includes(relative(root, f).replace(/\\/g, "/"))) continue;
    all.push(...extractFromSource(readFileSync(f, "utf8"), relative(root, f).replace(/\\/g, "/")));
  }
  return all;
}
