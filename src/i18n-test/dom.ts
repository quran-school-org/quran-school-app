/**
 * Couche de traduction au niveau du DOM (D79), active seulement en FR.
 *
 * - Les nœuds texte reconnus sont modifiés EN PLACE (`nodeValue`) : aucun
 *   nœud n'est remplacé ni inséré, React continue de les mettre à jour ; une
 *   mise à jour de React (texte arabe) est retraduite par l'observateur.
 * - Attributs traduits : placeholder, title, aria-label, alt (et `label`
 *   d'une option). Le texte d'une <option> est traduit, sa valeur jamais :
 *   une option sans attribut `value` reçoit d'abord sa valeur arabe d'origine
 *   (sinon la valeur suivrait le texte traduit).
 * - Jamais touchés : valeur des input et textarea, contenu contenteditable,
 *   script, style, et tout ce qui est sous [data-no-translate].
 * - Retour en AR : chaque texte et attribut traduit reprend sa valeur arabe.
 */
import type { Translator } from "./translate";

const ATTRS = ["placeholder", "title", "aria-label", "alt", "label"] as const;
/** Contenu jamais traduit (le texte d'un textarea est sa valeur) ; leurs attributs le sont. */
const TEXT_SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "TEMPLATE"]);

interface Original { ar: string; fr: string }

const textOriginals = new WeakMap<Text, Original>();
const attrOriginals = new WeakMap<Element, Map<string, Original>>();

/** Zone exclue : sous [data-no-translate] ou contenu éditable. */
function inExcludedZone(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (e.hasAttribute("data-no-translate")) return true;
    if ((e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

/** Texte non traduisible : zone exclue, ou contenu d'un script, style, textarea… */
function isTextSkipped(parent: Element | null): boolean {
  for (let e = parent; e; e = e.parentElement) if (TEXT_SKIP_TAGS.has(e.tagName)) return true;
  return inExcludedZone(parent);
}

export interface DomTranslator {
  start(): void;
  stop(): void;
  /** Textes arabes rencontrés sans traduction (dédoublonnés). */
  missing: Set<string>;
}

export function createDomTranslator(t: Translator, roots: () => Node[], onMissing?: (s: string) => void): DomTranslator {
  const missing = new Set<string>();
  let observer: MutationObserver | null = null;

  const note = (s: string) => {
    const k = s.trim();
    if (!k || missing.has(k) || !t.isMissing(k)) return;
    missing.add(k);
    onMissing?.(k);
  };

  const translateText = (node: Text) => {
    const value = node.nodeValue || "";
    const prev = textOriginals.get(node);
    if (prev && value === prev.fr) return; // déjà traduit (notre propre écriture)
    if (isTextSkipped(node.parentElement)) return;
    const fr = t.translate(value);
    if (fr === null) { note(value); return; }
    const opt = node.parentElement;
    if (opt && opt.tagName === "OPTION" && !opt.hasAttribute("value")) {
      // La valeur d'une option sans `value` est son texte : on la fige en arabe.
      opt.setAttribute("value", (opt as HTMLOptionElement).text);
    }
    textOriginals.set(node, { ar: value, fr });
    node.nodeValue = fr;
  };

  // Attributs d'affichage seulement : jamais `value` (input, textarea, option).
  const translateAttrs = (el: Element) => {
    if (inExcludedZone(el)) return;
    for (const name of ATTRS) {
      const value = el.getAttribute(name);
      if (value === null) continue;
      if (name === "label" && el.tagName !== "OPTION" && el.tagName !== "OPTGROUP") continue;
      const map = attrOriginals.get(el);
      const prev = map?.get(name);
      if (prev && value === prev.fr) continue;
      const fr = t.translate(value);
      if (fr === null) { note(value); continue; }
      const m = map || new Map<string, Original>();
      m.set(name, { ar: value, fr });
      attrOriginals.set(el, m);
      el.setAttribute(name, fr);
    }
  };

  const walk = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      const el = root as Element;
      if (inExcludedZone(el)) return;
      translateAttrs(el);
      if (isTextSkipped(el)) return;
    }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as Element;
          if (el.hasAttribute("data-no-translate") || (el as HTMLElement).isContentEditable) return NodeFilter.FILTER_REJECT;
          if (TEXT_SKIP_TAGS.has(el.tagName)) {
            translateAttrs(el); // placeholder d'un textarea : oui ; son contenu : jamais
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
      else translateAttrs(n as Element);
    }
  };

  const onMutations = (records: MutationRecord[]) => {
    for (const r of records) {
      if (r.type === "characterData") translateText(r.target as Text);
      else if (r.type === "attributes") translateAttrs(r.target as Element);
      else r.addedNodes.forEach(walk);
    }
  };

  const restore = (root: Node) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n: Node | null = root; n; n = tw.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) {
        const o = textOriginals.get(n as Text);
        if (o && n.nodeValue === o.fr) n.nodeValue = o.ar;
        textOriginals.delete(n as Text);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as Element;
        const map = attrOriginals.get(el);
        map?.forEach((o, name) => { if (el.getAttribute(name) === o.fr) el.setAttribute(name, o.ar); });
        attrOriginals.delete(el);
      }
    }
  };

  return {
    missing,
    start() {
      if (observer) return;
      observer = new MutationObserver(onMutations);
      for (const root of roots()) {
        walk(root);
        observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
      }
    },
    stop() {
      if (!observer) return;
      observer.takeRecords(); // mutations en attente : inutile de les traduire avant de restaurer
      observer.disconnect();
      observer = null;
      for (const root of roots()) restore(root);
    },
  };
}
