# Étape 2 — revue de sécurité adversariale : avancement

Branches : `fix/revue-securite` (depuis `feat/multi-tenant`, worktree `/home/user/wt-revue`),
`fix/revue-securite-lot0` (depuis `fix/lot0-securite`, worktree `/home/user/wt-revue-lot0`).
Rapport final : `docs/revues/REVUE-SECURITE-ETAPE-2.md`.

## Fait
- Lecture : CLAUDE.md, rapport d'étape 1, décisions, analyse §3/§4/§10, runbooks.
- Revue du code : règles (multi-écoles et Lot 0), Functions, session client, scripts, runbooks.
- Base de référence : `test:rules` = 190 réussis, 2 échecs (triggers de bout en bout,
  à lancer avec `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` dans ce conteneur, D21).

## En cours
- Tests de démonstration des hypothèses (scripts, Functions, client).

## Suivant
- Correctifs + non-régression, portage Lot 0, rapport, verdict.
