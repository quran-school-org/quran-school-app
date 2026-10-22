# Étape 2 — intégration `feat/design` + `main` (durcissement) : avancement

Branche `integration/design` (worktree `/home/user/wt-integration`). Reprise : lire ce
fichier, puis `docs/DECISIONS.md` (D42-D51 durcissement, D52-D62 découpage et design,
D63 intégration).

| Étape | État |
|---|---|
| Renumérotation des décisions du design (D42-D52 → D52-D62) | fait (51730c9) |
| Fusion `origin/main` (conflits DECISIONS, package.json, App.tsx) | fait (a2bfba7) |
| Report des changements d'App.tsx du durcissement dans les hooks | fait (useSchoolSync, useAiActions) |
| Tests e2e de main adaptés (smoke R-06, csp) | fait |
| CSP : CDN Tailwind et qrserver retirés ; Google Fonts conservé ; `index.html` générique | fait (b20a090) |
| F1 (profil du directeur et paramètres par défaut) + `tests/e2e/settings-f1.spec.ts` | fait (66ec937) |
| F5 (`مبتدئ` retiré du portail enseignant) | fait (2f7efd4) |
| Téléphone « 06.74.633.108 » codé en dur | fait (dc85e0c) |
| Mot de passe par défaut « 123 » dans l'écran des utilisateurs | fait (d0b4948) |
| Personnel : aucune fiche RH hors bureau (fiches synthétiques) + `tests/e2e/integration.spec.ts` | fait (ed97636) |
| D63, `CLAUDE.md` | fait |
| Vérification complète (lint, build, tests, e2e, captures) | en cours |
| Push | à faire |

## Commandes
- `npm run lint && npm run lint:functions && npm run build && npm test`
- `flock /home/user/.emulators.lock npm run test:rules` (puis `test:hosting`, `test:e2e`)
- Captures de contrôle : `CAPTURE_DIR=/abs flock /home/user/.emulators.lock npx firebase emulators:exec --only auth,firestore,functions --project demo-quran-school "npm run seed:emulator && E2E_CSP=1 npx playwright test tests/e2e/integration.spec.ts"`
