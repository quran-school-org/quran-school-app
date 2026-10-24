# Plan — audit sécurité, audit fonctionnel et UX (octobre 2026)

Demande de Mélik (24/10/2026) : audit de sécurité, audit fonctionnel, et
propositions pour simplifier l'expérience de chaque métier (directeur,
administratif, enseignant, parent, élève…), dont la création de comptes.

Périmètre et garde-fous :
- **Aucune** commande vers la prod (`gen-lang-client-0481880143`).
- Sur le dev `fajr-c4c6e` : uniquement l'école **Test** (`test1234`). L'école
  « الفجر الجديد » (`alfajr`, copie de données réelles) : on ne lit, n'ajoute,
  ne modifie et ne supprime rien.
- Le travail se fait d'abord en local, sur les émulateurs (`demo-quran-school`,
  données fictives). Le dev ne sert qu'à confirmer, à la main, sur l'école Test.
- Aucun identifiant n'est saisi par Claude sur `fajr-c4c6e.web.app` : si une
  vérification sur le dev est utile, la connexion est faite par une personne.
- Branche `audit/securite-ux`, PR vers `main` seulement sur demande.

Les deux revues de sécurité déjà faites (`docs/revues/`) servent de point de
départ : leurs constats corrigés ne sont pas re-signalés, seulement revérifiés
si le code a changé.

## Jalons

### J0 — Outillage local
Objectif : pouvoir lancer l'app et les tests sur les émulateurs.
- Java 21 (aujourd'hui seul Java 8 est installé : l'émulateur Firestore refuse
  de démarrer) ; Node 22 recommandé (Node 25 installé).
- `npm ci`, `npm ci --prefix functions`, émulateurs, `seed:emulator`, `dev`.

Fini quand : `npm run lint`, `npm test` et `npm run test:rules` passent, et
l'app tourne sur http://localhost:3000 avec les comptes de démo locaux.

### J1 — Audit de sécurité (code)
Objectif : trouver les failles réelles qui franchissent une frontière de
confiance (école ↔ école, rôle ↔ rôle, parent ↔ enfant d'un autre, anonyme ↔
connecté, branche ↔ secrets de CI).
Surfaces : `firestore.rules`, Cloud Functions (`functions/src`), client
(`src/firebase.ts`, session, cache local, impressions, CSP), workflows
GitHub, scripts Admin SDK.
Preuves : analyse du code + tests sur émulateurs (données fictives).

Fini quand : chaque constat a sa preuve (test ou lecture du code), sa gravité
et le correctif proposé ; rapport `docs/revues/REVUE-SECURITE-2026-10.md`.

### J2 — Audit fonctionnel
Objectif : vérifier que chaque rôle peut faire son travail de bout en bout.
Parcours par rôle sur les émulateurs (captures `capture:screens` 1440 et
390 px) : inscription d'un élève, paiement, présence, examen et attestation,
salaire, création de compte, parent qui consulte son enfant.

Fini quand : liste des bugs et blocages, chacun avec ses étapes de
reproduction ; tests e2e verts.

### J3 — Audit UX et propositions
Objectif : que chaque métier voie d'abord ce qui compte pour lui.
- Tableau par rôle : ce qu'il fait au quotidien, ce qu'il voit aujourd'hui,
  ce qui gêne, ce qu'on propose (accueil par rôle, menus réduits, actions
  rapides).
- Zoom sur la création de comptes (gestion des utilisateurs).

Fini quand : document de propositions classées (gain / effort) envoyé à
Mélik pour arbitrage.

### J4 — Corrections
Objectif : corriger les failles et appliquer les propositions retenues par
Mélik, une branche par sujet, avec tests.

Fini quand : PR ouvertes (sur demande), CI verte.
