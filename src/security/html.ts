/**
 * Échappement HTML des données insérées dans les fenêtres d'impression
 * (`window.open("")` + `document.write`). Ces fenêtres partagent l'origine de
 * l'application : une balise injectée dans un nom d'élève, une note ou un
 * commentaire y exécuterait du script avec la session de la personne qui
 * imprime (constat C-01 de la revue de sécurité). Toute valeur issue des
 * données doit passer par `escapeHtml` ; le HTML produit par React
 * (`element.innerHTML`) est déjà échappé.
 */
const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (c) => ENTITIES[c]);
}
