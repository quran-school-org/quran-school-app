# Étape 2 — revue adversariale du durcissement : avancement

Branches :
- `fix/revue-durcissement` (depuis `origin/feat/durcissement` 9e4f601), worktree `/home/user/wt-revue2` ;
- `fix/revue-durcissement-lot0` (depuis `origin/fix/revue-securite-lot0` 3a719e9), worktree `/home/user/wt-revue2-lot0`.

Décisions : `docs/DECISIONS.md` à partir de D52. Rapport : `docs/revues/REVUE-SECURITE-DURCISSEMENT.md`.

Commandes (conteneur à proxy, toujours sous verrou) :
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`
- `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run test:hosting`

## Fait
- Lecture : CLAUDE.md, rapport §6, revue précédente, D34–D51, runbooks.
- Installation des deux worktrees.

## En cours
- Partie 1 : revue du diff `fix/revue-securite..feat/durcissement`.

## Suivant
1. R-07 (règles + tests) sur les deux branches.
2. R-06 Lot 0 : évaluer la mesure minimale.
3. Correctifs de la revue (migration staffPrivate, workflows, api no-store…).
4. Rapport de revue.
5. Partie 2 : NOUVELLE-ECOLE.md (+ import CSV), communication, CNDP, CLAUDE.md.

## Prochaine action exacte
Écrire les tests R-07 dans `tests/emulator/revue-rules.test.ts` (MT).
