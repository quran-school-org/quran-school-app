/**
 * Moteur de traduction PUR (sans DOM) de la couche de test FR (D79).
 *
 * - correspondance exacte après normalisation des espaces ;
 * - motifs : une clé contenant {0}, {1}… capture des valeurs ; une valeur
 *   capturée est traduite si elle figure elle-même au dictionnaire (rôle,
 *   mois, statut), sinon reprise telle quelle (nom, nombre, date) ;
 * - jetons : un texte fait uniquement de noms de mois ou de jours, de
 *   chiffres et de ponctuation (dates formatées) est traduit mot à mot,
 *   avant les motifs ;
 * - les espaces de début et de fin du texte d'origine sont conservés.
 * Retourne `null` quand il n'y a rien à traduire (texte sans arabe ou inconnu).
 */
export const ARABIC = /[\u0600-\u06FF]/;

export function normalize(s: string): string {
  return s.replace(/[\s\u00A0\u200F\u200E]+/g, " ").trim();
}

/** Mois (graphies marocaine et orientale) et jours : dates formatées par Intl ou à la main. */
export const TOKENS: Record<string, string> = {
  "يناير": "janvier", "فبراير": "février", "مارس": "mars", "أبريل": "avril", "ماي": "mai", "مايو": "mai",
  "يونيو": "juin", "يوليوز": "juillet", "يوليو": "juillet", "غشت": "août", "أغسطس": "août",
  "شتمبر": "septembre", "شتنبر": "septembre", "سبتمبر": "septembre", "أكتوبر": "octobre", "نونبر": "novembre", "نوفمبر": "novembre",
  "دجنبر": "décembre", "ديسمبر": "décembre",
  "الأحد": "dimanche", "الاثنين": "lundi", "الإثنين": "lundi", "الثلاثاء": "mardi", "الأربعاء": "mercredi",
  "الخميس": "jeudi", "الجمعة": "vendredi", "السبت": "samedi",
  "د.م": "DH", "درهم": "DH", "د.م.": "DH",
};

interface Pattern {
  re: RegExp;
  fr: string;
  /** Longueur du texte fixe : les motifs les plus précis sont essayés d'abord. */
  weight: number;
  /**
   * Texte fixe trop court pour identifier la phrase (« {0} و{1} », « {0} ({1}) ») :
   * si toutes ses valeurs sont de l'arabe inconnu, le motif est écarté (sinon
   * « و » au milieu d'une citation serait pris pour « et »).
   */
  weak: boolean;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface Translator {
  /** Traduction d'un texte brut (nœud texte, attribut), ou null. */
  translate(raw: string): string | null;
  /** Vrai si le texte (normalisé) contient de l'arabe sans traduction connue. */
  isMissing(raw: string): boolean;
}

/**
 * `keep` : chaînes laissées en arabe volontairement (textes consacrés) ; elles
 * ne sont pas signalées comme manquantes.
 */
export function createTranslator(dict: Record<string, string>, keep: Iterable<string> = []): Translator {
  const kept = new Set([...keep].map(normalize));
  const exact = new Map<string, string>();
  const patterns: Pattern[] = [];
  for (const [ar, fr] of Object.entries(dict)) {
    const key = normalize(ar);
    if (/\{\d+\}/.test(key)) {
      const parts = key.split(/\{(\d+)\}/);
      let src = "^";
      const order: number[] = [];
      parts.forEach((p, i) => {
        if (i % 2 === 0) src += escapeRe(p);
        else { src += "(.+?)"; order.push(Number(p)); }
      });
      // Les groupes sont numérotés dans l'ordre d'apparition ; la traduction peut les réordonner.
      const re = new RegExp(src + "$", "s");
      let mapped = fr;
      order.forEach((n, idx) => { mapped = mapped.split(`{${n}}`).join(`\u0000${idx}\u0000`); });
      const fixed = parts.filter((_, i) => i % 2 === 0).join("");
      const letters = (fixed.match(/[\u0621-\u06FF]/g) || []).length;
      patterns.push({ re, fr: mapped, weight: fixed.length, weak: letters < 4 });
    } else {
      exact.set(key, fr);
    }
  }
  patterns.sort((a, b) => b.weight - a.weight);

  const tokenRe = /^[\s\d.,:;\-–/\u060C()%]*$/;
  const byTokens = (s: string): string | null => {
    let found = false;
    const out = s.replace(/[\u0621-\u06FF][\u0621-\u06FF.]*/g, (w) => { // lettres (sans la virgule « ، »)
      const t = TOKENS[w] ?? TOKENS[w.replace(/\.$/, "")];
      if (t === undefined) return w;
      found = true;
      return t;
    });
    if (!found || /[\u0621-\u06FF]/.test(out) || !tokenRe.test(out.replace(/[a-zéûôàèç]+/gi, ""))) return null;
    // « الخميس، 23 أكتوبر 2026 » → « jeudi 23 octobre 2026 ».
    return out.replace(/\s*\u060C\s*/g, " ").replace(/\s+/g, " ").trim();
  };

  const core = (s: string, depth: number): string | null => {
    if (kept.has(s)) return null;
    const hit = exact.get(s);
    if (hit !== undefined) return hit;
    const date = byTokens(s);
    if (date !== null) return date;
    for (const p of patterns) {
      const m = p.re.exec(s);
      if (!m) continue;
      let translatedValue = false;
      let unknownArabic = false;
      const out = p.fr.replace(/\u0000(\d+)\u0000/g, (_, idx) => {
        const v = m[Number(idx) + 1];
        if (!ARABIC.test(v)) return v;
        const tv = depth > 2 ? null : core(normalize(v), depth + 1);
        if (tv === null) { unknownArabic = true; return v; }
        translatedValue = true;
        return tv;
      });
      // Motif faible dont les valeurs sont de l'arabe inconnu (citation, nom) : pas une traduction.
      if (p.weak && unknownArabic && !translatedValue) continue;
      if (out !== s) return out;
    }
    return null;
  };

  return {
    translate(raw: string) {
      if (!raw || !ARABIC.test(raw)) return null;
      const s = normalize(raw);
      const fr = core(s, 0);
      if (fr === null) return null;
      const lead = raw.match(/^[\s ]*/)![0];
      const trail = raw.match(/[\s ]*$/)![0];
      return lead + fr + trail;
    },
    isMissing(raw: string) {
      const s = normalize(raw);
      // Une lettre isolée (initiale d'un avatar) n'est pas une chaîne d'interface.
      return ARABIC.test(s) && s.length > 1 && !kept.has(s) && core(s, 0) === null;
    },
  };
}
