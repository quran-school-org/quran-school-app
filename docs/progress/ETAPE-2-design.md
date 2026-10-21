# Étape 2 — découpage (Lot 2) et nouveau design : avancement

Mis à jour à chaque écran. Reprise : lire ce fichier, puis `docs/DECISIONS.md` (D34+).

## Partie 1 — `refactor/decoupage-app` (sans changement de comportement)
- [x] Repères `data-*` et tests e2e par rôle et par écran (`tests/e2e/screens.spec.ts`)
- [x] Captures de référence `docs/design/captures/avant/` (`npm run capture:screens`)
- [x] Logique d'App.tsx en hooks (`src/app`, `src/data`, `src/session`)
- [x] Écrans, fenêtres, cadre (`src/screens`, `src/shell`), impressions (`src/print`)
- [x] Modules comptabilité / activités / personnel / paramètres découpés
- [x] Comparaison pixel à pixel avant / après : identique (hors animations, ordre des membres)

## Partie 2 — `feat/design`
Voir la liste des écrans ci-dessous.

| Écran | État |
|---|---|
| Jetons, polices | à faire |
| Composants `src/ui` | à faire |
| Cadre (menu, barre du haut, sélecteur d'école) | à faire |
| Tableau de bord | à faire |
| Élèves, personnel, halaqas, présences, examens, frais, comptabilité, activités, notifications, cartes, paramètres | à faire |
| Connexion, choix d'école, portails, fenêtres | à faire |
| Impressions | à faire |

## Prochaine action
Créer `feat/design` depuis `refactor/decoupage-app`.

## Commandes utiles
- Tests : `npm run lint && npm run build && npm test`, puis
  `flock /home/user/.emulators.lock npm run test:e2e`.
- Captures : `CAPTURE_DIR=/chemin/absolu flock /home/user/.emulators.lock npm run capture:screens`
  (PNG ; conversion en JPEG pour `docs/design/captures/`).
