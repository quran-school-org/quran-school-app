# Étape 2 — découpage (Lot 2) et nouveau design : avancement

Mis à jour à chaque écran. Reprise : lire ce fichier, puis `docs/DECISIONS.md` (D42+ ; D34-D41 = revue de sécurité).

## Partie 1 — `refactor/decoupage-app` (sans changement de comportement)
- [x] Repères `data-*` et tests e2e par rôle et par écran (`tests/e2e/screens.spec.ts`)
- [x] Captures de référence `docs/design/captures/avant/` (`npm run capture:screens`)
- [x] Logique d'App.tsx en hooks (`src/app`, `src/data`, `src/session`)
- [x] Écrans, fenêtres, cadre (`src/screens`, `src/shell`), impressions (`src/print`)
- [x] Modules comptabilité / activités / personnel / paramètres découpés
- [x] Comparaison pixel à pixel avant / après : identique (hors animations, ordre des membres)

## Partie 2 — `feat/design`
Décisions : D46 à D50 dans `docs/DECISIONS.md`.

| Écran / chantier | État |
|---|---|
| Jetons `@theme`, polices, focus doré, bordure par défaut | fait |
| Composants `src/ui` (AppShell, SideNav, Topbar, Modal, Form, DataTable, Kpi, Bars, Pill, HifzMap…) | fait |
| Cadre : menu groupé, barre du haut, sélecteur d'école, bandeau quota, menu mobile | fait |
| Tableau de bord (carte des 60 أحزاب, KPI, محفّظون, تحتاج إجراءً, حضور, تقدّم الحلقات) | fait |
| Élèves : liste, dossier, carte, fenêtre d'inscription | fait |
| Personnel : en-tête, indicateurs, filtres (liste et fenêtres : harmonisation) | fait (partiel) |
| Frais et paiements + fenêtre de saisie | fait |
| Harmonisation automatique des écrans hérités (surfaces, champs 44 px, boutons) | fait |
| Présences (+ scan QR, rapport mensuel) | à faire |
| Examens et شهادات (+ fenêtre de note) | à faire |
| Comptabilité (sections) | à faire |
| Activités | à faire |
| Halaqas (ClassManagement) | à faire |
| Notifications | à faire |
| Cartes QR (laboratoire) | à faire |
| Paramètres, utilisateurs, matrice des droits | à faire |
| Portail enseignant / parent / élève, fenêtre de profil | à faire |
| Connexion, vérification de session, choix / création d'école | à faire |
| Impressions (reçu, attestation, rapports, cartes, présence mensuelle) + @media print | à faire |
| Captures « après » 1440 / 390 + `docs/design/AVANCEMENT.md` | à faire |

## Prochaine action
Écran des présences : `src/screens/AttendanceScreen.tsx` et `src/screens/modals/MonthlyReportModal.tsx`
(PageHeader, KpiGrid, SegmentedControl, DataTable ; supprimer les émojis ; garder les `data-*`).

## Commandes utiles
- Tests : `npm run lint && npm run build && npm test`, puis
  `flock /home/user/.emulators.lock npm run test:e2e`.
- Captures : `CAPTURE_DIR=/chemin/absolu flock /home/user/.emulators.lock npm run capture:screens`
  (PNG ; conversion en JPEG pour `docs/design/captures/`).
