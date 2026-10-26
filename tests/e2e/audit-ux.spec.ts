/**
 * Audit UX/UI automatique (arabe, RTL) : balayage de tous les écrans, pour
 * chaque rôle, à 1 440 px puis à 390 px, avec des contrôles de mise en page
 * exécutés dans la page (débordements, chevauchements, texte tronqué, cibles
 * tactiles, écrans vides ou en erreur, RTL, accessibilité de base).
 * Données FICTIVES, émulateurs uniquement. Ne tourne que si AUDIT_DIR est défini :
 *
 *   AUDIT_DIR=/chemin/absolu npm run audit:ux
 *
 * Sorties : `<AUDIT_DIR>/<rôle>/<écran>-<largeur>.png`, `constats.json` (bruts,
 * un par état), `constats-dedupe.json` (un par composant, avec la liste des
 * écrans) et `couverture.json`. Aucune donnée n'est écrite : les fenêtres de
 * saisie sont ouvertes puis fermées sans enregistrer.
 *
 * Filtres facultatifs : AUDIT_ROLES=directeur,parent AUDIT_WIDTHS=390
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, desktopTabs, loginAs, logout, openTab, type DemoAccount } from "./helpers";

const DIR = process.env.AUDIT_DIR || "";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const ONLY_ROLES = (process.env.AUDIT_ROLES || "").split(",").filter(Boolean);
const ONLY_WIDTHS = (process.env.AUDIT_WIDTHS || "").split(",").filter(Boolean).map(Number);

test.skip(!DIR, "AUDIT_DIR non défini");
test.setTimeout(45 * 60_000);

// ---------------------------------------------------------------------------
// Sonde exécutée DANS la page (autonome : aucune référence extérieure).
// ---------------------------------------------------------------------------

interface ProbeOpts {
  /** null : toute la page ; "@modal" : fenêtre ouverte ; "@drawer" : tiroir mobile ; sinon un sélecteur CSS. */
  rootSel: string | null;
  mobile: boolean;
}
interface RawFinding {
  type: string;
  selector: string;
  text: string;
  values: Record<string, unknown>;
  aVerifier?: boolean;
}
interface ProbeResult {
  findings: RawFinding[];
  meta: Record<string, unknown>;
  tronque: Record<string, number>;
}

const probe = (opts: ProbeOpts): ProbeResult => {
  const findings: RawFinding[] = [];
  const counts: Record<string, number> = {};
  const CAP = 40;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const styleCache = new Map<Element, CSSStyleDeclaration>();
  const cs = (el: Element): CSSStyleDeclaration => {
    let s = styleCache.get(el);
    if (!s) {
      s = getComputedStyle(el);
      styleCache.set(el, s);
    }
    return s;
  };
  const norm = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();
  const txt = (el: Element) => norm((el as HTMLElement).innerText ?? el.textContent).slice(0, 90);

  const SKIP_CLASS = /^(flex|grid|block|inline|inline-flex|hidden|relative|absolute|fixed|sticky|items-|justify-|gap-|p[xytblrse]?-|m[xytblrse]?-|w-|h-|min-|max-|shrink|grow|flex-|text-start|text-end|self-|col-|row-|overflow|truncate|cursor|transition|font-|leading|tracking|space-|z-|top-|bottom-|start-|end-|inset|-)/;
  const one = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    let s = tag;
    if (el.id && !el.id.includes(":") && !/^(\d|_?r_)/.test(el.id)) s += "#" + el.id;
    const data = Array.from(el.attributes).filter((a) => a.name.startsWith("data-")).slice(0, 2);
    for (const a of data) s += a.value ? `[${a.name}="${a.value.slice(0, 24)}"]` : `[${a.name}]`;
    const al = el.getAttribute("aria-label");
    if (al) s += `[aria-label="${al.slice(0, 30)}"]`;
    const role = el.getAttribute("role");
    if (role) s += `[role=${role}]`;
    if (tag === "input") s += `[type=${el.getAttribute("type") || "text"}]`;
    const ph = el.getAttribute("placeholder");
    if (ph) s += `[placeholder="${ph.slice(0, 24)}"]`;
    if (!data.length && !al && !(el.id && !/^(\d|_?r_)/.test(el.id))) {
      const cls = (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter((c) => c && !/[:[\]/]/.test(c) && !SKIP_CLASS.test(c))
        .slice(0, 2);
      if (cls.length) s += "." + cls.join(".");
    }
    return s;
  };
  const sel = (el: Element): string => {
    const parts: string[] = [];
    let cur: Element | null = el;
    let depth = 0;
    while (cur && cur !== document.body && cur !== doc && depth < 4) {
      parts.unshift(one(cur));
      if (cur.hasAttribute("data-screen") || cur.hasAttribute("data-modal") || cur.hasAttribute("data-nav") || cur.hasAttribute("data-topbar") || cur.hasAttribute("data-select-menu")) break;
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  };
  const add = (type: string, el: Element, values: Record<string, unknown>, aVerifier = false) => {
    counts[type] = (counts[type] || 0) + 1;
    if (counts[type] > CAP) return;
    findings.push({ type, selector: sel(el), text: txt(el), values, ...(aVerifier ? { aVerifier: true } : {}) });
  };

  const opacityCache = new Map<Element, number>();
  const effOpacity = (el: Element | null): number => {
    if (!el) return 1;
    const c = opacityCache.get(el);
    if (c !== undefined) return c;
    const v = (parseFloat(cs(el).opacity) || 0) * effOpacity(el.parentElement);
    opacityCache.set(el, v);
    return v;
  };
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const s = cs(el);
    if (s.visibility === "hidden" || s.display === "none") return false;
    if (effOpacity(el) < 0.05) return false;
    // Contenu d'un <details> fermé : non rendu (content-visibility), son rectangle de mise en page ne compte pas.
    const det = el.closest("details");
    if (det && det !== el && !det.open) {
      const sm = Array.from(det.children).find((c) => c.tagName === "SUMMARY");
      if (!(sm && (sm === el || sm.contains(el)))) return false;
    }
    if (s.position === "absolute" && r.width <= 2 && r.height <= 2) return false;
    if (s.clipPath && s.clipPath.startsWith("inset(50%")) return false;
    return true;
  };

  interface Box { l: number; t: number; r: number; b: number }
  /** Rectangle réellement visible : coupé par les ancêtres à débordement non visible. */
  const clipOf = (el: Element): Box | null => {
    const br = el.getBoundingClientRect();
    const box: Box = { l: br.left, t: br.top, r: br.right, b: br.bottom };
    const pos = cs(el).position;
    if (pos === "fixed") return box;
    let abs = pos === "absolute";
    let p = el.parentElement;
    while (p && p !== doc && p !== document.body) {
      const s = cs(p);
      if (abs && s.position === "static") {
        p = p.parentElement;
        continue;
      }
      abs = s.position === "absolute";
      const ox = s.overflowX !== "visible";
      const oy = s.overflowY !== "visible";
      if (ox || oy) {
        const pr = p.getBoundingClientRect();
        if (ox) { box.l = Math.max(box.l, pr.left); box.r = Math.min(box.r, pr.right); }
        if (oy) { box.t = Math.max(box.t, pr.top); box.b = Math.min(box.b, pr.bottom); }
      }
      if (s.position === "fixed") break;
      p = p.parentElement;
    }
    return box.r > box.l && box.b > box.t ? box : null;
  };
  const hClipper = (el: Element): Element | null => {
    let p = el.parentElement;
    while (p && p !== doc) {
      if (/(auto|scroll|hidden|clip)/.test(cs(p).overflowX)) return p;
      p = p.parentElement;
    }
    return null;
  };

  // --- Racine de l'audit -----------------------------------------------------
  let root: Element = document.body;
  if (opts.rootSel === "@modal") {
    root = Array.from(document.querySelectorAll('.fixed.inset-0.z-50:not([role="dialog"])')).pop() || document.body;
    if (root !== document.body && !root.querySelector('[role="dialog"]')) add("fenetre-sans-role-dialog", root, { aria_modal: root.getAttribute("aria-modal") || "" });
  } else if (opts.rootSel === "@drawer") {
    root = document.querySelector('[role="dialog"][aria-label] aside') || document.body;
  } else if (opts.rootSel) {
    root = document.querySelector(opts.rootSel) || document.body;
  }
  const all = [root, ...Array.from(root.querySelectorAll("*"))].filter((e) => !(e.closest("svg") && e.tagName.toLowerCase() !== "svg")) as HTMLElement[];
  const vis = all.filter(visible);
  const INTER = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="combobox"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="switch"], [role="option"], [role="link"]';
  const inter = vis.filter((e) => e.matches(INTER)).map((el) => ({ el, box: clipOf(el) })).filter((x) => x.box) as { el: HTMLElement; box: Box }[];

  // --- 1. Débordement horizontal -----------------------------------------------
  if (opts.rootSel === null && doc.scrollWidth > vw) {
    add("debordement-page", doc, { scrollWidth: doc.scrollWidth, innerWidth: vw, depassement: doc.scrollWidth - vw });
  }
  for (const el of vis) {
    if (el === root || el === document.body) continue;
    const r = el.getBoundingClientRect();
    const parent = el.parentElement;
    if ((r.right > vw + 1 || r.left < -1) && !hClipper(el)) {
      const pr = parent ? parent.getBoundingClientRect() : null;
      const parentOut = pr && (pr.right > vw + 1 || pr.left < -1);
      if (!parentOut) add("debordement-viewport", el, { gauche: r2(r.left), droite: r2(r.right), largeurViewport: vw });
      continue;
    }
    const s = cs(el);
    if (parent && (s.position === "static" || s.position === "relative" || s.position === "sticky") && !hClipper(el)) {
      const ps = cs(parent);
      if (ps.display !== "contents" && !/(auto|scroll|hidden|clip)/.test(ps.overflowX)) {
        const pr = parent.getBoundingClientRect();
        if (pr.width > 0 && (r.right > pr.right + 1.5 || r.left < pr.left - 1.5)) {
          add("debordement-parent", el, { gauche: r2(r.left), droite: r2(r.right), parentGauche: r2(pr.left), parentDroite: r2(pr.right), parent: sel(parent) });
        }
      }
    }
  }

  // --- 2. Chevauchements --------------------------------------------------------
  /** Part de `b` contenue dans `a`. */
  const ix0 = (a: Box, b: Box) => {
    const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
    const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return w > 0 && h > 0 ? (w * h) / ((b.r - b.l) * (b.b - b.t)) : 0;
  };
  for (let i = 0; i < inter.length; i++) {
    for (let j = i + 1; j < inter.length; j++) {
      const a = inter[i];
      const b = inter[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // Bouton d'icône posé volontairement dans un champ (œil du mot de passe) : conception normale.
      if ((/^(INPUT|TEXTAREA|SELECT)$/.test(a.el.tagName) && ix0(a.box, b.box) >= 0.98) || (/^(INPUT|TEXTAREA|SELECT)$/.test(b.el.tagName) && ix0(b.box, a.box) >= 0.98)) continue;
      const ix = Math.min(a.box.r, b.box.r) - Math.max(a.box.l, b.box.l);
      const iy = Math.min(a.box.b, b.box.b) - Math.max(a.box.t, b.box.t);
      if (ix <= 0 || iy <= 0) continue;
      const area = ix * iy;
      const smaller = Math.min((a.box.r - a.box.l) * (a.box.b - a.box.t), (b.box.r - b.box.l) * (b.box.b - b.box.t));
      const ratio = area / smaller;
      if (area >= 16 && ratio >= 0.08) add("chevauchement-interactifs", a.el, { avec: sel(b.el), texteAvec: txt(b.el), aire: Math.round(area), ratio: r2(ratio) });
    }
  }
  const maxY = Math.max(0, doc.scrollHeight - vh);
  const positions: number[] = [0];
  for (let y = Math.round(vh * 0.8); y < maxY && positions.length < 12; y += Math.round(vh * 0.8)) positions.push(y);
  if (maxY > 0) positions.push(maxY);
  const seen = new Map<Element, { n: number; covered: number; by: Element | null }>();
  for (const y of positions) {
    window.scrollTo(0, y);
    for (const x of inter) {
      const box = clipOf(x.el);
      if (!box) continue;
      const cx = (box.l + box.r) / 2;
      const cy = (box.t + box.b) / 2;
      if (cx < 0 || cx >= vw || cy < 0 || cy >= vh) continue;
      const hit = document.elementFromPoint(cx, cy);
      if (!hit) continue;
      const rec = seen.get(x.el) || { n: 0, covered: 0, by: null };
      rec.n++;
      const lab = hit.closest("label");
      const related = hit === x.el || x.el.contains(hit) || hit.contains(x.el) || (lab !== null && lab === x.el.closest("label"));
      if (!related) { rec.covered++; rec.by = hit; }
      seen.set(x.el, rec);
    }
  }
  seen.forEach((rec, el) => {
    if (rec.n > 0 && rec.covered === rec.n && rec.by) add("element-recouvert", el, { recouvertPar: sel(rec.by), texteRecouvrant: txt(rec.by), positionsTestees: rec.n });
  });
  if (opts.rootSel === null) {
    const floats = vis.filter((e) => {
      const s = cs(e);
      if (s.position !== "fixed" && s.position !== "sticky") return false;
      if (s.pointerEvents === "none") return false;
      const r = e.getBoundingClientRect();
      return !(r.width >= vw * 0.9 && r.height >= vh * 0.9);
    });
    const pairs = new Map<string, { f: Element; x: Element; ys: number[]; aire: number }>();
    const ys = Array.from(new Set([0, Math.round(maxY / 2), maxY]));
    for (const y of ys) {
      window.scrollTo(0, y);
      for (const f of floats) {
        if (cs(f).position === "sticky" && y !== 0) continue;
        const fr = f.getBoundingClientRect();
        for (const x of inter) {
          if (f.contains(x.el) || x.el.contains(f)) continue;
          const box = clipOf(x.el);
          if (!box) continue;
          const ix = Math.min(fr.right, box.r) - Math.max(fr.left, box.l);
          const iy = Math.min(fr.bottom, box.b) - Math.max(fr.top, box.t);
          if (ix > 0 && iy > 0 && ix * iy >= 16) {
            const key = sel(f) + "|" + sel(x.el);
            const rec = pairs.get(key) || { f, x: x.el, ys: [], aire: 0 };
            rec.ys.push(y);
            rec.aire = Math.max(rec.aire, Math.round(ix * iy));
            pairs.set(key, rec);
          }
        }
      }
    }
    pairs.forEach((rec) => add("flottant-recouvre-interactif", rec.f, { interactif: sel(rec.x), texteInteractif: txt(rec.x), positionsDefilement: rec.ys, aire: rec.aire }));
  }
  window.scrollTo(0, 0);

  // --- 3. Texte tronqué ------------------------------------------------------------
  for (const el of vis) {
    const s = cs(el);
    const clamp = !!(s as any).webkitLineClamp && (s as any).webkitLineClamp !== "none";
    const ell = s.textOverflow === "ellipsis";
    const clipX = s.overflowX === "hidden" || s.overflowX === "clip";
    const clipY = s.overflowY === "hidden" || s.overflowY === "clip";
    if (!(clamp || ell || clipX || clipY)) continue;
    const text = norm(el.textContent);
    if (!text || (el.clientWidth === 0 && el.clientHeight === 0)) continue;
    const overW = el.scrollWidth > el.clientWidth + 1;
    const overH = el.scrollHeight > el.clientHeight + 1;
    if (!(((clipX || ell) && overW) || ((clipY || clamp) && overH))) continue;
    const title = el.getAttribute("title") || el.closest("[title]")?.getAttribute("title") || el.getAttribute("aria-label") || "";
    add("texte-tronque", el, {
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
      ellipsis: ell, lineClamp: clamp, title: norm(title).slice(0, 80), titreDonneLeTexte: !!title && norm(title).includes(text.slice(0, 15)),
    });
  }

  // --- 4. Cibles tactiles (mobile) ---------------------------------------------------
  if (opts.mobile) {
    for (const x of inter) {
      const el = x.el;
      const r = el.getBoundingClientRect();
      const lab = el.closest("label");
      if (lab && (el as HTMLInputElement).type && /checkbox|radio/.test((el as HTMLInputElement).type)) {
        const lr = lab.getBoundingClientRect();
        if (lr.width >= 44 && lr.height >= 44) continue;
      }
      if (el.tagName === "A" && cs(el).display === "inline" && (el.closest("p") || Array.from(el.parentElement?.childNodes || []).some((n) => n.nodeType === 3 && norm(n.textContent).length > 0))) continue;
      if (r.width < 44 || r.height < 44) {
        add(r.width < 24 || r.height < 24 ? "cible-tactile-inf-24" : "cible-tactile-inf-44", el, { largeur: r2(r.width), hauteur: r2(r.height) });
      }
    }
  }

  // --- 5. Écrans vides ou en erreur ----------------------------------------------------
  const main = document.querySelector("main") as HTMLElement | null;
  const mainLen = main ? norm(main.innerText).length : null;
  if (opts.rootSel === null && main && (mainLen as number) < 30) add("ecran-vide", main, { longueurTexte: mainLen, hauteur: Math.round(main.getBoundingClientRect().height) });
  const ERR = /(خطأ|تعذّ?ر|\bError\b|undefined|\bNaN\b|\bnull\b|\[object Object\]|\bInfinity\b|Invalid Date)/i;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    const v = n.textContent || "";
    if (!parent || !ERR.test(v) || /^(SCRIPT|STYLE|OPTION|TITLE|NOSCRIPT)$/.test(parent.tagName) || !visible(parent)) continue;
    const m = v.match(ERR);
    add("texte-erreur", parent, { motif: m ? m[0] : "", extrait: norm(v).slice(0, 120) }, true);
  }
  for (const x of vis) {
    if (x.tagName === "INPUT" || x.tagName === "TEXTAREA") {
      const val = (x as HTMLInputElement).value || "";
      if (/(undefined|\bNaN\b|\bnull\b|\[object Object\])/.test(val)) add("texte-erreur", x, { motif: "valeur de champ", extrait: val.slice(0, 80) }, true);
    }
  }

  // --- 6. RTL --------------------------------------------------------------------------
  const AR = /[؀-ۿ]/;
  const NUMERIC_INPUT = /^(tel|email|number|url|date|time|datetime-local|password|month)$/;
  for (const el of vis) {
    const s = cs(el);
    if (s.display === "inline") continue;
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || "").join(" ");
    let arabic = AR.test(own);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const t = (el as HTMLInputElement).type || "text";
      arabic = !NUMERIC_INPUT.test(t) && AR.test(((el as HTMLInputElement).value || "") + ((el as HTMLInputElement).placeholder || ""));
    }
    if (!arabic) continue;
    if (s.direction === "ltr") add("rtl-direction-ltr", el, { direction: s.direction, textAlign: s.textAlign, largeur: Math.round(el.getBoundingClientRect().width) }, true);
    else if (s.textAlign === "left") add("rtl-texte-aligne-gauche", el, { direction: s.direction, textAlign: s.textAlign, largeur: Math.round(el.getBoundingClientRect().width) }, true);
  }
  if (doc.dir !== "rtl" && doc.dir !== "") add("rtl-document", doc, { dir: doc.dir, lang: doc.lang }, true);
  const NATURAL: Record<string, string> = { left: "left", right: "right", "log-out": "right", "log-in": "right", send: "right", reply: "left", forward: "right", undo: "left", redo: "right" };
  for (const svg of Array.from(root.querySelectorAll("svg"))) {
    if (!visible(svg)) continue;
    const cls = svg.getAttribute("class") || "";
    const m = cls.match(/lucide-([a-z0-9-]+)/);
    if (!m) continue;
    const name = m[1];
    let natural = "";
    if (/(^|-)left($|-)/.test(name)) natural = "left";
    else if (/(^|-)right($|-)/.test(name)) natural = "right";
    else if (NATURAL[name]) natural = NATURAL[name];
    if (!natural) continue;
    let flipped = false;
    let p: Element | null = svg;
    for (let i = 0; i < 3 && p; i++, p = p.parentElement) {
      const tr = cs(p).transform;
      const mm = tr && tr !== "none" ? tr.match(/matrix\(([-\d.e]+)/) : null;
      if (mm && parseFloat(mm[1]) < 0) flipped = !flipped;
    }
    const effective = flipped ? (natural === "left" ? "right" : "left") : natural;
    const holder = svg.closest("button, a, [role=button], [role=menuitem], li, td") || svg.parentElement || svg;
    const ctx = norm(holder.getAttribute("aria-label") || (holder as HTMLElement).innerText || holder.getAttribute("title"));
    let attendu = "";
    if (/السابق|رجوع|عودة|الرئيسية|back|prev/i.test(ctx)) attendu = "right";
    else if (/التالي|next|المزيد|عرض|الانتقال/i.test(ctx)) attendu = "left";
    if (attendu ? attendu !== effective : effective === "right" && /chevron|arrow/.test(name)) {
      add("rtl-icone-directionnelle", svg, { icone: name, directionNaturelle: natural, retournee: flipped, directionEffective: effective, directionAttendueSelonTexte: attendu || "inconnue", contexte: ctx.slice(0, 50) }, true);
    }
  }

  // --- 7. Accessibilité de base ----------------------------------------------------------
  const nameOf = (el: HTMLElement, withContent = true): string => {
    const al = norm(el.getAttribute("aria-label"));
    if (al) return al;
    const lb = el.getAttribute("aria-labelledby");
    if (lb) {
      const t = norm(lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" "));
      if (t) return t;
    }
    if (el instanceof HTMLInputElement && /^(button|submit|reset)$/.test(el.type) && el.value) return el.value;
    const labels = (el as any).labels as NodeListOf<HTMLLabelElement> | undefined;
    if (labels && labels.length) {
      const t = norm(Array.from(labels).map((l) => l.textContent).join(" "));
      if (t) return t;
    }
    if (withContent) {
      const t = norm(el.textContent);
      if (t) return t;
      const img = el.querySelector("img[alt]");
      if (img && norm(img.getAttribute("alt"))) return norm(img.getAttribute("alt"));
      const st = el.querySelector("svg title");
      if (st && norm(st.textContent)) return norm(st.textContent);
    }
    return norm(el.getAttribute("title"));
  };
  for (const el of vis) {
    const tag = el.tagName;
    const role = el.getAttribute("role") || "";
    const isField = ((tag === "INPUT" && !/^(hidden|submit|button|reset|image)$/.test((el as HTMLInputElement).type)) || tag === "SELECT" || tag === "TEXTAREA" || role === "combobox");
    if (isField) {
      if (!nameOf(el, false)) add("champ-sans-label", el, { placeholder: (el as HTMLInputElement).placeholder || "", seulementPlaceholder: !!(el as HTMLInputElement).placeholder, type: (el as HTMLInputElement).type || role });
    } else if (tag === "BUTTON" || role === "button" || role === "tab" || role === "menuitem" || (tag === "A" && el.hasAttribute("href"))) {
      if (!nameOf(el)) add(tag === "A" ? "lien-sans-nom" : "bouton-sans-nom", el, { title: el.getAttribute("title") || "" });
    } else if (tag === "IMG" && !el.hasAttribute("alt")) {
      add("image-sans-alt", el, { src: (el.getAttribute("src") || "").slice(0, 60) });
    }
  }
  const cv = document.createElement("canvas");
  cv.width = 1;
  cv.height = 1;
  const ctx2 = cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const colorCache = new Map<string, number[]>();
  const parseColor = (c: string): number[] => {
    const hit = colorCache.get(c);
    if (hit) return hit;
    let out: number[];
    const m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      let a = 1;
      if (m[4] !== undefined) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      out = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), a];
    } else {
      ctx2.clearRect(0, 0, 1, 1);
      ctx2.fillStyle = "#000";
      ctx2.fillStyle = c;
      ctx2.fillRect(0, 0, 1, 1);
      const d = ctx2.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    }
    colorCache.set(c, out);
    return out;
  };
  const bgOf = (el: Element): number[] | null => {
    const layers: number[][] = [];
    for (let p: Element | null = el; p; p = p.parentElement) {
      const s = cs(p);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      const c = parseColor(s.backgroundColor);
      if (c[3] > 0) {
        layers.push(c);
        if (c[3] >= 0.99) break;
      }
    }
    let base = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) {
      const [r, g, b, a] = layers[i];
      base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)];
    }
    return base;
  };
  const lum = (c: number[]) => {
    const f = (v: number) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  for (const el of vis) {
    if (/^(SCRIPT|STYLE|OPTION|TITLE|NOSCRIPT|SVG)$/i.test(el.tagName)) continue;
    const own = norm(Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || "").join(" "));
    if (!own || !/[\p{L}\p{N}]/u.test(own)) continue;
    if (el.closest(":disabled, [aria-disabled='true']")) continue;
    const s = cs(el);
    const fill = (s as any).webkitTextFillColor as string | undefined;
    if ((fill && parseColor(fill)[3] === 0) || (s as any).webkitBackgroundClip === "text" || s.backgroundClip === "text") continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const fg = parseColor(s.color);
    const a = fg[3] * effOpacity(el);
    const fgc = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
    const l1 = lum(fgc);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight, 10) >= 700;
    const required = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (r2(ratio) < required) {
      add("contraste-insuffisant", el, { ratio: r2(ratio), requis: required, tailleTexte: size, graisse: s.fontWeight, couleurTexte: s.color, couleurFond: `rgb(${bg.map((v) => Math.round(v)).join(",")})` });
    }
  }

  // --- Méta ----------------------------------------------------------------------------------
  const meta = {
    dir: doc.dir, lang: doc.lang, scrollWidth: doc.scrollWidth, scrollHeight: doc.scrollHeight, innerWidth: vw, innerHeight: vh,
    mainTextLength: mainLen, elementsVisibles: vis.length, interactifs: inter.length,
  };
  const tronque: Record<string, number> = {};
  for (const k of Object.keys(counts)) if (counts[k] > CAP) tronque[k] = counts[k];
  return { findings, meta, tronque };
};

// ---------------------------------------------------------------------------
// Côté Node : collecte, captures, dédoublonnage.
// ---------------------------------------------------------------------------

interface Constat {
  role: string;
  ecran: string;
  largeur: number;
  type: string;
  selector: string;
  text: string;
  values: Record<string, unknown>;
  aVerifier?: boolean;
}
interface Couverture {
  role: string;
  ecran: string;
  largeur: number;
  capture: boolean;
  fichier?: string;
  note?: string;
  nombreConstats?: number;
  meta?: Record<string, unknown>;
  constatsTronques?: Record<string, number>;
}

const raw: Constat[] = [];
const coverage: Couverture[] = [];
const cur = { role: "", ecran: "", largeur: 0 };

function record(type: string, selector: string, text: string, values: Record<string, unknown> = {}) {
  raw.push({ role: cur.role, ecran: cur.ecran, largeur: cur.largeur, type, selector, text, values });
}

function watch(page: Page) {
  page.on("console", (m) => {
    if (m.type() === "error") record("console-erreur", "-", m.text().slice(0, 300), { emplacement: m.location().url?.slice(0, 120) });
  });
  page.on("pageerror", (e) => record("pageerror", "-", String(e.message || e).slice(0, 300)));
  page.on("requestfailed", (r) => {
    const failure = r.failure()?.errorText || "";
    if (/ERR_ABORTED/.test(failure) && /firestore\.googleapis\.com|\/Listen\/|\/Write\//.test(r.url())) return;
    record("requete-echouee", "-", `${r.method()} ${r.url().slice(0, 160)}`, { erreur: failure, environnement: /fonts\.(googleapis|gstatic)\.com|unsplash|qrserver/.test(r.url()) });
  });
  page.on("response", (r) => {
    if (r.status() >= 400) record("reponse-http-erreur", "-", `${r.request().method()} ${r.url().slice(0, 160)}`, { statut: r.status() });
  });
}

async function settle(page: Page) {
  await page.waitForTimeout(450);
  await page.evaluate(() => (document as any).fonts?.ready).catch(() => undefined);
}

interface SnapOpts {
  root?: string;
  shot?: "page" | "viewport" | { locator: string };
}

async function snap(page: Page, ecran: string, o: SnapOpts = {}) {
  cur.ecran = ecran;
  await settle(page);
  const w = cur.largeur;
  const base: Couverture = { role: cur.role, ecran, largeur: w, capture: false };
  let res: ProbeResult;
  try {
    res = await page.evaluate(probe, { rootSel: o.root ?? null, mobile: w < 768 });
  } catch (e) {
    coverage.push({ ...base, note: `sonde en échec : ${String((e as Error).message).slice(0, 200)}` });
    return;
  }
  const rel = join(cur.role, `${ecran}-${w}.png`);
  mkdirSync(join(DIR, cur.role), { recursive: true });
  try {
    if (o.shot === "viewport") await page.screenshot({ path: join(DIR, rel), animations: "disabled" });
    else if (o.shot && typeof o.shot === "object") await page.locator(o.shot.locator).first().screenshot({ path: join(DIR, rel), animations: "disabled" });
    else await page.screenshot({ path: join(DIR, rel), fullPage: true, animations: "disabled" });
  } catch (e) {
    coverage.push({ ...base, nombreConstats: res.findings.length, meta: res.meta, note: `capture impossible : ${String((e as Error).message).slice(0, 160)}` });
    for (const f of res.findings) raw.push({ role: cur.role, ecran, largeur: w, ...f });
    return;
  }
  for (const f of res.findings) raw.push({ role: cur.role, ecran, largeur: w, ...f });
  coverage.push({ ...base, capture: true, fichier: rel, nombreConstats: res.findings.length, meta: res.meta, constatsTronques: Object.keys(res.tronque).length ? res.tronque : undefined });
}

/** Fenêtre ouverte : voile `fixed inset-0 z-50` (le tiroir mobile a role=dialog, il est traité à part). */
const OVERLAY = '.fixed.inset-0.z-50:not([role="dialog"])';

/** Ferme la fenêtre ouverte ; renvoie comment elle s'est fermée. */
async function closeModal(page: Page): Promise<"echap" | "bouton" | "rechargement" | "aucune"> {
  const ov = page.locator(OVERLAY);
  if ((await ov.count()) === 0) {
    if ((await page.locator('[data-nav="mobile"]').count()) > 0) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
    return "aucune";
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  if ((await ov.count()) === 0) return "echap";
  await ov.last().getByRole("button", { name: /إلغاء|إغلاق|رجوع/ }).first().click({ timeout: 2500 }).catch(() => undefined);
  await page.waitForTimeout(300);
  if ((await ov.count()) === 0) return "bouton";
  await page.reload();
  await expect(page.locator("[data-app-shell]")).toBeVisible();
  return "rechargement";
}

/** Exécute une étape ; une étape inaccessible n'est pas un échec, on la note. */
async function unit(page: Page, ecran: string, fn: () => Promise<void>) {
  cur.ecran = ecran;
  console.log(`[audit] ${new Date().toISOString().slice(11, 19)} ${cur.role} ${ecran} @${cur.largeur}`);
  try {
    await fn();
  } catch (e) {
    const before = coverage.filter((c) => c.role === cur.role && c.ecran === ecran && c.largeur === cur.largeur).length;
    if (!before) coverage.push({ role: cur.role, ecran, largeur: cur.largeur, capture: false, note: String((e as Error).message).split("\n")[0].slice(0, 200) });
    await closeModal(page).catch(() => undefined);
  }
}

async function goTab(page: Page, tab: string, mobile: boolean) {
  if (!mobile) {
    await openTab(page, tab);
  } else {
    await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
    await page.locator(`[data-nav="mobile"] [data-tab="${tab}"]`).click();
    await expect(page.locator('[data-nav="mobile"]')).toBeHidden();
  }
  await page.waitForTimeout(250);
}

async function openDrawer(page: Page) {
  await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
  await expect(page.locator('[data-nav="mobile"]')).toBeVisible();
}

/** Fenêtre « formulaire » ouverte puis annulée (aucune écriture). */
async function modalUnit(page: Page, ecran: string, opener: () => Promise<void>) {
  await unit(page, ecran, async () => {
    await opener();
    await expect(page.locator(OVERLAY).first()).toBeVisible();
    await snap(page, ecran, { root: "@modal" });
    const title = ((await page.locator(OVERLAY).last().locator("h1, h2, h3").first().textContent().catch(() => "")) || "").trim();
    const how = await closeModal(page);
    if (how !== "echap") record("fenetre-echap-sans-effet", `fenêtre « ${title} »`, title, { fermeture: how });
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });
}

async function tabExtras(page: Page, tab: string, mobile: boolean) {
  const subs = await page.locator("[data-subtab]:visible").evaluateAll((els) => Array.from(new Set(els.map((e) => e.getAttribute("data-subtab") || "")))).catch(() => [] as string[]);
  const views: (string | null)[] = [null, ...subs.slice(0, 8)];
  for (const sub of views) {
    const label = sub ? `${tab}--${sub}` : tab;
    if (sub) {
      await unit(page, label, async () => {
        await page.locator(`[data-subtab="${sub}"]:visible`).first().click();
        await snap(page, label);
      });
    }
    // Fenêtres de saisie : on ouvre puis on annule.
    const actions = await page.locator('[data-action^="open-"]:visible').evaluateAll((els) => Array.from(new Set(els.map((e) => e.getAttribute("data-action") || ""))).filter((a) => /^open-.*-form$|^open-monthly-report$|^open-staff-badge$/.test(a))).catch(() => [] as string[]);
    for (const a of actions) {
      await modalUnit(page, `${label}--fenetre-${a.replace(/^open-/, "")}`, async () => {
        await page.locator(`[data-action="${a}"]:visible`).first().click();
      });
    }
  }
  if (subs.length) await page.locator(`[data-subtab="${subs[0]}"]:visible`).first().click().catch(() => undefined);

  // Filtre (liste déroulante de la charte) : ouvert, puis refermé.
  const combo = page.locator('[data-screen] [role="combobox"]:visible').first();
  if ((await combo.count()) > 0) {
    await unit(page, `${tab}--filtre-ouvert`, async () => {
      await combo.click();
      await expect(page.locator("[data-select-menu]")).toBeVisible();
      await snap(page, `${tab}--filtre-ouvert`, { root: "[data-select-menu]", shot: "viewport" });
      await page.keyboard.press("Escape");
      await expect(page.locator("[data-select-menu]")).toHaveCount(0);
    });
  }

  // Fiche élève (liste d'administration) : détail, puis carte d'élève.
  if (tab === "students") {
    const detail = page.getByRole("button", { name: "عرض التفاصيل" }).first();
    if ((await detail.count()) > 0) {
      await unit(page, "students--fiche-eleve", async () => {
        await detail.click();
        await snap(page, "students--fiche-eleve");
      });
    }
    const card = page.locator('[data-action="open-student-card"]:visible').first();
    if ((await card.count()) > 0) {
      await modalUnit(page, "students--fenetre-carte-eleve", async () => { await card.click(); });
    }
    // Modifier un élève : fenêtre de saisie préremplie, annulée.
    const edit = page.getByRole("button", { name: "تعديل الطالب" }).first();
    if ((await edit.count()) > 0) await modalUnit(page, "students--fenetre-modifier-eleve", async () => { await edit.click(); });
  }
  // Détails (navigation interne) : activité, élève du tableau de bord enseignant.
  for (const a of ["open-activity", "open-teacher-student-file"]) {
    const btn = page.locator(`[data-action="${a}"]:visible`).first();
    if ((await btn.count()) > 0) {
      await unit(page, `${tab}--detail-${a.replace(/^open-/, "")}`, async () => {
        await btn.click();
        await page.waitForTimeout(300);
        const asModal = (await page.locator(OVERLAY).count()) > 0;
        await snap(page, `${tab}--detail-${a.replace(/^open-/, "")}`, asModal ? { root: "@modal" } : {});
        await closeModal(page);
        await goTab(page, tab, mobile);
      });
    }
  }
}

async function passAt(page: Page, tabs: string[], size: { width: number; height: number }) {
  const mobile = size.width < 1024;
  cur.largeur = size.width;
  await page.setViewportSize(size);
  await page.waitForTimeout(300);

  for (const tab of tabs) {
    await unit(page, tab, async () => {
      await goTab(page, tab, mobile);
      await snap(page, tab);
    });
    await unit(page, `${tab}--extras`, async () => { await tabExtras(page, tab, mobile); });
  }

  // Cadre : barre du haut, menu latéral ou tiroir.
  await unit(page, "barre-haut", async () => {
    if (tabs[0]) await goTab(page, tabs[0], mobile);
    await snap(page, "barre-haut", { root: "[data-topbar]", shot: { locator: "[data-topbar]" } });
  });
  if (!mobile) {
    await unit(page, "menu-lateral", async () => {
      await snap(page, "menu-lateral", { root: '[data-nav="desktop"]', shot: { locator: "aside" } });
    });
  } else {
    await unit(page, "tiroir", async () => {
      await openDrawer(page);
      await snap(page, "tiroir", { root: "@drawer", shot: "viewport" });
      await page.keyboard.press("Escape");
      await expect(page.locator('[data-nav="mobile"]')).toBeHidden();
    });
  }

  // Profil (puis annulation) et cloche des notifications.
  await modalUnit(page, "profil", async () => { await page.locator('[data-action="open-profile"]').click(); });
  await unit(page, "notifications-cloche", async () => {
    await page.locator('[data-topbar] button[aria-label^="الإشعارات"]').click();
    await snap(page, "notifications-cloche");
  });

  // Sélecteur d'école et page de choix (comptes multi-écoles ou super-admin).
  const schoolMenu = async () => {
    if (mobile) await openDrawer(page);
    return page.locator("#school-switcher");
  };
  const hasSwitcher = (await schoolMenu().then((l) => l.count()).catch(() => 0)) > 0;
  if (hasSwitcher) {
    await unit(page, "selecteur-ecole-ouvert", async () => {
      const trig = page.locator("#school-switcher");
      await trig.click();
      await expect(page.locator("[data-select-menu]")).toBeVisible();
      await snap(page, "selecteur-ecole-ouvert", { root: "[data-select-menu]", shot: "viewport" });
      await page.keyboard.press("Escape");
      await expect(page.locator("[data-select-menu]")).toHaveCount(0);
    });
    await unit(page, "choix-ecole", async () => {
      if (mobile && (await page.locator('[data-nav="mobile"]').count()) === 0) await openDrawer(page);
      await chooseOption(page, page.locator("#school-switcher"), "__picker__");
      await expect(page.locator('[data-screen="school-picker"]')).toBeVisible();
      await snap(page, "choix-ecole");
      await page.getByRole("button", { name: /جمعية الفجر الجديد|مدرسة النور/ }).first().click();
      await expect(page.locator("[data-app-shell]")).toBeVisible();
    });
  }
  await closeModal(page);
}

/** Écriture des résultats (appelée après chaque rôle : un échec tardif ne perd rien). */
function dedupe(list: Constat[]) {
  interface Entry {
    type: string;
    selector: string;
    text: string;
    exemplesTexte: string[];
    values: Record<string, unknown>;
    aVerifier: boolean;
    occurrences: number;
    ecrans: string[];
    roles: string[];
    largeurs: number[];
  }
  const map = new Map<string, Entry>();
  for (const c of list) {
    const net = /^(console|pageerror|requete|reponse)/.test(c.type);
    const key = [c.type, c.selector.replace(/="[^"]*"/g, (m) => (/\d/.test(m) || m.length > 16 ? '="~"' : m)), net ? c.text.replace(/\d+/g, "#") : String((c.values as any).avec || (c.values as any).interactif || (c.values as any).recouvertPar || (c.values as any).motif || "")].join("||");
    const e = map.get(key) || { type: c.type, selector: c.selector, text: c.text, exemplesTexte: [], values: c.values, aVerifier: !!c.aVerifier, occurrences: 0, ecrans: [], roles: [], largeurs: [] };
    e.occurrences++;
    if (c.text && e.exemplesTexte.length < 3 && !e.exemplesTexte.includes(c.text)) e.exemplesTexte.push(c.text);
    const where = `${c.role}:${c.ecran}@${c.largeur}`;
    if (!e.ecrans.includes(where)) e.ecrans.push(where);
    if (!e.roles.includes(c.role)) e.roles.push(c.role);
    if (!e.largeurs.includes(c.largeur)) e.largeurs.push(c.largeur);
    map.set(key, e);
  }
  return Array.from(map.values()).sort((a, b) => a.type.localeCompare(b.type) || b.ecrans.length - a.ecrans.length);
}

function flush() {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, "constats.json"), JSON.stringify(raw, null, 1));
  writeFileSync(join(DIR, "constats-dedupe.json"), JSON.stringify(dedupe(raw), null, 1));
  writeFileSync(join(DIR, "couverture.json"), JSON.stringify(coverage, null, 1));
}

const ROLES: [string, DemoAccount][] = [
  ["directeur", ACCOUNTS.directeur],
  ["administratif", ACCOUNTS.administratif],
  ["enseignant", ACCOUNTS.enseignant],
  ["parent", ACCOUNTS.parent],
  ["eleve", ACCOUNTS.eleve],
  ["encadrant", ACCOUNTS.encadrant],
  ["entretien", ACCOUNTS.entretien],
  // École « annour » (peu garnie : listes presque vides).
  ["directeur-annour", ACCOUNTS.directeurAnnour],
];

test.describe.serial("audit UX (arabe)", () => {
  test.use({ viewport: DESKTOP });
  test.afterAll(() => flush());

  test("connexion", async ({ page }) => {
    watch(page);
    page.setDefaultTimeout(6_000);
    cur.role = "connexion";
    for (const size of [DESKTOP, MOBILE]) {
      if (ONLY_WIDTHS.length && !ONLY_WIDTHS.includes(size.width)) continue;
      cur.largeur = size.width;
      await page.setViewportSize(size);
      await page.goto("/");
      await expect(page.locator('form button[type="submit"]')).toBeVisible();
      await snap(page, "connexion");
      await unit(page, "connexion-erreur", async () => {
        await page.locator('form input[type="text"]').fill("utilisateur_inconnu");
        await page.locator('form input[type="password"]').fill("mauvais-mot-de-passe");
        await page.locator('form button[type="submit"]').click();
        await expect(page.getByText("اسم المستخدم أو كلمة المرور غير صحيحة")).toBeVisible();
        await snap(page, "connexion-erreur");
      });
    }
    flush();
  });

  for (const [folder, account] of ROLES) {
    test(`écrans : ${folder}`, async ({ page }) => {
      test.skip(ONLY_ROLES.length > 0 && !ONLY_ROLES.includes(folder), "rôle filtré");
      watch(page);
      page.setDefaultTimeout(6_000);
      cur.role = folder;
      cur.largeur = DESKTOP.width;
      cur.ecran = "connexion";
      await page.setViewportSize(DESKTOP);
      await loginAs(page, account);
      await page.waitForTimeout(800);
      const tabs = await desktopTabs(page);
      for (const size of [DESKTOP, MOBILE]) {
        if (ONLY_WIDTHS.length && !ONLY_WIDTHS.includes(size.width)) continue;
        await passAt(page, tabs, size);
      }
      flush();
      await page.setViewportSize(DESKTOP);
      cur.ecran = "deconnexion";
      await logout(page);
    });
  }
});
