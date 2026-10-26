/**
 * Sélecteur AR / FR marqué « test » (D79). Élément autonome ajouté à <body>,
 * hors de l'arbre React (aucun fichier d'écran n'est modifié).
 *
 * UI-23 : replié, c'est un petit bouton rond (code de la langue active) posé
 * dans le coin bas ; il ne s'ouvre qu'au clic (ou au clavier) pour proposer
 * AR / FR, se referme après le choix, sur Échap ou sur un clic extérieur.
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

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "i18n-test-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "i18n-test-panel");
  toggle.setAttribute("aria-label", "Langue de l'interface (test)");
  toggle.title = "Langue de l'interface (test)";
  box.appendChild(toggle);

  const panel = document.createElement("div");
  panel.id = "i18n-test-panel";
  panel.className = "i18n-test-panel";
  panel.hidden = true;
  box.appendChild(panel);

  const badge = document.createElement("span");
  badge.className = "i18n-test-badge";
  badge.textContent = "test";
  panel.appendChild(badge);

  const setOpen = (open: boolean, restoreFocus = false) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    box.classList.toggle("is-open", open);
    if (!open && restoreFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  box.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      e.stopPropagation();
      setOpen(false, true);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!panel.hidden && !box.contains(e.target as Node)) setOpen(false);
  });

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
      setOpen(false, true);
    });
    panel.appendChild(b);
    return b;
  });

  const sync = () => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.lang === get()));
    toggle.textContent = get().toUpperCase();
  };
  sync();
  document.body.appendChild(box);
}
