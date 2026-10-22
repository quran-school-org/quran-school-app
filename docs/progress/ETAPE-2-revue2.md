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
Numérotation : D52–D64 pris sur `main` (design, workflows de mise en prod) ;
revue = D65–D74 sur MT ; Lot 0 = D54 (R-07), D55 (R-06) (D53 pris par `release/lot0`).
- D65 R-07 (Lot 0 : D54) ; D66 migration staffPrivate ; D67 quotas IA + no-store ;
  D68 workflows ; D69 sauvegardes ; D70 garde-fou build App Check ; D71 R-06
  Lot 0 (Lot 0 : D55) ; D72 super-admin jamais désactivé ; D73 import CSV ;
  D74 workflows de mise en prod (WIF main + 3 workflows, artefacts chiffrés).
- Fusions : `origin/main` (b27230e), `origin/feat/workflows-ops` (3b4376b), `origin/main` #7 (3e95ad8, arbre inchangé).
- Rapport `docs/revues/REVUE-SECURITE-DURCISSEMENT.md` (16 constats, verdict).
- Partie 2 : `docs/runbooks/NOUVELLE-ECOLE.md`, `scripts/admin/import-students.ts`
  (+ tests), `docs/communication/` (identifiants, maintenance, guide du
  directeur), `docs/conformite/CNDP.md`, `CLAUDE.md`.
- Tests MT (9258aca) : lint OK/OK, build OK, unitaires 92/92, émulateurs 253 + 2
  ignorés, Functions 45/45, Hosting 5/5, Playwright 27/27.
- Lot 0 (d0e3d8c, `release/lot0` fusionnée) : lint OK/OK, build OK, unitaires 29/29, émulateurs 221 + 4 ignorés, Functions 8/8.

## En cours
- (rien)

## Suivant
- Si `main` avance encore : `git merge origin/main`, tests, push.
- Actions humaines : voir le verdict du rapport (§8).

## Prochaine action exacte
Aucune : mission terminée (réponse finale envoyée à l'orchestrateur).
