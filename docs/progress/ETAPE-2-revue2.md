# Étape 2 — revue adversariale du durcissement : avancement

Branches :
- `fix/revue-durcissement` (depuis `origin/feat/durcissement` 9e4f601), worktree `/home/user/wt-revue2` ;
- `fix/revue-durcissement-lot0` (depuis `origin/fix/revue-securite-lot0` 3a719e9), worktree `/home/user/wt-revue2-lot0`.

Décisions : `docs/DECISIONS.md` à partir de D65. Rapport : `docs/revues/REVUE-SECURITE-DURCISSEMENT.md`.

Commandes (conteneur à proxy, toujours sous verrou) :
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:e2e`
- `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run test:hosting`
- workflows : `actionlint` (binaire dans le scratchpad de la session) et
  `zizmor --offline .github/workflows/` (`pip install --user zizmor`).

## Fait (poussé)
Numérotation : D52–D64 pris sur `main` (design, workflows de mise en prod) ; revue = D65–D73 sur MT ;
Lot 0 = D54 (R-07), D55 (R-06) (D53 pris par `release/lot0`).
- D65 R-07 (MT + Lot 0 D54) ; D66 migration staffPrivate ; D67 quotas IA + no-store ;
  D68 workflows ; D69 sauvegardes ; D70 garde-fou build App Check ; D71 R-06 Lot 0
  (Lot 0 D55) ; D72 super-admin jamais désactivé automatiquement ; D73 import CSV.
- Rapport `docs/revues/REVUE-SECURITE-DURCISSEMENT.md` (14 constats, verdict).
- `docs/runbooks/NOUVELLE-ECOLE.md`, `scripts/admin/import-students.ts` + tests.
- Tests MT (b651d3b) : lint OK/OK, build OK, unitaires 68/68, émulateurs 252 + 2
  ignorés, Functions 45/45 ; Playwright 11/11 (d5ec153) ; Hosting 5/5 (e3ee428).
- Lot 0 (8fe8ab2) : lint OK/OK, build OK, unitaires 29/29, émulateurs 221 + 4 ignorés, Functions 8/8.

## En cours
- Partie 2 : `docs/communication/`.

## Suivant
1. `docs/conformite/CNDP.md`.
2. `CLAUDE.md` (architecture et commandes, INTERDITS intacts).
3. Relancer Playwright et test:hosting, mettre à jour §7 du rapport, réponse finale.

## Prochaine action exacte
Rédiger `docs/communication/identifiants.md`, `maintenance.md`, `guide-directeur.md`.
