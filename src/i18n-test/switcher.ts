/**
 * Sélecteur AR / FR marqué « test » (D79). Élément autonome ajouté à <body>,
 * hors de l'arbre React (aucun fichier d'écran n'est modifié) : il flotte
 * dans la zone libre de la barre du haut (bureau) ou dans un coin bas
 * (mobile), et reste donc visible à la connexion comme dans l'application.
 */
import type { Lang } from "./storage";

export function mountSwitcher(get: () => Lang, set: (lang: Lang) => void) {
  if (document.getElementById("i18n-test-switch")) return;
  const box = document.createElement("div");
  box.id = "i18n-test-switch";
  box.className = "i18n-test-switch";
  box.setAttribute("data-no-translate", "");
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Langue de l'interface (test)");
  box.setAttribute("dir", "ltr");

  const badge = document.createElement("span");
  badge.className = "i18n-test-badge";
  badge.textContent = "test";
  box.appendChild(badge);

  const buttons = (["ar", "fr"] as const).map((lang) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = lang.toUpperCase();
    b.setAttribute("data-lang", lang);
    b.setAttribute("lang", lang);
    b.title = lang === "ar" ? "العربية" : "Français (test)";
    b.addEventListener("click", () => {
      set(lang);
      sync();
    });
    box.appendChild(b);
    return b;
  });

  const sync = () => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.lang === get()));
  };
  sync();
  document.body.appendChild(box);
}
