# Plan — remettre de l'ordre dans la structure (octobre 2026)

But : rendre le projet carré pour durer, puisqu'il va devenir l'outil de suivi
quotidien de deux écoles coraniques. On s'appuie sur le travail déjà fait par
Mélik (découpage de `App.tsx`, hooks par domaine, accès Firestore centralisé,
règles et tests, runbooks, décisions), sans le refaire.

## Constat de départ (24/10/2026)

| Sujet | État | Conséquence |
|---|---|---|
| README | absent à la racine | un nouvel arrivant ne sait pas par où commencer (il y a `CLAUDE.md` et `docs/PASSATION.md`) |
| Vérification TypeScript du front | `strict` désactivé, `@types/react` non installé (`src/jsx-shim.d.ts` le contourne) | tout le JSX est typé `any` : `npm run lint` laisse passer presque toutes les erreurs d'interface (6 516 erreurs en mode strict, dont 5 836 « JSX implicite any ») |
| Back-end (Functions) | `strict: true` | bon niveau, rien à changer |
| Style de code | ni ESLint ni Prettier | pas de garde contre les erreurs courantes (hooks React, promesses oubliées) |
| Couche de données | `src/db.ts` (« RealmSimDB », hérité d'AI Studio) : écrit d'abord dans le navigateur, puis la fiche **entière** dans Firestore ; 90 appels dans 14 fichiers | une fiche ouverte depuis longtemps peut écraser une modification faite entre-temps (ex. l'enseignant qui réécrit `isArchived`) |
| Logique métier | dans les hooks d'écran (`src/app/actions/*`), notifications construites à la main à chaque endroit | difficile à tester, cause de la fuite A-01 |
| Modèles | `src/types.ts` (721 lignes) mêle modèles, rôles et matrice de droits | fichier central qui grossit |
| Rangement | écrans dans `src/screens/` et dans `src/components/` | convention à écrire |
| HTML (3 % sur GitHub) | maquettes de design `design/*.dc.html`, pas du code de l'app | à ranger dans `docs/design/` ou signaler dans le README |
| Temporaire | `src/i18n-test/` (traduction FR de test, 2 040 lignes), photos en base64 dans Firestore | retraits déjà prévus (D79, D51) |

## Règles pour ce chantier

- **La bascule passe avant tout.** Avant la bascule, seulement des
  changements sans effet sur le comportement (doc, types, outils). Les
  refontes de code viennent **après** la bascule, pour ne pas gêner les
  répétitions de migration.
- Une branche et une PR par jalon, relue par Mélik, CI verte, une entrée dans
  `docs/DECISIONS.md` pour chaque choix structurant.
- Pas de grand reformatage qui toucherait tous les fichiers sans accord de
  Mélik (il créerait des conflits avec son travail en cours).
- Aucun changement de design ni de comportement visible sans accord.

## Jalons

### S0 — README et carte de la documentation (avant la bascule)
Objectif : qu'on comprenne le projet en 5 minutes.
- `README.md` : ce que fait l'app, pour qui, captures, démarrage local en
  5 commandes, architecture en un schéma, liens vers `CLAUDE.md`,
  `PASSATION.md`, `DECISIONS.md`, runbooks, et l'historique du projet
  (AI Studio, puis la reprise menée par Mélik).
- `docs/README.md` : index de `docs/` (qui lit quoi, quand).
- Maquettes `design/*.dc.html` rangées ou signalées.

Fini quand : README relu par Mélik ; aucun fichier de code touché.

### S1 — TypeScript vérifie vraiment le front (avant la bascule)
Objectif : que `npm run lint` attrape les erreurs d'interface.
- Installer `@types/react` et `@types/react-dom` (versions de React 19), retirer
  `src/jsx-shim.d.ts`, corriger les erreurs qui apparaissent (types seulement,
  aucun changement de comportement).
- Ajouter un contrôle « strict » séparé, non bloquant au début, avec un
  compteur d'erreurs qui ne doit que baisser ; puis passer `strict: true`
  module par module.

Fini quand : `npm run lint` passe avec les vrais types React, CI verte, tests
identiques ; le compteur strict est publié dans la CI.

### S2 — ESLint et Prettier (après la bascule)
Objectif : garde-fous automatiques sur les erreurs courantes.
- ESLint (règles React Hooks, promesses non attendues, imports) en CI,
  d'abord en avertissement.
- Prettier appliqué en **un seul commit** à un moment convenu avec Mélik.

Fini quand : CI bloquante sur ESLint, code formaté, aucune régression.

### S3 — Couche de données propre (après la bascule)
Objectif : plus d'écrasement de fiche, une seule façon d'écrire.
- Remplacer les écritures de fiche entière par des mises à jour des seuls
  champs modifiés.
- Un module par domaine (élèves, présences, paiements…) au-dessus de
  `src/firebase.ts`, qui remplace `RealmSimDB` petit à petit : une collection
  par PR, en commençant par les élèves.
- Décider du rôle du cache local (lecture hors ligne seulement ?) et le
  documenter.

Fini quand : `RealmSimDB` n'est plus appelé par les écrans ; tests
unitaires par module ; test e2e « deux personnes modifient la même fiche ».

### S4 — Logique métier hors des écrans (après la bascule)
Objectif : des règles métier testables, au même endroit.
- Notifications : un seul module qui décide du message et des destinataires
  (corrige A-01, prépare l'amélioration U-03).
- Finances, présences, notes : fonctions pures + tests, appelées par les
  hooks.

Fini quand : `src/app/actions/*` ne contient plus de règle métier, seulement
de l'orchestration ; couverture de tests sur ces modules.

### S5 — Rangement (après S3 et S4)
Objectif : une arborescence qu'on comprend sans guide.
- `types.ts` découpé par domaine (avec un fichier qui réexporte tout, pour ne
  casser aucun import).
- Convention écrite `screens/` (pages) / `components/` (morceaux d'écran) /
  `ui/` (charte), ou regroupement par fonctionnalité (`features/élèves/…`) :
  à décider avec Mélik.
- Sort de la matrice de droits selon la décision D-01 de l'audit.

Fini quand : convention écrite dans le README et `CLAUDE.md`, déplacements
faits, CI verte.

### S6 — Nettoyage après la bascule
- Retrait de `src/i18n-test` (procédure D79), ou décision d'une vraie
  traduction.
- Photos vers Cloud Storage (D51).
- `package.json` : nom et version (`1.0.0` à la bascule), `CHANGELOG.md`.

Fini quand : plus de code temporaire dans `src/`, version 1.0.0 publiée.

## Ordre proposé
S0 et S1 tout de suite (sans risque pour la bascule) ; les correctifs de
sécurité retenus par Mélik dans l'audit ; puis S2 à S6 après la bascule,
dans l'ordre.
