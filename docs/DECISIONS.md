# Journal des décisions

Chaque entrée : contexte, décision, raison, comment revenir en arrière.
Les décisions D1 à D5 sont les décisions par défaut fixées pour la mission ;
les suivantes ont été prises en cours de route.

## Décisions par défaut de la mission

### D1. Portails parent et élève conservés, avec accès restreint
- **Décision** : les rôles `ولي أمر` et `طالب` gardent leur portail. Ils ne voient
  que les élèves explicitement liés à leur compte (`linkedStudentIds`), contrôlé
  dans l'interface **et** dans les règles Firestore.
- **Raison** : fonctionnalité existante, utilisée (rapport Q5 non tranchée).
- **Retour arrière** : désactiver les comptes concernés (`isActive: false`).

### D2. Nom d'utilisateur unique sur toute la plateforme
- **Décision** : la connexion se fait par nom d'utilisateur (plus par nom complet
  ni téléphone), unique globalement. Email technique déterministe
  `{username}@alfajr.local` pour les comptes existants.
- **Raison** : `signInWithEmailAndPassword` exige un email connu avant toute lecture ;
  aucune table publique de correspondance n'est acceptable (S1).
- **Retour arrière** : aucun besoin côté données ; un index public nom → email
  serait nécessaire pour rétablir la connexion par nom complet (déconseillé).

### D3. Première école : `alfajr`
- Identifiant de l'école n°1 dans `schools/{schoolId}`.

### D4. Valeurs de rôles en arabe conservées
- **Raison** : compatibilité avec les données existantes et l'interface.

### D5. Ancien design conservé
- Aucun changement visuel dans cette mission, sauf un sélecteur d'école simple.

## Socle de développement (branche `chore/socle-dev`)

### D6. `.firebaserc` : `default` = `demo-quran-school`, alias `prod`
- **Raison** : plus aucun `firebase deploy` ne part en prod par défaut.
- **Retour arrière** : remettre `default` sur `gen-lang-client-0481880143` (déconseillé).

### D7. Règles déclarées pour la seule base nommée
- **Décision** : `firebase.json > firestore` est un tableau à **une** entrée, la base
  `ai-studio-a6572431-…`. Un `firebase deploy --only firestore:rules -P prod`
  cible donc bien la base de prod (et non `(default)`, vide).
- **Raison** : l'émulateur Firestore n'applique les règles que si le tableau a une
  seule entrée (`firebase-tools` 15.x : « does not support multiple databases yet ») ;
  il applique alors ces règles à toutes les bases émulées.
- **Conséquence** : un futur projet de dev doit créer une base nommée identique
  (cohérent avec le rapport §4.6 : import de l'export dans une base de même nom).

### D8. Config web publique de la prod versionnée dans `.env.production`
- **Raison** : le build de prod doit rester identique (mêmes valeurs qu'avant,
  auparavant codées en dur dans `src/firebase.ts`). Ce ne sont pas des secrets.
- **Garde-fou** : `VITE_USE_EMULATORS=true` refuse tout projet non `demo-*`.

### D9. Région des Cloud Functions : `europe-west1`
- **Raison** : localisation Firestore inconnue (rapport Q11) ; `europe-west1` est la
  région 2nd gen la plus proche du Maroc. Constante unique `functions/src/config.ts`
  + rewrite `/api/**` de `firebase.json`.
- **Retour arrière** : changer la constante et le rewrite, redéployer.

### D10. npm seul ; lockfile resynchronisé sur `firebase@12.16.0`
- **Constat** : `package-lock.json` ne contenait pas `firebase` (désynchronisé, `npm ci`
  échouait) ; `bun.lock` le résolvait en 12.16.0.
- **Décision** : suppression de `bun.lock`, lockfile npm régénéré en épinglant la
  même version que `bun.lock` (12.16.0) pour limiter l'écart avec la prod.

### D11. Limite de l'environnement d'agent : rewrite Hosting → Functions
- Dans le conteneur de l'agent, l'émulateur Hosting renvoie 502 sur `/api/**` :
  `firebase-tools` (apiv2) envoie ses requêtes vers le proxy sortant `HTTPS_PROXY`
  sans respecter `NO_PROXY`, y compris vers `127.0.0.1`. La fonction répond
  correctement en direct (`http://127.0.0.1:5001/demo-quran-school/europe-west1/api/health`).
  Sur un poste de développeur sans proxy, le rewrite fonctionne normalement.

## Lot 0 — correctif de sécurité (branche `fix/lot0-securite`)

### D12. Lien d'autorisation `authLinks/{uid}`
- **Décision** : les règles lisent `authLinks/{request.auth.uid}` =
  `{ appUserId, role, isActive, linkedStudentIds, linkedTeacherId }`. Sans lien
  actif, un compte Auth n'accède à rien. Écriture : script Admin SDK, Cloud
  Functions ou directeur (règles). `appUsers` reste le profil affiché ; le lien
  fait foi pour le rôle et le statut (le client les fusionne à la connexion).
- **Pourquoi pas des custom claims** : modifiables sans Admin SDK par le
  directeur depuis l'interface, pas de rafraîchissement de jeton à gérer.
- **Retour arrière** : anciennes règles (runbook §7).

### D13. Finances fermées aux familles en Lot 0
- **Décision** : `payments` et les autres finances ne sont lisibles que par
  مدير / إداري, comme exigé. L'onglet « سجل الرسوم » des parents est vide en Lot 0.
- **Retour** : la branche multi-tenant ouvre la lecture des paiements des
  enfants liés (requête filtrée + règle).

### D14. Périmètre des rôles dans les règles du Lot 0
- Pédagogie (مدير, إداري, مؤطر, مدرس) : lecture des élèves, présences, notes,
  suivi, personnel, activités ; écriture de la pédagogie. Bureau : finances,
  personnel, suppressions. Directeur : paramètres, comptes, liens.
- Personnel non pédagogique (متطوع, عامل نظافة / صيانة, أخرى) : **aucun** accès
  aux dossiers des élèves ni aux finances (rapport §10.2) ; lecture des
  halaqas, activités, notifications. Leur tableau de bord affiche donc des zéros.
- Familles : dossiers liés uniquement (lecture document par document), présences,
  notes et suivi filtrés sur `studentId` ; ni notifications (globales, elles
  citent d'autres élèves), ni personnel.
- **Limite connue** : les enseignants lisent encore toute la collection
  `teachers` (salaires, CIN) car l'interface en a besoin pour les noms ; à
  scinder plus tard (fiche publique / fiche RH).

### D15. Gestion des comptes par Cloud Functions callables
- `createUserAccount` et `resetUserPassword`, réservées au directeur actif
  (vérifié dans `authLinks`). L'option « instance Firebase secondaire côté
  client » n'est pas retenue : elle ne permet pas de réinitialiser le mot de
  passe d'autrui et laisse l'inscription client nécessaire.
- Changement de son propre mot de passe : `updatePassword` (avec
  réauthentification si la session est ancienne).
- Nouveaux mots de passe : 8 caractères minimum. Tous les comptes provisionnés
  ou réinitialisés doivent changer leur mot de passe (`mustChangePassword`).

### D16. « Archivage = compte suspendu » assuré côté serveur
- Triggers `syncAccountsOnTeacherArchive` / `syncAccountsOnStudentArchive` :
  suspendent `appUsers`, `authLinks` **et** le compte Firebase Auth ; un parent
  n'est suspendu que si tous ses enfants liés sont archivés ; `u1` jamais touché ;
  à la désarchivation, seuls les comptes suspendus par archivage sont réactivés.
- **Raison** : un إداري peut archiver une fiche mais n'a pas le droit d'écrire
  les comptes. Le directeur applique aussi la suspension immédiatement depuis
  l'interface.

### D17. Plus de génération ni de réécriture automatique des comptes
- `syncAppUsers` est supprimé ; enregistrer un élève ou un membre du personnel
  ne crée plus de compte. Le bouton « مزامنة فورية للأدوار » devient une action
  explicite du directeur (module pur `accountAlignment`). Les comptes se créent
  dans Paramètres › المستخدمين, avec liens explicites (fiche, élèves).
- `bootstrapCollectionIfEmpty` / `bootstrapSettingsIfEmpty` supprimés dès le
  Lot 0 (risque de réinjection d'un cache local, aucune utilité en prod).

### D18. Script de provisionnement : choix par défaut
- Mot de passe connu = champ `password` de `appUsers` (ou « 123 », valeur
  implicite de l'ancien client quand le champ manquait). Les comptes Auth
  existants sont **réalignés** sur ce mot de passe (l'ancien client ne mettait
  pas Auth à jour quand le mot de passe changeait), désactivable par
  `--no-sync-passwords`.
- Noms d'utilisateur en double : le compte prioritaire (u1, puis actif, puis
  dernière connexion) garde l'identifiant, les autres reçoivent `_2`, `_3`…
  Identifiants invalides (caractères arabes) : régénérés par translittération.
  Tout est listé dans `identifiants-renommes.csv`.
- **Liens par moindre privilège** : un enfant n'est lié que si téléphone ET nom
  du parent concordent (ou élève d'origine `p_{id}`) ; le reste est listé
  « NON LIÉ — à ajouter si confirmé » pour validation par l'école.
- Anomalie critique (u1 absent, désactivé ou sans rôle مدير) : application
  refusée sans `--accept-critical`.

### D19. Migrations client limitées au bureau
- La migration « paiements avant juillet 2026 » et la synchro des activités ne
  tournent plus que pour مدير / إداري, et la première n'est plus déclenchée par
  un cache vide (elle pouvait écraser des paiements réels `p_init_*`). Les
  absences automatiques ne sont écrites que par la pédagogie.

### D20. Ordre de déploiement script → règles → Hosting
- Fenêtre courte, enchaînement immédiat, puis relance du script en simulation :
  un ancien onglet peut réécrire `password` entre le script et les règles
  (anomalie `PASSWORD_REAPPEARED`, corrigée par une relance `--apply`).

### D21. Émulateur Functions dans le conteneur de l'agent
- Le proxy sortant du conteneur empêche l'émulateur Functions d'enregistrer les
  triggers Firestore (même cause que D11) et il refuse alors de démarrer.
  `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (dans `functions/.env.local`, non
  versionné, honoré seulement sous émulateur) permet de tester les callables ;
  la logique des triggers est testée par appel direct
  (`functions/test/archiveSync.test.ts`) et de bout en bout en CI.

### D22. Divers
- `lastLogin` est désormais mis à jour à la connexion (champ autorisé en
  auto-modification par les règles).
- Le proxy Gemini (`server.ts`) ne renvoie plus le message d'erreur brut (S7, partiel).

## Multi-écoles (branche `feat/multi-tenant`)

### D23. Comptes : `users/{uid}` + `schools/{s}/members/{uid}`, écrits par les Functions
- **Décision** : le profil global (`users`) porte l'identifiant, les écoles et
  l'obligation de changer de mot de passe ; l'appartenance (`members`) porte le
  rôle, la matrice de droits, les drapeaux hérités et les liens explicites. Aucun
  client n'écrit ces documents (sauf champs anodins de son propre compte) : tout
  passe par `createSchoolUser`, `setMemberRole`, `resetUserPassword`, `createSchool`.
- **Raison** : rien à vérifier côté règles pour empêcher l'auto-promotion ou
  l'ajout d'un membre dans une autre école ; une seule logique, testée.
- **Conséquence** : `authLinks` (Lot 0) n'est plus utilisé après la bascule.

### D24. Identifiants et domaine des nouveaux comptes
- Noms d'utilisateur uniques sur toute la plateforme : registre
  `usernames/{username}` (Functions uniquement) + contrôle des comptes Auth
  historiques. Comptes existants : `@alfajr.local` ; nouveaux comptes :
  `@comptes.kuttab.local` (constante `NEW_ACCOUNTS_EMAIL_DOMAIN`). La connexion
  essaie les deux domaines (aucun index public nom → email).
- Une même personne dans deux écoles = un seul compte, deux appartenances
  (option « إضافة حساب موجود » du formulaire).

### D25. Super-admin par claim, sans accès implicite aux données
- Claim `superAdmin` posé par le script de migration (`--super-admin=`). Il liste
  les écoles et leurs membres, crée des écoles (et peut s'en faire directeur),
  réinitialise n'importe quel mot de passe, mais **ne lit pas les données d'une
  école dont il n'est pas membre** (moindre privilège). Le super-utilisateur
  codé en dur « admin_alfajr » de `checkUserPermission` est supprimé.

### D26. Réinitialisation de mot de passe d'un compte multi-écoles
- Refusée à un directeur qui ne dirige pas TOUTES les écoles du compte (sinon il
  pourrait prendre le contrôle du compte du directeur d'une autre école) ; le
  super-admin seul peut le faire. Pas d'auto-rétrogradation ; le directeur
  historique (`legacyAppUserId: "u1"`) n'est modifiable que par le super-admin.

### D27. Paramètres métier par école
- `subscriptionFee` (existant) devient la cotisation réellement appliquée
  (repli : 100), `feeOverrides` (tarifs par mois), `openingYear`/`openingMonth`
  (ouverture), `studentAccountMinAge`. La migration fixe pour `alfajr` les valeurs
  implicites de l'ancien code (100, 70 en juillet-août 2026, ouverture juillet 2026)
  et signale la correction de `subscriptionFee` s'il valait 0.
- Saisie dans Paramètres › الرسوم المرجعية (champs ajoutés dans le style existant).
- Nom, saison, devise et identité de l'école lus dans les paramètres ; le titre
  de l'onglet suit l'école active (`index.html` garde le titre d'Al Fajr par défaut).
- Supprimé : remplacement automatique « طنجة → سلا » et « تأسست سنة 2018 » par
  défaut (propres à Al Fajr).

### D28. Migrations client
- La création de la ligne de cotisation du mois d'ouverture n'écrase plus jamais
  un document (transaction, création seule), ne tourne que pour le bureau, après
  réception des paiements depuis le serveur, selon l'ouverture de l'école.
- Les mois antérieurs à l'ouverture sont seulement masqués (plus réécrits dans le
  cache). La synchro des activités reste locale et réservée au bureau.

### D29. Familles
- Parents : lecture des cotisations de leurs enfants liés (requête filtrée +
  règle), ce qui rétablit l'onglet « سجل الرسوم » fermé en Lot 0. Élèves : pas de
  cotisations (comme la matrice par défaut). Notifications toujours fermées aux
  familles (elles citent d'autres élèves).

### D30. Proxy Gemini uniquement dans la fonction `api`
- Jeton Firebase + appartenance active avec un rôle pédagogique à l'école,
  clé `GEMINI_API_KEY` dans Secret Manager, modèle paramétrable (`GEMINI_MODEL`),
  aucune requête externe sans clé, réponse de repli sans détail technique.
- La route ouverte de `server.ts` est retirée (réponse 410). `VITE_API_BASE_URL`
  pointe l'émulateur en développement, la même origine en production.
- **Limite** : pas de limitation de débit par utilisateur (à ajouter si abus).

### D31. Migration idempotente et non destructive
- Un document cible existant n'est jamais écrasé (sauf `--overwrite`) : une
  relance après la bascule ne peut pas effacer une saisie. Les données racine sont
  conservées 30 jours (retour arrière) puis supprimées à la main (runbook §7).
- Le provisionnement Auth du Lot 0 est réutilisé tel quel (mêmes garde-fous).

### D32. Choix d'interface minimaux
- Page de choix d'école dans le style de l'écran de connexion ; sélecteur
  `<select>` dans la barre du haut (visible si plusieurs écoles ou super-admin) ;
  onglet par défaut inchangé (`dashboard`), comme avant.

### D33. Retrait d'un membre
- `setMemberRole(remove)` supprime l'appartenance ; si la personne n'a plus
  aucune école, son compte Auth est désactivé (pas supprimé, pour l'historique).

## Revue de sécurité adversariale (étape 2, branches `fix/revue-securite*`)

Numérotation commune aux deux branches de revue (`fix/revue-securite` depuis
`feat/multi-tenant`, `fix/revue-securite-lot0` depuis `fix/lot0-securite`).
Constats et preuves : `docs/revues/REVUE-SECURITE-ETAPE-2.md`.

### D34. Tous les mots de passe hérités sont remplacés au provisionnement
- **Contexte** : avant le Lot 0, `appUsers` était lisible (S1) **et modifiable**
  (S2) par tous ; le mot de passe du directeur figurait dans le code public (S4).
  Reprendre ces mots de passe dans Firebase Auth laissait les comptes ouverts à
  quiconque les avait relevés ou plantés (R-01, R-08). `mustChangePassword` n'est
  qu'un rappel de l'interface.
- **Décision** : `--rotate-passwords=all` par défaut (scripts du Lot 0 et de
  migration) : mot de passe temporaire aléatoire (CSPRNG, `xxxx-xxxx-xxxx`) pour
  chaque compte non encore provisionné, changement imposé, écrit dans le seul
  rapport secret `mots-de-passe-temporaires.csv` (droits 600), jamais dans
  Firestore ni les journaux ; jamais régénéré à la relance. `weak` (faibles,
  publiés et bureau seulement) reste un choix humain explicite ; `none` est
  réservé aux données de démonstration. Sans dossier de rapport, l'application
  est refusée (mots de passe perdus sinon).
- **Coût** : chaque personne reçoit un mot de passe temporaire, remis avec son
  identifiant (déjà à communiquer, D2).
- **Retour arrière** : relancer avec `--rotate-passwords=weak` ou `none` (déconseillé) ;
  en cas de retour à l'ancien front, réimport de l'export Auth (runbook Lot 0 §7).

### D35. `authLinks` est l'ancre de confiance du provisionnement
- **Contexte** : l'ancienne application n'écrivait jamais `authUid` ni de liens
  dans `appUsers` ; `authLinks` lui était fermé. Un `authUid` planté rattachait le
  compte Auth d'un tiers au rôle visé (R-08) ; une relance recalculait des liens
  que l'école avait retirés (R-02) ou réactivait un compte suspendu dans son lien (R-09).
- **Décision** : un `authUid` ne vaut provisionnement que s'il est confirmé par
  `authLinks/{uid}.appUserId` (sinon anomalie critique `UNTRUSTED_AUTH_UID`, uid
  ignoré) ; au premier provisionnement les liens préexistants sont ignorés
  (`UNEXPECTED_LINK_FIELDS`) ; pour un compte provisionné, le lien fait foi
  (rôle, liens, statut le plus restrictif ; `AUTHLINK_MISMATCH`) et rien n'est
  recalculé ; les comptes du bureau autres que u1 sont listés (`PRIVILEGED_ACCOUNT`)
  pour confirmation par l'école. Les sessions d'un compte Auth préexistant
  adopté sont révoquées.
- **Retour arrière** : revenir au commit précédent du script (déconseillé).

### D36. Erreurs partielles et relances des scripts
- Une erreur sur un compte n'interrompt plus le provisionnement : comptée
  (`failures`), anomalie critique `ACCOUNT_FAILED`, rapports écrits, code de
  sortie 2 ; la relance reprend les comptes restants (R-04).
- Migration (branche multi-écoles) : copies par `create` sans `--overwrite`
  (`ALREADY_EXISTS` = déjà présent, jamais écrasé ; R-05) ; code 2 si anomalie
  critique après application.

### D37. Échappement HTML obligatoire des fenêtres d'impression
- **Contexte** : les impressions (`window.open("")` + `document.write`) partagent
  l'origine de l'application ; un nom d'élève piégé par un enseignant y
  exécutait du script dans la session du directeur (C-01, démontré).
- **Décision** : toute donnée insérée passe par `escapeHtml`
  (`src/security/html.ts`) ; `tests/unit/printTemplates.test.ts` interdit toute
  interpolation brute dans ces gabarits. Pas de CSP dans ces fenêtres pour
  l'instant (les gabarits utilisent `onload` et `cdn.tailwindcss.com`, script
  tiers exécuté dans l'origine de l'application : à retirer dans un lot ultérieur).

### D38. Le rôle مدير n'est jamais attribué par la synchronisation des rôles
- La fiche du personnel est modifiable par le bureau : la déduction du rôle à
  partir de l'intitulé (« رئيس », « مدير ») permettait à un إداري de devenir
  directeur au prochain clic du directeur (C-03). Le rôle مدير ne s'attribue
  plus qu'explicitement.

### D39. Rattachement d'un compte existant et compte u1 (Cloud Functions)
- `createSchoolUser(attachExisting)` ne rattache qu'un compte du registre
  `usernames` (un compte créé par l'inscription libre sous un identifiant
  anticipé n'entre jamais dans une école) et ne réactive pas un compte
  désactivé, sauf par le super-admin (F-01).
- `resetUserPassword` refuse la réinitialisation du directeur historique
  (`legacyAppUserId: "u1"`) par un autre directeur (F-02, conforme à D26).

### D40. Purge du cache quand la session se termine sans déconnexion
- Quand Firebase Auth signale l'absence de session (jeton révoqué ou expiré,
  compte désactivé), le cache local est purgé (C-02). La persistance de session
  Firebase reste « locale » (pas de changement fonctionnel) : sur les PC
  partagés de l'école, `browserSessionPersistence` est recommandée (à décider).

### D41. Constats acceptés, non corrigés dans cette revue
- R-06 (connu, D14) : les enseignants lisent salaires et CIN (`teachers`) ;
  correction = scinder la fiche publique et la fiche RH (lot ultérieur).
- R-07 : les familles peuvent créer des notifications (contenu affiché échappé
  par React) ; à restreindre si l'interface n'en a pas besoin.
- Inscription libre Firebase Auth et énumération des identifiants : actions
  humaines du runbook (désactivation de l'inscription, protection contre
  l'énumération) ; leurs effets sont neutralisés par D34–D35 et le registre (D39).
- Proxy Gemini : pas de limitation de débit par utilisateur (D30) ; le service
  Cloud Run d'AI Studio expose un proxy ouvert à arrêter au Lot 0 (runbook).

## Étape 2 : durcissement (branche `feat/durcissement`)

Avancement et reprise : `docs/progress/ETAPE-2-durcissement.md`.

### D42. Fiche du personnel scindée : `teachers` (publique) + `staffPrivate` (RH)
- **Contexte** : R-06 (D14, D41) : la pédagogie lit `teachers` (noms, halaqas,
  téléphones) et y lisait aussi salaires et CIN. Des règles ne filtrent pas des
  champs : il faut deux documents.
- **Décision** :
  - `schools/{s}/staffPrivate/{teacherId}` porte `monthlySalary`,
    `contractType`, `cinNumber`, `emergencyContact`, `birthDate`, `address`
    (+ `teacherId`, `schoolId`, `updatedAt`), liste fermée dans les règles ;
    lecture et écriture : مدير et إداري seulement (ni super-admin sans
    appartenance, ni autre école) ;
  - `teachers` refuse tout champ RH (une ancienne fiche se nettoie par une
    écriture en fusion avec `deleteField`) ;
  - téléphone, WhatsApp, e-mail, fonction, horaires et affectations restent
    publics pour la pédagogie : ce sont des coordonnées professionnelles
    utilisées par l'interface (annuaire du personnel). À déplacer aussi si
    l'école le demande (ajouter le champ à `STAFF_PRIVATE_FIELDS` et aux règles) ;
  - la liste des champs vit dans `src/security/staffPrivate.ts` (module pur,
    partagé par le client, la migration, le peuplement et les tests) ; un test
    unitaire vérifie qu'elle est identique à celle des règles ;
  - client : `subscribeToStaff` lit `teachers` et, pour le bureau seulement,
    `staffPrivate`, puis fusionne : l'interface reçoit le même objet `Teacher`
    qu'avant (aucun changement d'écran ; la paie lit toujours `monthlySalary`).
    `saveStaffToFirestore` / `deleteStaffFromFirestore` écrivent les deux
    documents dans un même lot ;
  - migration : la fiche publique est copiée sans champs RH, la fiche RH est
    créée à part (ligne `staffPrivate` des comptages). Une fiche publique cible
    qui porte encore des champs RH (répétition antérieure) est scindée à la
    relance (`staffSplitExisting`, anomalie `STAFF_PRIVATE_SPLIT`) sans écraser
    une fiche RH existante : seule modification d'un document cible existant.
- **Limites** :
  - un enseignant ne voit plus son propre salaire dans l'application (choix
    « bureau seulement » de la mission) ;
  - un onglet resté ouvert sur l'ancienne version (avant D42) ne peut plus
    enregistrer une fiche du personnel (refus des règles) : recharger la page ;
  - branche Lot 0 (`fix/lot0-securite`) non traitée : R-06 y reste accepté.
- **Retour arrière** : recopier les champs de `staffPrivate` dans `teachers`
  (Admin SDK, par un humain), puis redéployer les règles et le front précédents.

### D43. Proxy IA : quotas transactionnels, taille des entrées, journaux sans données personnelles
- **Contexte** : O-03 (D30, D41) : `api` n'avait aucune limite ; un compte
  pédagogique compromis pouvait faire exploser la facture Gemini. Les journaux
  d'erreur contenaient `String(error)`, qui peut citer l'invite (nom d'élève).
- **Décision** :
  - compteurs Firestore `aiQuota/*` (racine, fermée aux clients) incrémentés
    dans une transaction unique : utilisateur/jour (30), utilisateur/minute (5),
    école/jour (300), global/jour (1000), paramètres `defineInt` modifiables
    sans changer le code ; 0 = service fermé (coupure d'urgence) ; un refus ne
    consomme rien ; jours en UTC ; `expiresAt` pour une politique TTL ;
  - le quota est consommé avant l'appel au modèle, même si l'appel échoue
    (le coût a pu être engagé) ; compteur indisponible → 503 (fermé par défaut) ;
  - corps limité à 32 Kio (413) avant toute vérification ; les champs restent
    tronqués dans l'invite ;
  - journaux structurés `ai.analyze` : issue, école, pseudonyme SHA-256 de
    l'uid, durée ; aucune donnée d'élève, ni invite, ni réponse, ni message
    d'erreur brut (nom et statut HTTP seulement) ;
  - client : l'appel passe par `requestAiReport` (`src/firebase.ts`), qui
    traduit 429 / 413 / 401 / 403 en messages arabes.
- **Retour arrière** : limites très hautes dans `functions/.env.<projet>` (les
  compteurs restent), ou revenir au commit précédent de `api.ts`.
- Runbook : `docs/runbooks/PROXY-IA.md` (paramètres, TTL, coupure d'urgence).

### D44. App Check préparé, désactivé par défaut
- **Décision** : client : `initializeAppCheck` + `ReCaptchaEnterpriseProvider`
  seulement si `VITE_APPCHECK_SITE_KEY` est défini (vide partout dans le dépôt) ;
  fournisseur de débogage si émulateurs ou `VITE_APPCHECK_DEBUG_TOKEN` ; jeton
  joint à `api` par `requestAiReport` (`X-Firebase-AppCheck`). Functions :
  paramètre `APPCHECK_ENFORCE` (défaut false) : `enforceAppCheck` des callables
  et vérification manuelle dans `api` (refus 401 seulement si appliqué) ;
  journaux d'état du jeton pour la période d'observation.
- **Raison** : App Check appliqué trop tôt bloque les utilisateurs dont le
  navigateur ne charge pas reCAPTCHA ; il faut mesurer d'abord.
- **Non testé ici** : l'échange réel du jeton (reCAPTCHA ou débogage) exige un
  vrai projet ; les émulateurs ne vérifient pas App Check. La logique de
  décision de `api` est testée par injection d'un vérificateur.
- **Retour arrière** : runbook `docs/runbooks/APP-CHECK.md` §6.

### D45. Dépendances : audit du 22/10/2026
- **Avant** : app 22 vulnérabilités (9 modérées, 13 élevées) ; functions 0.
- **Appliqué** (`npm audit fix`, sans changement majeur, dans les plages de
  `package.json`) : vite 6.4.3 → 6.4.5, firebase 12.16.0 → 12.19.0 (écart avec
  D10 assumé : version mineure, le front multi-écoles est de toute façon
  nouveau), express 4.22.3, body-parser 1.20.8, qs 6.16.1, postcss 8.5.31,
  nanoid 3.3.20, source-map-js 1.2.2, browserslist 4.29.4, re2 1.27.0,
  firebase-tools 15.34.1.
- **Surcharges** (`overrides` de `package.json`, tests verts) :
  `@grpc/grpc-js` ^1.14.6 sous `@firebase/firestore` (qui exige ~1.9) ;
  `uuid` ^11.1.1 sous `gaxios@6` (firebase-tools). À retirer quand les paquets
  parents les exigeront d'eux-mêmes.
- **Après** : 5 vulnérabilités, toutes dans `firebase-tools` (CLI et
  émulateurs, outil de développement, jamais déployé ni chargé par le
  navigateur) : `braces` (toutes versions, via `chokidar`), `@opentelemetry/core`
  < 2.8 (via `@google-cloud/pubsub`). Risque réel : déni de service d'un
  outil local sur entrée malveillante, nul en production. La « correction »
  proposée (`firebase-tools@14`) est un retour en arrière : refusée.
- **Bundle de production** : aucune vulnérabilité connue dans ce qui est servi
  (`dist/` : React, Firebase web — grpc-js n'est utilisé que sous Node).
  `express`, `vite`, `dotenv` sont en `dependencies` mais ne servent qu'au
  serveur de développement `server.ts` (non déployé : Hosting ignore
  `server.cjs`) ; à déplacer en `devDependencies` lors d'un nettoyage.
- **Functions** : `npm audit` = 0.
- **Suivi** : le job CI `audit` (non bloquant pour les outils de dev) relance
  `npm audit --omit=dev` (bloquant) et `npm audit` (informatif).

### D46. Déploiement depuis GitHub Actions : manuel, WIF, environnements
- **Décision** : `deploy.yml` et `preview.yml` en `workflow_dispatch` seulement ;
  authentification `google-github-actions/auth` par Workload Identity
  Federation (aucune clé JSON, aucun secret GitHub : uniquement des variables
  d'environnement) ; fournisseur OIDC restreint au dépôt ET à l'environnement
  GitHub (`assertion.environment`), compte de service emprunté par le seul
  sujet `repo:…:environment:<env>` ; environnement `production` avec relecteur
  obligatoire, auto-validation interdite et branche `main` seulement, plus un
  garde-fou dans le job (branche, recopie de l'identifiant du projet) ;
  environnement `dev` pour le projet de développement (config web injectée par
  `.env.production.local`, jamais commitée). Cible unique possible
  (`firestore-rules`, `functions`, `hosting`). Le job `verifier` rejoue lint,
  build, audit et tests sur émulateurs avant tout déploiement.
- **Aperçus** : canal Hosting `br-<branche>` sur le projet de dev, expiration
  7 jours par défaut ; refusé si le projet est la prod.
- **Rôles** : liste minimale documentée (runbook §3), sans `owner`/`editor` ;
  `serviceAccountUser` sur le seul compte d'exécution des Functions.
- **Non testé** : aucun projet ni pool n'existe ; workflows validés par
  `actionlint` seulement.
- **Retour arrière** : `gh workflow disable`, désactivation du fournisseur WIF
  (runbook `CI-DEPLOIEMENT.md` §8).

### D47. Sauvegardes : PITR + export quotidien planifié avec rétention
- **Décision** : fonction `scheduledFirestoreExport` (`onSchedule`, 02:30 heure
  du Maroc, `europe-west1`) qui lance un export géré complet de la base vers
  `gs://<BACKUP_BUCKET>/firestore/<base>/<horodatage>/`, attend sa fin, puis
  supprime les exports de plus de `BACKUP_RETENTION_DAYS` (30) en gardant
  toujours les 3 plus récents. Compte d'exécution dédié `firestore-backup@`
  (export Firestore + objets du seul bucket). Omise du déploiement
  (`omit: BACKUP_ENABLED.equals(false)`) tant que le bucket et le compte
  n'existent pas : le prochain déploiement des Functions ne dépend donc pas
  de Cloud Scheduler. En plus : PITR (7 jours), règle de cycle de vie du
  bucket (Nearline à 7 jours, suppression à 45), et en option les sauvegardes
  planifiées natives de Firestore.
- **Tests** : logique pure (préfixes, requête, rétention, échec d'export sans
  suppression) par appel direct ; l'export réel n'est pas émulable.
- **Retour arrière** : `BACKUP_ENABLED=false` et redéploiement (runbook §6).

### D48. Rewrite Hosting `/api/**` testé ; proxy du conteneur contourné par processus
- **Constat** : D11 et D21 attribuaient au proxy sortant l'échec du rewrite
  (502) et des triggers sur l'émulateur. En lançant les émulateurs **sans
  variables de proxy** pour ce seul processus (`scripts/dev/without-proxy.sh`),
  les deux fonctionnent dans le conteneur : `npm run test:hosting` (3/3) et
  `npm run test:rules` **avec** les triggers (237/237, aucun test ignoré,
  `functions/.env.local` temporairement sans `EMULATOR_SKIP_FIRESTORE_TRIGGERS`).
- **Décision** : nouveau script `test:hosting` (build de dev, émulateurs
  Hosting + Functions + Auth + Firestore, `tests/hosting/`) : santé et rapport
  IA via `/api/**` (401 sans jeton, 200 avec, quota compté), repli SPA. Ajouté
  à la CI (job `verifier`). Dans un conteneur à proxy :
  `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run test:hosting`.
- **Conséquence** : `EMULATOR_SKIP_FIRESTORE_TRIGGERS` n'est plus nécessaire si
  l'on passe par `without-proxy.sh` (gardé pour compatibilité, D21).
- **Retour arrière** : retirer l'étape CI et le script.

### D49. Pages de production : `index.html` générique, en-têtes de sécurité, cache
- **`index.html`** : titre et description génériques (« المدرسة القرآنية »),
  `noindex` ; le titre suit l'école active après connexion (D27).
- **En-têtes** (`firebase.json`, toutes les réponses) : CSP, `nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (caméra `self` pour le scan QR, micro, géolocalisation, paiement… fermés),
  `X-Frame-Options: DENY` + `frame-ancestors 'none'`,
  `Cross-Origin-Opener-Policy: same-origin-allow-popups` (fenêtres
  d'impression), HSTS.
- **CSP** : `default-src 'self'` ; Firebase (`*.googleapis.com`,
  `*.cloudfunctions.net`, `*.run.app`), Google Fonts, reCAPTCHA Enterprise
  (App Check, D44), images Unsplash et `api.qrserver.com` (utilisées par
  l'interface) ; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
  **Compromis assumé** : `script-src` garde `'unsafe-inline'` et
  `https://cdn.tailwindcss.com`, car les fenêtres d'impression (about:blank,
  qui HÉRITENT de la CSP de l'application) contiennent des scripts en ligne
  (`onload="window.print()"`, `<script>`) et chargent Tailwind par CDN (D37).
  Les retirer est la prochaine étape, côté interface (branche design) :
  gabarits d'impression sans CDN ni script en ligne (impression déclenchée par
  l'ouvreur : `popup.print()`), puis retirer `'unsafe-inline'` et le CDN de
  `script-src` (le test `tests/e2e/csp.spec.ts` dira si quelque chose casse).
- **Cache** : `/assets/**` (noms hachés par Vite) `immutable` un an ; pages et
  routes de l'application (`^/$|^/index\.html$|^/[^.]*$`, expression RE2 : Hosting
  n'accepte pas les lookarounds) `no-cache`, pour qu'un déploiement soit vu
  immédiatement.
- **Vérification** : `npm run test:e2e` démarre le serveur de développement avec
  `E2E_CSP=1` : la CSP de `firebase.json` y est appliquée par une balise
  `<meta>` (origines locales des émulateurs ajoutées, `scripts/dev/csp.ts`) ;
  toute la suite Playwright tourne donc sous la politique, et
  `tests/e2e/csp.spec.ts` exige zéro violation (connexion, élèves, impression,
  personnel, finances). `npm run test:hosting` vérifie les en-têtes servis par
  l'émulateur Hosting ; `tests/unit/hostingHeaders.test.ts` leur cohérence.
- **Constat annexe (O-05, faible)** : les badges et cartes génèrent leur QR code
  via `https://api.qrserver.com` en envoyant identifiant, nom et catégorie
  d'un élève ou d'un membre du personnel à un tiers. À remplacer par une
  génération locale (côté interface) ; la CSP le permet encore pour ne rien casser.
- **Retour arrière** : retirer le bloc `hosting.headers` et redéployer le Hosting.

### D50. Restriction de la clé API web : référents HTTP et API autorisées
- **Décision** (action humaine, runbook `docs/runbooks/CLE-API-WEB.md`) : clé
  web limitée aux domaines Hosting (et au domaine personnalisé) et aux API
  Identity Toolkit, Secure Token, Firestore et App Check ; clé Gemini limitée
  à l'API Generative Language, puis tournée après l'arrêt du service Cloud Run
  d'AI Studio (O-01). Projet de dev : `localhost` et `*.web.app` (aperçus).
- **Raison** : la clé est publique ; la restriction réduit l'abus de quota
  et l'usage hors de l'application (énumération, création de comptes si
  l'inscription libre restait ouverte). La sécurité des données reste dans
  les règles.
- **Retour arrière** : `gcloud services api-keys update … --clear-restrictions`.

### D51. Photos : filet de sécurité immédiat, passage à Cloud Storage planifié (non implémenté)
- **Constat** :
  - photos d'élèves compressées côté client (180 px, JPEG ≈ 10–20 Ko) ;
  - photos du personnel et logo **non compressés** (jusqu'à 2 Mo, soit ≈ 2,7 Mo en
    base64) : au-delà de 1 Mio le document est refusé par Firestore et
    l'enregistrement échouait en silence (fiche entière perdue) ;
  - toutes les photos voyagent dans chaque lecture de la collection et dans le
    cache local (limite de ≈ 5 Mo de localStorage : 300 élèves à 15 Ko la saturent).
- **Fait (couche données, aucun changement d'écran)** : `shrinkInlinePhotos`
  (`src/utils/imageCompression.ts`) recompresse avant écriture toute image
  base64 de plus de ≈ 300 Ko (`photo`, `photoUrl`, `associationLogo`, `logo` ;
  512 px puis 320 px), dans `saveToFirestore` et `saveStaffToFirestore`.
  Tests unitaires (décision, absence d'effet sur les URL et petites images).
- **Pourquoi pas Cloud Storage cette nuit** : les règles Storage ne peuvent
  pas lire l'appartenance à une école (`firestore.get()` des règles Storage ne
  fonctionne qu'avec la base `(default)` d'après la documentation Firebase
  consultée lors de la conception, à revérifier au moment de l'implémentation ;
  or la nôtre est une base NOMMÉE, D7).
  Une isolation propre par école exige d'abord des claims d'appartenance, et
  l'intégration touche les écrans d'envoi et d'affichage que la branche design
  réécrit. Le faire à moitié (URL à jeton, lecture par tout compte connecté)
  aurait affaibli l'isolation entre écoles.
- **Plan détaillé (à faire après fusion de `feat/design`)** :
  1. *Claims d'appartenance* : claim `sm` = `{ <schoolId>: <code rôle> }`
     (< 1000 octets), posé par les Functions à chaque changement
     (`createSchool`, `createSchoolUser`, `setMemberRole`, triggers
     d'archivage) et par la migration ; le client force `getIdToken(true)`
     quand son document `members` change (abonnement existant). Tests sur
     émulateurs : claim posé, retiré, désactivation.
  2. *Chemins* : `schools/{s}/photos/{kind}/{docId}/{photoId}.jpg`
     (`kind` = `students` | `staff` | `school`), métadonnées `schoolId`,
     `uploadedBy`. `photoId` = empreinte SHA-256 du contenu (idempotent).
  3. *`storage.rules`* (esquisse) :
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         function role(s) { return request.auth != null && request.auth.token.sm != null ? request.auth.token.sm[s] : null; }
         function educator(s) { return role(s) in ['dir', 'adm', 'coo', 'ens']; }
         function office(s) { return role(s) in ['dir', 'adm']; }
         match /schools/{s}/photos/students/{id}/{f} {
           allow read: if educator(s);   // familles : via une fonction qui vérifie linkedStudentIds
           allow write: if educator(s) && request.resource.size < 300 * 1024
                        && request.resource.contentType.matches('image/(jpeg|png|webp)');
         }
         match /schools/{s}/photos/staff/{id}/{f} {
           allow read: if educator(s);
           allow write: if office(s) && request.resource.size < 300 * 1024 && request.resource.contentType.matches('image/.*');
         }
         match /schools/{s}/photos/school/{f} {
           allow read: if role(s) != null;
           allow write: if role(s) == 'dir' && request.resource.size < 500 * 1024;
         }
         match /{all=**} { allow read, write: if false; }
       }
     }
     ```
     Les familles (photo de leur enfant) passent par `api` (`/api/photos/…`,
     contrôle de `linkedStudentIds`) ou gardent l'avatar par défaut.
  4. *Champ* : `photo` contient `storage:schools/…` ; un utilitaire
     `resolvePhoto(value)` (couche données) renvoie l'URL (`getDownloadURL`,
     mise en cache) pour les valeurs `storage:` et laisse passer `data:`/`https:`
     (compatibilité pendant la migration). Envoi : `uploadSchoolPhoto(schoolId,
     kind, docId, file)` = compression canvas (512 px, JPEG 0,8, ≤ 200 Ko) +
     `uploadBytes` + chemin renvoyé.
  5. *Points d'intégration interface* (à refaire sur `feat/design`) : envoi des
     photos d'élève (`handleStudentPhotoUpload` / `handleStudentDrop`), du
     personnel (`TeacherManagement` : envoi et glisser-déposer), du logo
     (`SettingsManagement`) ; affichage (`studentAvatar`, `StudentCard`, cartes
     et badges) ; fenêtres d'impression : résoudre les URL AVANT d'écrire le
     HTML.
  6. *Migration* : `scripts/migration/photos-to-storage.ts` (simulation par
     défaut, `--project` obligatoire, Admin SDK) : pour chaque document dont un
     champ image est en `data:`, envoi au chemin déterministe puis mise à jour
     du champ **seulement s'il n'a pas changé** (transaction) ; comptages et
     anomalies (`LARGE_PHOTO`, image illisible) ; relance idempotente.
  7. *Émulateur Storage* (port 9199) dans `firebase.json`, tests des règles
     Storage (`@firebase/rules-unit-testing`), test de la migration, test
     Playwright d'envoi et d'affichage.
  8. *Exploitation* : bucket dans la région de la base ; Firestore export ne
     couvre PAS Storage → versionnement des objets + suppression réversible
     (soft delete 30 j) et copie nocturne vers le bucket de sauvegarde (D47) ;
     CSP : `img-src https://firebasestorage.googleapis.com`.
  9. *Estimation* : 1,5 à 2 jours (claims : 0,5 ; Storage + règles + tests :
     0,5 ; migration : 0,5 ; intégration écrans : 0,5).
- **Retour arrière du filet de sécurité** : retirer l'appel à
  `shrinkInlinePhotos` dans `src/firebase.ts`.

## Revue adversariale du durcissement (branches `fix/revue-durcissement*`)

Rapport : `docs/revues/REVUE-SECURITE-DURCISSEMENT.md`. Avancement :
`docs/progress/ETAPE-2-revue2.md`.

### D52. Notifications réservées au personnel (R-07)
- **Contexte** : R-07 (D41) : tout membre actif, familles comprises, pouvait
  créer une notification, lue ensuite par tout le personnel (hameçonnage
  interne : « réglez la cotisation sur tel compte »). Tout membre du personnel
  pouvait aussi réécrire le titre et le message d'une notification existante.
- **Décision** : création réservée au personnel (`isStaff`) ; mise à jour libre
  pour le bureau, limitée au champ `isRead` pour le reste du personnel ;
  suppression inchangée (bureau). Un document hérité sans champ `id` peut le
  recevoir (égal à son identifiant) en même temps que `isRead`. Lot 0 : la
  création seule est restreinte (`isStaff()`), pour garder le correctif court.
- **Effet sur l'interface** : aucun écran ne permet à une famille d'écrire une
  notification ; seule la notification automatique « تعديل البيانات الشخصية »
  après la modification de son profil était envoyée. Elle reste affichée
  localement, mais son écriture Firestore est refusée et seulement journalisée
  dans la console (`saveToFirestore` intercepte l'erreur). Les familles ne
  lisaient déjà pas les notifications.
- **Tests** : `tests/emulator/revue-rules.test.ts` › R-07 (échouaient avant le
  correctif), matrice de `tenant-rules.test.ts` ; Lot 0 :
  `tests/emulator/revue-rules.test.ts` et `lot0-rules.test.ts`.
- **Retour arrière** : rétablir `isMember(s)` (Lot 0 : `active()`) pour
  `create` et `isStaff(s)` seul pour `update`.
