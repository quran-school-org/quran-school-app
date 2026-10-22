# Étape 2 — découpage (Lot 2) et nouveau design : avancement

Mis à jour à chaque écran. Reprise : lire ce fichier, puis `docs/DECISIONS.md` (D52+ ; D42-D51 = durcissement ; D34-D41 = revue de sécurité).

## Partie 1 — `refactor/decoupage-app` (sans changement de comportement)
- [x] Repères `data-*` et tests e2e par rôle et par écran (`tests/e2e/screens.spec.ts`)
- [x] Captures de référence `docs/design/captures/avant/` (`npm run capture:screens`)
- [x] Logique d'App.tsx en hooks (`src/app`, `src/data`, `src/session`)
- [x] Écrans, fenêtres, cadre (`src/screens`, `src/shell`), impressions (`src/print`)
- [x] Modules comptabilité / activités / personnel / paramètres découpés
- [x] Comparaison pixel à pixel avant / après : identique (hors animations, ordre des membres)

## Partie 2 — `feat/design`
Décisions : D56 à D62 dans `docs/DECISIONS.md`.

| Écran / chantier | État |
|---|---|
| Jetons `@theme`, polices, focus doré, bordure par défaut | fait |
| Composants `src/ui` (AppShell, SideNav, Topbar, Modal, Form, DataTable, Kpi, Bars, Pill, HifzMap…) | fait |
| Cadre : menu groupé, barre du haut, sélecteur d'école, bandeau quota, menu mobile | fait |
| Tableau de bord (carte des 60 أحزاب, KPI, محفّظون, تحتاج إجراءً, حضور, تقدّم الحلقات) | fait |
| Élèves : liste, dossier, carte, fenêtre d'inscription | fait |
| Personnel : en-tête, indicateurs, filtres (liste et fenêtres : harmonisation) | fait |
| Frais et paiements + fenêtre de saisie | fait |
| Harmonisation automatique des écrans hérités (surfaces, champs 44 px, boutons) | fait |
| Présences (+ scan QR, relevé mensuel et son impression) | fait |
| Examens et شهادات (+ fenêtre de note) | fait (impression de l'attestation : avec les impressions) |
| Comptabilité (en-tête, indicateurs, sections, fenêtres) | fait |
| Activités (en-tête, indicateurs, liste ; espace de travail et fenêtres : harmonisation) | fait |
| Halaqas (ClassManagement) + fenêtre | fait |
| Notifications | fait |
| Cartes QR (laboratoire) | fait (gabarits de cartes : déjà refaits avec les élèves) |
| Paramètres, utilisateurs, matrice des droits | fait |
| Portail enseignant, fenêtre de profil (parent et élève : écrans communs déjà refaits) | fait |
| Connexion, vérification de session, choix / création d'école | fait |
| Impressions (reçu, attestation, rapports, cartes, présence mensuelle) + @media print | fait (tests/e2e/print.spec.ts) |
| Personnel : icônes de catégories, libellés sans émojis | fait |
| Test mobile 360 px (`tests/e2e/mobile.spec.ts`) | fait |
| QR locaux (O-05, `tests/e2e/qr.spec.ts`) ; impressions sans script ni CDN (D62) | fait |
| Captures « après » 1440 / 390 + `docs/design/AVANCEMENT.md` | fait |

## Prochaine action
Partie 2 terminée. Reste hors périmètre interface : constats F1, F5, téléphone par
défaut codé en dur dans la logique du personnel et des activités (D61), CSP (D62) ;
report des changements de `feat/durcissement` par l'agent d'intégration.

## Commandes utiles
- Tests : `npm run lint && npm run build && npm test`, puis
  `flock /home/user/.emulators.lock npm run test:e2e`.
- Captures : `CAPTURE_DIR=/chemin/absolu flock /home/user/.emulators.lock npm run capture:screens`
  (PNG ; conversion en JPEG pour `docs/design/captures/`).
