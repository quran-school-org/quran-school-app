# Étape 2 — revue adversariale du durcissement : avancement

Branches :
- `fix/revue-durcissement` (depuis `origin/feat/durcissement` 9e4f601), worktree `/home/user/wt-revue2` ;
- `fix/revue-durcissement-lot0` (depuis `origin/fix/revue-securite-lot0` 3a719e9), worktree `/home/user/wt-revue2-lot0`.

Décisions : `docs/DECISIONS.md` à partir de D52. Rapport : `docs/revues/REVUE-SECURITE-DURCISSEMENT.md`.

Commandes (conteneur à proxy, toujours sous verrou) :
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:e2e`
- `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run test:hosting`
- workflows : `actionlint` (binaire dans le scratchpad de la session) et
  `zizmor --offline .github/workflows/` (`pip install --user zizmor`).

## Fait (Partie 1, poussé)
- D52 R-07 : notifications réservées au personnel (MT + Lot 0).
- D53 : migration, la scission des fiches à la relance ne perd plus de champ RH.
- D54 : quotas IA éprouvés (tests d'attaque), `Cache-Control: private, no-store`.
- D55 : workflows (SHA, env, OIDC confiné, environnement preview), runbook CI, garde-fou `tests/unit/workflows.test.ts`.
- D56 : sauvegardes, suppression bornée aux dossiers d'export ; runbook (export seul, conservation 28 j).
- D57 : build de production refuse un jeton de débogage App Check (`.env.local`).
- D58 : R-06 Lot 0 évalué, pas de mesure courte sûre (documenté MT + Lot 0).
- Rapport `docs/revues/REVUE-SECURITE-DURCISSEMENT.md` (13 constats, verdict).
- Tests au dernier push MT (d5ec153) : lint OK/OK, build OK, unitaires 68/68,
  émulateurs 242 + 2 ignorés, Functions 43/43, Playwright 11/11 ; Hosting 5/5 (e3ee428).
- Lot 0 (c10c3f4) : lint OK/OK, build OK, unitaires 29/29, émulateurs 221 + 4 ignorés, Functions 8/8.

## En cours
- (rien)

## Suivant
1. Partie 2 : `docs/runbooks/NOUVELLE-ECOLE.md` (+ `scripts/admin/import-students.ts` et test).
2. `docs/communication/` (modèles ar/fr, guide du directeur).
3. `docs/conformite/CNDP.md`.
4. `CLAUDE.md` (architecture et commandes, INTERDITS intacts).

## Prochaine action exacte
Rédiger `docs/runbooks/NOUVELLE-ECOLE.md` et évaluer `scripts/admin/import-students.ts`.
