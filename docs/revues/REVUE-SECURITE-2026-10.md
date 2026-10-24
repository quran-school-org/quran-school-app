# Revue de sécurité — octobre 2026 (audit complet du dépôt)

> Date : 24/10/2026. Faite par Elias avec Claude Code (skill `security-audit`,
> profil standard). Code revu : `main` au commit `9a502d3`, branche de travail
> `audit/securite-ux`.
>
> **Aucune action sur la prod ni sur le dev** : aucun déploiement, aucune
> connexion, aucun appel aux projets `gen-lang-client-0481880143` et
> `fajr-c4c6e`. Analyse du code, puis preuves sur les émulateurs locaux
> (`demo-quran-school`, données fictives). Seuls des appels `gh api` en lecture
> ont servi à constater la configuration GitHub.
>
> Revues précédentes : `REVUE-SECURITE-ETAPE-2.md`, `REVUE-SECURITE-DURCISSEMENT.md`.
> Leurs constats corrigés n'ont pas été re-signalés.

## 1. En bref

- **Les protections principales tiennent.** Aucune lecture ni écriture d'une
  école vers une autre. Un parent ne voit que ses enfants. Les fiches RH restent
  au bureau. Les callables de comptes vérifient bien l'école et le rôle. Les
  impressions sont échappées. Le cache local est purgé à la déconnexion. Les
  sauvegardes ne suppriment que leurs propres exports. Aucun secret n'est
  commité.
- **6 constats confirmés** : 2 moyens, 4 faibles ; aucun critique ni élevé.
- **1 point à vérifier** par le propriétaire (droits des jetons d'automatisation
  sur GitHub), à régler **avant la bascule**.

| N° | Gravité | Constat | Preuve |
|---|---|---|---|
| A-01 | **Moyenne** | Les notifications automatiques recopient salaires, paiements, recettes, dépenses, notes et absences ; **tout le personnel** les lit (entretien, bénévole, enseignant…) | test émulateur |
| A-02 | **Moyenne** | Un **إداري** peut suspendre un **directeur** (et désactiver son compte) en archivant la fiche du personnel liée à ce directeur | test émulateur |
| A-03 | Faible | Le directeur d'une école peut rattacher, sans accord, un compte d'une autre école ; le directeur d'origine ne peut alors plus réinitialiser son mot de passe | test émulateur |
| A-04 | Faible | Un membre (même un parent) peut écrire n'importe quel type ou une taille énorme dans son propre nom → l'écran des comptes du bureau plante | test émulateur (règles) + code |
| A-05 | Faible | Export CSV : injection de formules (`=HYPERLINK(…)`) depuis des champs qu'un enseignant peut écrire | code |
| A-06 | Faible | CI : si la clé GPG est inutilisable, les mots de passe temporaires et les rapports sont envoyés **en clair** comme artefacts | code |
| A-07 | à vérifier | CI : sans protection de branche (forfait GitHub Free), tout jeton qui peut pousser sur `main` obtient les identités Google des workflows | configuration GitHub |

Les tests de preuve sont dans `tests/emulator/audit-2026-10.test.ts`. Ils
décrivent le comportement **actuel** : ils échoueront quand le constat sera
corrigé, et devront alors être inversés en tests de non-régression.

## 2. Constats confirmés

### A-01 — Données financières et RH visibles de tout le personnel via les notifications (moyenne)
- **Où** : `src/app/actions/useFinanceActions.ts:17,29,41`,
  `src/app/actions/useGradePaymentActions.ts:82,110,181`,
  `src/app/actions/useAttendanceActions.ts:58,93` → `src/app/useCore.ts:101`
  (`addSysNotification`) → `schools/{s}/notifications`, lisible par `isStaff`
  (`firestore.rules:258`).
- **Qui** : tout membre du personnel hors bureau (عامل نظافة / صيانة, متطوع,
  أخرى, مدرس, مؤطر).
- **Résultat observé** : l'agent d'entretien et le bénévole se voient refuser
  `salaryPayments`, mais lisent la notification « تم تسجيل مستحق … لمبلغ 1800 د.م. ».
- **Pourquoi c'est important** : salaires (D42 les réserve au bureau), montants
  payés par chaque famille, notes et absences d'élèves nommés.
- **Correctif minimal** : notifications de type `مالي` lisibles par le bureau
  seulement (`allow read: if isOffice(s) || (isStaff(s) && resource.data.type != 'مالي')`,
  et requête côté client avec `where('type','!=','مالي')` pour les autres) ; retirer montants et
  noms d'élèves des messages ; nettoyer les notifications existantes. Voir aussi
  la proposition UX P3 (destinataires par type, statut « lu » par personne).

### A-02 — Un administratif peut suspendre un directeur (moyenne)
- **Où** : `firestore.rules:168` (les fiches `teachers` sont modifiables par
  `isOffice`) → trigger `syncAccountsOnTeacherArchive`
  (`functions/src/tenant/archiveSync.ts:58-73`), qui suspend tout membre lié
  (`linkedTeacherId`) sauf les familles et le seul directeur historique `u1`.
- **Conditions** : un directeur (autre que `u1`) lié à une fiche du personnel.
  C'est courant : le provisionnement du Lot 0 lie par le nom, et le formulaire
  de compte propose ce lien.
- **Résultat observé** : après archivage de la fiche, le directeur passe
  `isActive=false` et son compte Firebase est désactivé (s'il n'a pas d'autre
  école). Or `setMemberRole`, le seul chemin prévu pour suspendre, est réservé au
  directeur. Le directeur suspendu ne peut pas se rétablir lui-même.
- **Correctif minimal** : dans le trigger, ne jamais suspendre un membre de rôle
  `مدير` (ces comptes ne changent que par `setMemberRole`) ; en option, exiger
  `isDirector` dans les règles pour changer `isArchived` d'une fiche du personnel.

### A-03 — Rattachement d'un compte d'une autre école sans accord (faible)
- **Où** : `functions/src/tenant/accounts.ts:187-205` (`attachExisting`), effet
  sur `resetUserPasswordCore` (l. 263-270).
- **Résultat observé** : après le rattachement par l'école B, le directeur de
  l'école A (non super-admin) reçoit `permission-denied` pour réinitialiser le
  mot de passe de son propre enseignant. Aucun accès aux données de A, aucune
  prise de contrôle du compte.
- **Correctif minimal** : refuser `attachExisting` quand le compte appartient
  à une école que l'appelant ne dirige pas, sauf pour le super-admin (ou passer
  par une invitation acceptée par la personne). D24 (un compte, plusieurs
  écoles) reste possible.

### A-04 — Nom de membre sans contrôle de type ni de taille (faible)
- **Où** : `firestore.rules:144-146` (mise à jour de son propre
  `members/{uid}` : seules les clés sont vérifiées) →
  `src/components/settings/useSettingsState.tsx:102`
  (`(user.fullName || '').toLowerCase()`), sans `ErrorBoundary`.
- **Résultat observé** : un parent écrit `fullName = {objet}` ou un texte de
  900 Ko ; les règles acceptent. D'après le code, l'écran Paramètres › المستخدمين
  du bureau plante alors (plantage non exécuté).
- **Correctif minimal** : `fullName is string && size() <= 120`, `phone` ≤ 40,
  `lastLogin` ≤ 40 dans la règle ; `String(...)` côté client ; un `ErrorBoundary`.

### A-05 — Injection de formules dans les exports CSV (faible)
- **Où** : `src/app/actions/useExportBackupActions.ts:58`,
  `src/app/actions/useGradePaymentActions.ts:261`. Les champs d'élève sont
  modifiables par tout enseignant.
- **Correctif minimal** : une fonction `csvCell` commune qui préfixe d'une
  apostrophe les valeurs commençant par `=`, `+`, `-`, `@`, tabulation ou retour
  chariot ; test unitaire.

### A-06 — Chiffrement des artefacts de `ops.yml` : échec ouvert (faible)
- **Où** : `.github/workflows/ops.yml:494-542`. Si l'import de la clé ou le
  chiffrement échoue, l'étape s'arrête **avant** de chiffrer, puis les deux
  envois d'artefacts s'exécutent quand même (`if: always()`).
- **Conditions** : clé `ARTIFACT_GPG_PUBLIC_KEY` mal collée, expirée, révoquée
  ou sans sous-clé de chiffrement.
- **Correctif minimal** : conditionner les envois au succès du chiffrement
  (`steps.<id>.outcome == 'success'`) ; ne supprimer les fichiers en clair
  qu'après un chiffrement réussi ; tester la clé dans « Garde-fous » avant toute
  action.

## 3. Point à vérifier par le propriétaire

### A-07 — Qui peut pousser sur `main` obtient les identités Google des workflows
Constaté en lecture (`gh api`, 24/10/2026) : dépôt privé au forfait GitHub
Free (protection de branche et rulesets indisponibles, HTTP 403) ; aucune
branche protégée ; 3 collaborateurs, tous admin ; aucune variable `PROD_*` ni
environnement (la prod n'est pas encore branchée aux workflows).

La condition WIF fait confiance à tout fichier de workflow présent sur `main`.
Tant que seuls les 3 admins peuvent pousser, c'est voulu. Cela devient une
faille si un **jeton d'automatisation** (agent orchestrateur de
`docs/runbooks/OPERATIONS-CLAUDE.md`, application GitHub, clé de déploiement)
a le droit d'écrire le contenu du dépôt. Il pourrait alors modifier un workflow
sur `main`, le lancer et agir en tant que `github-ops` sur le dev (copie des
données réelles), puis sur la prod après la bascule.

À vérifier (lecture seule) avant de poser les variables `PROD_*` :
1. clés de déploiement en écriture : `gh api repos/quran-school-org/quran-school-app/keys` ;
2. applications installées sur l'organisation et leurs droits ;
3. droits du jeton utilisé par l'agent orchestrateur. Idéalement, il n'a que
   `actions:write` et pas `contents:write` : il peut lancer les workflows, mais
   pas les modifier.

Durcissements possibles : lier la condition WIF à `job_workflow_sha` ; passer
à un forfait avec protection de `main` et relecteurs sur l'environnement de prod.

## 4. Hypothèses écartées
- `release/lot0` comme contournement de la condition WIF : aucune personne de
  plus ne peut pousser dessus que sur `main` aujourd'hui (même cause qu'A-07).
- Aperçus Hosting : workflow désactivé en mode Free ; même cause qu'A-07.
- Désarchivage qui réactiverait un compte bloqué : ne s'applique qu'à un blocage
  manuel par la console. Durcissement : mémoriser qui a désactivé le compte.

## 5. Durcissements recommandés (sans faille démontrée)
- **La matrice de droits par compte n'est appliquée nulle part côté serveur**
  (choix documenté, D81) : un directeur qui retire un droit à un enseignant
  croit l'avoir fait. À rendre réelle dans les règles, ou à retirer de
  l'interface (voir l'audit UX, P2).
- Un enseignant peut modifier les élèves, présences, notes et suivis de **toute
  l'école** (pas seulement sa halaqa). Il peut aussi archiver un élève, ce qui
  suspend les comptes de la famille.
- Aucun champ « auteur » imposé (`createdBy == request.auth.uid`) : un bénévole
  peut créer une notification « مالي » qui ressemble à une alerte système.
- Les fiches RH (salaire, CIN) du bureau sont mises en cache en clair dans
  `localStorage`. Le cache est purgé à la déconnexion, mais reste sur le disque
  si on ferme le navigateur sans se déconnecter (ordinateur partagé du bureau).
- CSP : `script-src 'unsafe-inline'` à remplacer par des empreintes ou un nonce.
- Scanner QR : rapprochement par `fullName.includes(...)` ; ne garder que l'id
  exact.
- En enregistrant le suivi du hifz, l'enseignant réécrit toute la fiche de
  l'élève (y compris `isArchived`), ce qui peut annuler un archivage fait par le
  bureau.
- `server.ts` écoute sur `0.0.0.0` (développement seulement) : préférer `127.0.0.1`.
- `setMemberRole` (retrait) : utiliser `hasAnyActiveMembership` comme le trigger.

## 6. Méthode et limites
- 6 sous-agents de recherche (règles en lecture, règles en écriture, callables,
  triggers / sauvegardes / API, client, CI et scripts), plus 1 pour l'angle mort
  activités → comptabilité (aucune faille : saisie par les enseignants prévue
  par D14 et D28), puis une vérification indépendante de chaque constat.
- Les preuves sur émulateurs ont été lancées par le parent sur Windows, sans le
  bac à sable OS que demande le skill ; les sous-agents n'ont rien exécuté.
- Les validateurs JSON du skill exigent des primitives POSIX absentes sous
  Windows : non exécutés.
- Les recherches ont tourné en une seule vague ; aucun critique de couverture
  séparé n'a relu le registre : la couverture n'est donc pas déclarée exhaustive.
- Hors périmètre : configuration réelle de GCP (IAM, WIF, App Check), console
  Firebase, données de la prod et du dev.
