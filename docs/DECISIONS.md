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

## Lot 2 — découpage d'App.tsx (branche `refactor/decoupage-app`)

> Numérotation : ces décisions portaient les numéros D42 à D52 sur `refactor/decoupage-app`
> et `feat/design` ; elles ont été renumérotées D52 à D62 à l'intégration avec `main`
> (dont le durcissement occupe D42 à D51). Ancien → nouveau : ajouter 10.

### D52. Un contrôleur unique composé de hooks successifs, lu par contexte
- **Contexte** : `App.tsx` (~8 500 lignes) contenait ~180 états, ~120 fonctions et
  10 effets dans une seule portée ; les écrans en dépendaient directement.
- **Décision** : l'état et la logique sont déplacés **tels quels** dans des hooks
  appelés dans le même ordre que dans l'ancien composant (`src/app/useAppController.ts`) :
  états (`src/data/useSchoolDataState`, `src/session/useSessionState`,
  `src/app/state/useUiState`) → règles de l'école et cache (`useCore`) → effets
  (`useQuotaFallback`, `useSessionActions`, `useSchoolSync`) → valeurs dérivées
  (`useDerived`) → actions par domaine (`src/app/actions/*`). Chaque étage reçoit la
  portée des précédents (types `src/app/scope.ts`). Les écrans (`src/screens`), les
  fenêtres (`src/screens/modals`) et le cadre (`src/shell`) lisent le contrôleur par
  `useApp()` (`src/app/AppContext.tsx`) ; la session est aussi exposée par
  `SessionContext` (`src/session/SessionContext.tsx`), l'école par `SchoolContext`.
- **Raison** : zéro changement de comportement. L'état reste à la racine, donc les
  filtres, recherches et sélections survivent toujours aux changements d'onglet ; les
  effets gardent leur ordre d'exécution ; le JSX est copié à l'identique (même DOM).
  Le découpage a été fait par des scripts (tranches de lignes + analyse des noms
  utilisés), vérifié par `tsc`, par les tests e2e et par comparaison pixel à pixel des
  captures avant / après (seules différences : animations en cours, ordre aléatoire
  des comptes dans la liste des membres).
- **Gabarits d'impression** : `src/print/*` (reçu, certificat, rapports, cartes,
  relevé mensuel), fonctions pures qui renvoient le HTML ; les fonctions de
  `usePrintActions` ouvrent la fenêtre comme avant.
- **Retour arrière** : `git revert` des commits du Lot 2 (aucune donnée touchée).

### D53. Modules extraits volumineux : état → hook + contexte, JSX → sections
- `FinanceManagement`, `ActivitiesManagement`, `TeacherManagement`,
  `SettingsManagement` (1 700 à 3 000 lignes) gardent leur interface (props) et leur
  fichier ; leur état part dans `src/components/{finance,activities,staff,settings}/use*State`
  (éventuellement scindé en hooks successifs), exposé par un contexte local, et leur
  JSX en sections (en-tête, filtres, onglets, fenêtres). Constantes de module dans
  `shared.tsx` (ré-exportées, ex. `STAFF_CATEGORIES_CONFIG`).
- **Résultat** : plus aucun fichier au-delà de 800 lignes (le plus long :
  `src/db.ts`, 758 lignes, non modifié).

### D54. Repères de test `data-*`
- `data-tab` (boutons du menu), `data-nav` (menu bureau / mobile), `data-screen`
  (racine de chaque écran), `data-modal` (fenêtres), `data-action` (boutons qui
  ouvrent une fenêtre), `data-subtab`, `data-app-shell`. Sans effet visible ;
  servent aux tests e2e et aux captures, et survivent au changement de design.

### D55. Constats faits pendant le découpage (non corrigés : hors périmètre « sans changement »)
- **F1 — écrasement possible des paramètres de l'école** : à la première connexion
  du directeur historique, l'enregistrement du profil (`handleSaveProfile`) recopie
  `systemSettings` en changeant `directorName`. Si les paramètres n'ont pas encore été
  reçus de Firestore (enregistrement très rapide), ce sont les **valeurs par défaut**
  (cotisation 0, téléphone vide…) qui sont écrites dans `settings/system`. Observé en
  e2e (captures). Les tests attendent désormais 2 s avant d'enregistrer. Correctif
  proposé : ne synchroniser `directorName` que si les paramètres viennent du serveur.
  Logique de session : à traiter avec la revue de sécurité.
- **F2** — le portail enseignant (`teacher-dashboard`) n'apparaît dans le menu que si
  le compte a aussi le droit `dashboard` ; l'enseignant fictif (droits explicites) ne
  le voit donc pas.
- **F3** — l'onglet des présences n'a pas de rendu pour `إداري`, `مؤطر`, les parents
  et les élèves (condition `مدير` / `مدرس` dans le routage) : page vide.
- **F4** — le bandeau « quota Firestore » affiche en dur l'identifiant du projet et de
  la base de production.

## Nouveau design (branche `feat/design`)

### D56. Jetons de la charte et remplacement des anciennes palettes
- **Décision** : thème Tailwind 4 (`@theme` de `src/index.css`) repris de
  `design/Main.dc.html` : fond `#ECEDE6`, surfaces `#F8F8F3` / `#F1F2EB`, nuit
  `#102446`, primaire `#1B3A6B`, or `#D4A017`, texte `#1A1F2B` / `#4A5060` /
  `#6B7080`, bordures `#D9DBD0` / `#D0D3C6` / `#E1E3D8`, tons succès / danger /
  avertissement ; polices Reem Kufi (titres), IBM Plex Sans Arabic (texte), Amiri
  (texte coranique) ; rayons 10 / 12 / 18 / 22 px ; cibles de 44 px ;
  `tabular-nums` ; `:focus-visible` doré.
- Les échelles `primary`, `gold`, `danger`, `success` et `sand` remplacent
  `emerald/teal/blue…`, `amber/orange`, `rose/red`, `green`, `slate/zinc` : une
  passe mécanique (≈ 4 200 classes) a d'abord appliqué la charte partout, puis
  chaque écran est repris à la main avec les composants de `src/ui`.
- **Contraste AA** : `text-slate-400` est porté à `#6B7080` (4,6:1 sur surface) ;
  l'or n'est jamais utilisé comme couleur de texte sur fond clair (`#8A6400`
  à la place) ; le vert `#3F8A2E` sert aux pastilles, `#2F5523` au texte.
- **Retour arrière** : revert des commits de `feat/design`.

### D57. Menu de la charte et accès aux écrans
- Groupes et libellés de la maquette (التعليم / المالية / الإدارة) ; les libellés
  qui dépendent du rôle sont conservés (« متابعة أبنائي », « ملفي وسجل الحفظ »…).
  Mêmes droits qu'avant pour chaque onglet, avec deux corrections :
  - **portail enseignant** (constat F2) : visible pour un `مدرس` qui a le droit
    `teacher-dashboard` (et plus seulement `dashboard`, que la matrice par défaut
    ne lui donne pas : le portail était inaccessible) ;
  - **onglet d'accueil** : si l'onglet actif n'est pas dans le menu du rôle (ex.
    « dashboard » pour un parent), le premier onglet du menu s'ouvre au lieu
    d'une page vide.
- Présences pour les rôles sans écran de saisie (constat F3) : état vide
  explicatif au lieu d'une page blanche (pas de nouvelle fonction).

### D58. Écarts assumés avec la maquette
- Niveaux de tajwīd : seuls `ممتاز`, `متوسط`, `ضعيف` (le modèle n'a pas `مبتدئ`).
  Constat F5 (non corrigé, comportement existant) : le dossier de suivi de
  l'enseignant propose encore la valeur `مبتدئ`, hors du type `TajweedLevel` ;
  elle s'affiche comme `ضعيف` (ton rouge). À trancher : retirer l'option ou
  l'ajouter au modèle.
- « الحضور والغياب » est actif (pas de « قريباً »).
- Pied du menu : texte selon l'état réel de la synchronisation (متزامن / مزامنة /
  غير متصل), et la carte de statistiques de l'ancien menu (même navigation).
- Aucun nom de personne de la maquette n'est repris (données réelles ou fictives
  uniquement). Le nom de l'école est affiché dans la marque du menu.
- Indicateur « الرسوم المحصّلة » : total des cotisations payées (calcul existant),
  sans la mention « هذا الموسم » ; masqué pour les comptes sans accès aux finances.
- Bloc « تحتاج إجراءً » calculé : documents manquants, halaqas sans muḥaffiẓ,
  élèves sans halaqa, cotisations impayées, absence de présences dans la semaine.

### D59. Impressions et cartes aux paramètres de l'école
- Fenêtre d'impression commune (`src/print/printWindow.ts`) : polices de la charte,
  styles de l'application recopiés (les aperçus rendus à l'écran s'impriment tels
  quels), plus de CDN Tailwind ; titre échappé (C-01).
- Cartes d'élève (`src/print/cards/StudentCards.tsx`) : nom, logo, devise,
  adresse, téléphone et saison lus dans les paramètres de l'école. Supprimés : l'adresse
  et le téléphone d'Al Fajr codés en dur, le nom latin « Association El Fajr Jadid »,
  la saison « 1448 » figée. Le QR est désormais généré localement (voir D61).
- Reçu, attestation, rapports (élèves, cotisations) et relevé mensuel de présence :
  gabarits refaits aux couleurs de la charte avec une feuille commune
  (`src/print/docStyles.ts`), le nom, le logo, la devise, le nom du directeur et le
  cachet de l'école ; textes fictifs codés en dur retirés (« حلقات التاج والوقار »,
  « AI-ACAD-2026 »). Toutes les fenêtres passent par `openPrintWindow` ; le garde-fou
  d'échappement (`tests/unit/printTemplates.test.ts`) inspecte toujours chaque
  gabarit. Vérification : `tests/e2e/print.spec.ts` (fenêtres sans CDN, polices de
  la charte, `@media print` de l'application qui masque le cadre).
- Retour arrière : revenir aux fichiers de `src/print/` et à `usePrintActions.ts`
  de `refactor/decoupage-app`.

### D60. Bandeau de quota
- Il affiche le projet et la base de la configuration (`src/config/env.ts`) au lieu
  des identifiants de production codés en dur (constat F4) ; le lien vers la console
  de la production est retiré.

### D61. Codes QR générés localement (constat O-05)
- Contexte : cartes d'élève et badges du personnel appelaient `api.qrserver.com`,
  qui recevait l'identifiant de l'élève, et le nom et la catégorie du membre du
  personnel.
- Décision : bibliothèque npm `qrcode` (1.5.4, sans appel réseau) ; composant
  `src/ui/QrCode.tsx` qui produit un SVG en ligne (même rendu à l'écran et à
  l'impression, l'aperçu étant recopié). Contenu des codes inchangé (identifiant de
  l'élève ; `STAFF:id:nom:catégorie` pour le badge). Le téléphone de secours codé en
  dur sur le badge et sur l'impression d'activité est remplacé par « — ».
- Vérification : `tests/e2e/qr.spec.ts` (aucune requête vers `qrserver`, écran,
  impression de carte, badge) et garde-fou unitaire (aucune mention de `qrserver`
  dans `src/`).
- Reste : le numéro « 06.74.633.108 » sert encore de valeur par défaut dans la
  logique du personnel et des activités (`useStaffState`, `useActivitiesData`) ;
  non modifié ici (logique métier).
- Retour arrière : revenir à la balise `<img>` d'origine dans
  `src/print/cards/StudentCards.tsx` et `StaffBadgeModal.tsx`.

### D62. Impressions compatibles avec une CSP stricte
- Plus de CDN Tailwind ni de script dans les documents imprimés : `openPrintWindow`
  écrit le document puis c'est la fenêtre de l'application qui appelle `print()`
  et `close()` une fois le document et les polices chargés. Seul
  `src/print/printWindow.ts` écrit dans une fenêtre (garde-fou unitaire : aucun
  `document.write` ailleurs, aucun `<script>`, `onload=`, `onerror=` ni CDN
  Tailwind dans `src/`). Le rapport financier (`useFinanceTotals`) passe aussi
  par `openPrintWindow`.
- Reste à faire pour resserrer la CSP de production :
  - styles : blocs `<style>` et attributs `style="…"` (gabarits, échelle des
    cartes, styles de l'application recopiés) : il faut `style-src 'self'
    'unsafe-inline' https://fonts.googleapis.com` ou passer à des nonces/hachages ;
  - polices : `font-src https://fonts.gstatic.com` (Google Fonts) ou polices
    hébergées avec l'application ;
  - images : logos d'école en `data:` ou URL externes (`img-src 'self' data: https:`) ;
  - les fenêtres `about:blank` héritent de la CSP de l'application : la tester sur
    l'émulateur Hosting (`npm run build:dev`) avant tout déploiement.
- Retour arrière : réintroduire le script d'impression dans `printDocument`.

## Intégration du design et du durcissement (branche `integration/design`)

Avancement et reprise : `docs/progress/ETAPE-2-integration.md`.

### D63. Fusion de `main` dans le design, constats F1 et F5, valeurs codées en dur
- **Numérotation** : `main` (durcissement) et `feat/design` avaient tous deux
  utilisé D42 à D51/D52. Les numéros de `main` sont conservés (déjà cités par les
  runbooks et le code) ; ceux du découpage et du design deviennent D52 à D62
  (ancien + 10), renvois mis à jour dans `docs/design/AVANCEMENT.md` et
  `docs/progress/ETAPE-2-design.md`. Les messages de commit antérieurs gardent
  les anciens numéros.
- **Report du durcissement dans l'App découpée** : `subscribeToStaff(schoolId,
  canReadStaffPrivate(role), …)` dans `src/data/useSchoolSync.ts` ;
  `requestAiReport` et `AiReportError.userMessage` dans
  `src/app/actions/useAiActions.ts`. Tests e2e de `main` (`smoke`, `csp`)
  adaptés au nouveau cadre (`loginAs`, `data-tab`). `capture:screens` tourne
  aussi sous la CSP (`E2E_CSP=1`).
- **CSP** : `https://cdn.tailwindcss.com` (script-src) et `https://api.qrserver.com`
  (img-src) retirés, inutiles depuis D61-D62 ; Google Fonts reste autorisé.
  `'unsafe-inline'` est **conservé** dans `script-src` : l'application et ses
  impressions n'en ont plus besoin, mais le retirer demande de vérifier dans un
  navigateur, sur l'émulateur Hosting puis en dev, le build de production et
  reCAPTCHA (App Check) ; le serveur de développement de la suite e2e injecte un
  script en ligne (React Refresh), la variante e2e de la CSP devrait alors
  l'autoriser à part. À faire dans un lot dédié.
- **F1** (D55) : les synchronisations automatiques du nom du directeur
  (`handleSaveProfile`, `handleSaveAppUser`) n'écrivent plus tout l'objet des
  paramètres mais seulement `directorName` (`RealmSimDB.updateSystemSettingsFields`,
  écriture en fusion). Preuve : `tests/e2e/settings-f1.spec.ts` retient
  l'abonnement aux paramètres jusqu'à l'enregistrement du profil ; il échoue sur
  l'ancien code (cotisation 100 → 0) et passe avec le correctif. L'attente de 2 s
  ajoutée dans `tests/e2e/helpers.ts` est retirée. L'enregistrement explicite de
  l'écran des paramètres reste un enregistrement complet (formulaire affiché).
- **F5** (D58) : le dossier de l'enseignant ne propose plus `مبتدئ` ; une valeur
  `مبتدئ` déjà enregistrée s'affiche `ضعيف` (comme ailleurs) jusqu'à la prochaine
  modification. Le modèle `TajweedLevel` est inchangé.
- **Téléphone « 06.74.633.108 »** (D61) : fiches synthétiques du directeur et du
  superviseur (personnel, activités) : téléphone de l'école, sinon vide.
- **Mot de passe par défaut « 123 »** : retiré du bandeau de l'écran des
  utilisateurs, qui décrit désormais ce que fait la mise en correspondance des
  rôles (aucun compte créé ; mot de passe temporaire à la création, par les
  Functions). Garde-fous : `tests/unit/uiGuards.test.ts`.
- **Personnel hors bureau** : les fiches synthétiques portaient des valeurs RH par
  défaut (salaire de 3 500 du directeur, type de contrat) visibles par un
  enseignant autorisé à l'écran du personnel. Les champs RH sont retirés de la
  liste pour les rôles hors bureau (`useStaffState`, `stripStaffPrivate`).
  Preuve : `tests/e2e/integration.spec.ts`.
- **Retour arrière** : `git revert` des commits de `integration/design` postérieurs
  à la fusion (aucune donnée ni règle modifiée).

### D64. Mise en prod par workflows déclenchés par l'orchestrateur
- **Numéro** : D64, D52 à D63 étant pris par le découpage et le design sur `main` ;
  `main` s'arrête à D51, `fix/revue-durcissement` à D56, `integration/design` à D52.
- **Contexte** : le propriétaire ne déroule plus lui-même les runbooks. Il ouvre
  les accès une fois (`docs/GUIDE-MISE-EN-PROD.md` : WIF, comptes
  `github-deploy` et `github-ops`, environnements `dev` et `production`, bucket
  de sauvegarde) ; l'orchestrateur (Claude) lance ensuite des workflows par
  `gh workflow run`, après son « go » à trois moments (simulation du Lot 0,
  rapport de répétition, date de bascule). Dépôt privé sur le forfait GitHub
  gratuit : ni relecteur obligatoire, ni protection de branche. Le Lot 0 vit sur
  `release/lot0` (sans workflows de déploiement, Functions et `firebase.json`
  différents) ; `main` porte le multi-écoles, qui ne doit pas partir avant la bascule.
- **Décision** :
  - les agents n'exécutent toujours aucune commande vers la prod depuis un
    conteneur (CLAUDE.md) ; la prod ne change que par `deploy-lot0.yml`,
    `ops.yml` et `deploy.yml`, séquence et critères d'arrêt dans
    `docs/runbooks/OPERATIONS-CLAUDE.md` ;
  - **garde-fous dans les workflows** (faute de protections GitHub) : production
    lancée depuis le workflow de `main` seulement ; `confirm` = identifiant du
    projet pour toute écriture en prod (et, dans `ops.yml`, pour toute action de
    prod autre que `describe-db` et `verify-counts`, qui lisent des données
    personnelles) ; simulation par défaut ; références de code **fixes**
    (`release/lot0` ou `main`), jamais en entrée ; contrôle que le compte de
    service appartient au projet visé et que `dev` ne vise pas la prod ;
  - `deploy-lot0.yml` : le job sans jeton OIDC extrait `release/lot0`, rejoue
    lint, build et tests présents dans la branche (dont `lint:functions` et les
    tests sur émulateurs), et transmet son SHA au job de déploiement, qui
    déploie exactement ce SHA. Vérifié sur `release/lot0` (625c324) :
    `firebase.json` vise la base nommée, Functions en `europe-west1` codé en
    dur, triggers dans `FIRESTORE_TRIGGER_REGION` lu dans
    `functions/.env.<projet>` (versionné pour la prod seulement : le workflow le
    crée pour le dev ; la variable `FUNCTIONS_TRIGGER_REGION` le surcharge si
    elle est posée) ; aucun secret (la fonction `api` du Lot 0 n'utilise pas
    Gemini) ; build et CLI fonctionnent avec `npm ci --ignore-scripts`. Le
    bundle est contrôlé sur la configuration inlinée par Vite
    (`VITE_FIREBASE_PROJECT_ID`, `VITE_FIRESTORE_DATABASE_ID`,
    `VITE_USE_EMULATORS`), pas sur le texte : `App.tsx` de `release/lot0`
    affiche l'identifiant de la prod dans un bandeau d'aide. Cible `all`
    refusée en prod (ordre du runbook Lot 0 : functions, script, règles, hosting) ;
  - `--force` seulement sur demande (`force=true`) : sans lui, la CLI refuse en
    mode non interactif de supprimer des fonctions absentes du code, ce qui
    protège la prod d'une suppression inattendue ; à la bascule, `deploy.yml`
    doit supprimer `createUserAccount` (Lot 0) : seule modification de
    `deploy.yml`, une entrée `force` (défaut `false`). Sans politique de
    nettoyage des images, la CLI échoue après un déploiement réussi des
    fonctions : `deploy-lot0.yml` change ce seul cas en avertissement ;
  - `ops.yml` : entrées en `choice` (et un booléen), sauf `confirm` (comparé,
    jamais exécuté) et `import_source`, validé par
    `^[0-9]{8}-[0-9]{6}Z-(manuel|avant-lot0-provision|avant-migrate-to-tenants)$`
    avant usage (nom d'export affiché par un run précédent). Aucune expression
    `${{ }}` dans les scripts. `import-firestore` refusé en production. Avant
    `lot0-provision` ou `migrate-to-tenants` appliqués : export complet
    `<horodatage>-avant-<action>` puis, en prod, PITR exigé.
    `rotate_passwords` vaut `none` par défaut (D53) et est passé explicitement
    au script (dont la valeur par défaut est `all`). Super-admin de la
    migration : variable d'environnement `SUPER_ADMIN_USERNAME` (validée), pas
    une entrée ; école migrée fixée à `alfajr` ;
  - **données personnelles** : la sortie des scripts (qui liste les comptes) va
    dans un fichier, jamais dans le journal ; le journal n'affiche qu'une liste
    blanche de champs de `resume.json` (`RESUME_JSON=`, compteurs et codes
    d'anomalie) et, en cas d'échec, les lignes d'erreur générales avec adresses
    et numéros masqués. Rapports : artefact de 3 jours ; mots de passe
    temporaires : artefact séparé d'un jour. Nouveau script
    `scripts/ops/count-collections.ts` (`verify-counts`) : noms de collections,
    identifiants d'école conformes et nombres seulement (test sur émulateurs) ;
  - répétitions sur le dev avec `rotate_passwords=all` : la copie des données
    réelles n'est jamais accessible avec les anciens mots de passe ;
  - `concurrency` : `deploy-<env>` (partagé par `deploy.yml` et
    `deploy-lot0.yml`) et `ops-<env>`, sans annulation en cours ; l'orchestrateur
    attend la fin de chaque run (`gh run watch`) ;
  - actions épinglées par SHA (mêmes versions que D55, plus
    `actions/upload-artifact` v4.6.2), `persist-credentials: false`, jobs à jeton
    OIDC sans cache npm et `npm ci --ignore-scripts` : les deux nouveaux
    workflows passent le garde-fou statique `tests/unit/workflows.test.ts` de
    `fix/revue-durcissement` (essayé localement, non commité ici).
- **Limites** :
  - **forfait gratuit** : selon la documentation GitHub, un dépôt privé ne peut
    pas configurer d'environnements (ni leurs variables) sans GitHub Team ou
    Pro. Si l'étape 3 du guide est impossible, les workflows restent inertes ;
    solution la plus simple : forfait Team pour l'organisation (à décider par
    le propriétaire) ; **remplacé par D75** (variables de dépôt préfixées) ;
  - sans protection de branche, quiconque peut pousser sur `main` peut modifier
    ces workflows : la liste des collaborateurs est la frontière de confiance ;
  - Firebase Auth n'est ni exporté ni copié vers le dev (hachages = secrets) :
    la répétition 1 part de l'export d'avant le Lot 0 (mots de passe encore dans
    `appUsers`), la répétition 2 d'un export frais (comptes absents d'Auth
    comptés dans `pendingAuth`) ; l'import ne purge pas la base de dev ;
  - les retours arrière qui importent dans la prod et les contrôles directs des
    API de la prod (runbook Lot 0 §5.1-5.2) restent faits par un humain ;
  - probable droit manquant à `github-deploy` pour les triggers Firestore
    (`datastore.databases.getMetadata`, lu par la CLI) : à ajouter sur erreur,
    sur le dev d'abord (CI-DEPLOIEMENT.md §3) ;
  - si la condition WIF durcie de D55 est adoptée, y ajouter
    `deploy-lot0.yml` et `ops.yml` (CI-DEPLOIEMENT.md §2) ; fusion à prévoir
    avec `deploy.yml` de `fix/revue-durcissement` (entrée `force`).
- **Non testé sur GitHub** : aucun workflow déclenché. Vérifié localement :
  `actionlint` 1.7.7 (avec shellcheck 0.10.0) sans constat ; garde-fous des
  deux workflows simulés avec des variables factices ; configuration, build et
  contrôle du bundle de `release/lot0` (dev et prod) ; étape de script
  d'`ops.yml` jouée sur les émulateurs (simulation, application avec
  rotation, relance, migration, comptage) sans aucune donnée personnelle dans
  la sortie ; entrées des commandes `gh workflow run` du runbook confrontées
  aux définitions des workflows.
- **Retour arrière** : `gh workflow disable deploy-lot0.yml` / `ops.yml`, ou
  désactivation du fournisseur WIF ; revenir à l'exécution humaine des runbooks
  (`git revert` des commits de `feat/workflows-ops`).

## Revue adversariale du durcissement (branches `fix/revue-durcissement*`)

Rapport : `docs/revues/REVUE-SECURITE-DURCISSEMENT.md`. Avancement :
`docs/progress/ETAPE-2-revue2.md`.

Numérotation : D52 à D63 sont pris par l'intégration du design et D64 par les
workflows de mise en prod (`main`) ; cette revue commence à D65. Sur la branche Lot 0
(`fix/revue-durcissement-lot0`), les mêmes décisions portent d'autres numéros
(D53 est pris par `release/lot0`) : D65 ici = D54 là-bas (R-07), D71 ici = D55
là-bas (R-06).

### D65. Notifications réservées au personnel (R-07)
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

### D66. Scission des fiches à la relance : compléter la fiche RH, ne rien perdre
- **Constat (revue)** : à la relance de la migration, une fiche publique cible
  encore porteuse de champs RH était vidée de ces champs ; si une fiche RH
  existait déjà, rien n'y était recopié. Un champ présent seulement dans la
  fiche publique (ex. contact d'urgence saisi par une version antérieure à
  D42) était donc **supprimé sans copie**. Démontré par
  `tests/emulator/migration.test.ts` (échouait avant le correctif).
- **Décision** : la fiche RH existante fait toujours foi pour ses valeurs ; les
  champs qu'elle n'a pas sont complétés depuis la fiche publique avant leur
  retrait ; une valeur différente donne l'anomalie `STAFF_PRIVATE_CONFLICT`
  (avertissement, noms de champs seulement, aucune valeur dans les rapports).
- **Retour arrière** : revenir au commit précédent du script (la relance
  redevient « fiche RH existante intacte, champs publics retirés »).

### D67. Proxy IA : réponses `no-store` ; hypothèses de contournement des quotas réfutées
- **Revue** : faire payer une autre école en citant son `schoolId`, consommer
  sans droit (famille, bénévole, suspendu, requête incomplète), multiplier les
  comptes d'une école, choisir ses compteurs par le corps de la requête,
  falsifier ou remettre à zéro `aiQuota` depuis le client : **tout est
  refusé** (`functions/test/revue-durcissement.test.ts`,
  `tests/emulator/revue-durcissement-rules.test.ts`). Les compteurs dérivent
  du jeton vérifié et de l'horloge du serveur ; les identifiants de documents
  ne peuvent pas se chevaucher (préfixe de portée, jour de longueur fixe,
  `SCHOOL_ID_PATTERN` sans `_`).
- **Décision (défense en profondeur)** : `POST /api/gemini/analyze` répond
  toujours `Cache-Control: private, no-store` (rapport propre à un élève ; le
  CDN Hosting ne met déjà pas en cache une réponse sans `public`, mais rien ne
  doit dépendre de la règle `no-cache` de `firebase.json`). Vérifié par appel
  direct et à travers le rewrite Hosting (`npm run test:hosting`).
- **Limites acceptées** : un directeur malveillant peut créer des comptes,
  mais reste borné par le quota de son école (300/jour) ; quatre écoles
  ensemble peuvent épuiser le quota global (déni de service du rapport IA,
  sans coût au-delà de la limite) ; le compteur global est un document
  unique (≈ 1 écriture/s soutenue) : au-delà, 503 (fermé par défaut).
- **Retour arrière** : retirer la ligne `res.set?.("Cache-Control", …)`.

### D68. Workflows de déploiement : épinglage, pas d'injection, jeton OIDC confiné
- **Constats (revue)** : `zizmor --offline` sur `feat/durcissement` : 18
  actions non épinglées (dont `google-github-actions/auth` dans les jobs qui
  obtiennent le jeton OIDC), 4 expressions `${{ }}` dans des scripts
  (`inputs.target`, `vars.*`, sorties d'étape : valeurs de type `choice` ou
  posées par un administrateur, donc non exploitables aujourd'hui, mais
  fragiles), 5 `checkout` qui laissent le jeton GitHub dans `.git/config`.
  Plus grave, au niveau de la conception :
  - l'environnement `dev` acceptait **toutes les branches** et servait aux
    aperçus comme aux déploiements complets. Or un workflow lancé à la main
    s'exécute dans la version de la branche choisie : toute personne pouvant
    pousser une branche pouvait déployer règles et fonctions sur le projet de
    dev, donc lire ses données. C'est grave si ce projet reçoit un export réel
    lors des répétitions de bascule (prévu par le rapport, §8) ;
  - dans le job qui détient le jeton OIDC, `npm ci` exécutait les scripts
    d'installation des paquets avec un cache npm partagé ;
  - la condition du fournisseur WIF reposait sur le nom du dépôt
    (réutilisable si le dépôt était supprimé puis recréé par un tiers) et, pour
    la prod, sur la seule règle de branche de l'environnement GitHub.
- **Décision** :
  - actions épinglées par SHA (tag en commentaire), relevés par `git ls-remote` ;
  - toute expression passe par `env` ; `persist-credentials: false` partout ;
  - job à jeton OIDC : `npm ci --ignore-scripts` (aucun script n'est nécessaire,
    vérifié : build, build des Functions, chargement des Functions, CLI
    Firebase), pas de `cache: npm` ;
  - aperçus : environnement `preview` et compte `github-preview` limité au
    Hosting ; build et tests dans un job sans jeton OIDC, publication dans un
    second job qui récupère `dist/` ; durée d'expiration validée ;
  - environnement `dev` (déploiement complet) : branches protégées seulement
    (remplacé par D74 : `main` et les trois workflows prévus, par la condition WIF) ;
    répétitions avec un export réel dans un projet dédié sans fournisseur WIF ;
  - fournisseur WIF : `repository_id` et `repository_owner_id` ; pour la prod,
    en plus `ref == refs/heads/main` et `job_workflow_ref == …/deploy.yml@refs/heads/main` ;
  - garde-fou statique `tests/unit/workflows.test.ts` (épinglage, pas
    d'expression dans `run:`, job OIDC sans cache ni scripts, déclenchement
    manuel, aperçu hors dev/production) ; il échoue sur les workflows de
    `feat/durcissement` (7 tests) ; `actionlint` 1.7.7 et `zizmor` 1.31.1 :
    aucun constat.
- **Limite** : le code des dépendances s'exécute encore dans le job de
  déploiement (build Vite, chargement des Functions par la CLI) ; le
  verrouillage (`package-lock.json`), l'audit en CI et la relecture
  obligatoire de l'environnement `production` restent les protections.
- **Retour arrière** : revenir aux versions précédentes des workflows et du
  runbook (`git revert`) ; l'environnement `preview` et son compte peuvent rester.

### D69. Sauvegardes : suppression bornée aux dossiers d'export, export seul, conservation verrouillable
- **Revue** : hypothèses réfutées (`functions/test/revue-backup.test.ts`) :
  des dossiers plantés datés du futur ne font jamais supprimer un export de
  moins de 30 jours ; une rétention absurde (0, négative, NaN) ne supprime rien ;
  une longue panne laisse toujours les 3 exports les plus récents.
- **Constat (faible)** : la suppression acceptait tout préfixe renvoyé par le
  listage dont le nom se terminait par un horodatage (y compris hors de
  `firestore/<base>/`). Avec un listage GCS normal (délimiteur `/`), ce cas ne
  se produit pas ; mais rien ne le garantissait dans le code.
- **Décision** :
  - code : seuls les préfixes de la forme exacte `firestore/<base>/<horodatage>/`
    sont candidats (`isExportPrefixUnder`) ;
  - runbook : rôle personnalisé « export seul » au lieu de
    `datastore.importExportAdmin` (qui permet aussi l'import, donc l'écrasement
    de la base en service) ; politique de conservation du bucket de 28 jours
    (aucun export récent supprimable, même par un compte compromis), à
    verrouiller après un mois ; rappel que le déployeur peut agir en tant que
    le compte de sauvegarde ; accès aux exports réservé.
- **Retour arrière** : retirer le filtre dans `runBackup` ; retirer la politique
  de conservation (`--clear-retention-period`, impossible une fois verrouillée).

### D70. Build de production : refus d'un jeton de débogage App Check venu de `.env.local`
- **Constat (revue, moyenne)** : le runbook App Check (§2) et `.env.example`
  demandaient de mettre le jeton de débogage dans `.env.local`. Or Vite charge
  `.env.local` dans tous les modes, y compris `npm run build`, et le runbook
  (§3) fait construire la prod sur le même poste. Le jeton serait alors publié
  dans le bundle et le client basculerait sur le fournisseur de débogage :
  si ce jeton est enregistré sur le projet visé, App Check est contourné par
  quiconque lit le bundle ; sinon, toutes les requêtes sont « non vérifiées »
  et l'application cesse de fonctionner le jour où App Check est appliqué.
  Démontré par `tests/unit/buildGuards.test.ts` (chargement réel par `loadEnv`).
- **Décision** : `vite.config.ts` refuse un build de production qui porte
  `VITE_APPCHECK_DEBUG_TOKEN` (ou des émulateurs avec un vrai projet), sauf
  `ALLOW_APPCHECK_DEBUG_IN_BUILD=true` explicite dans l'environnement du
  processus (projet de dev seulement). Le jeton va dans
  `.env.development.local` (runbook et `.env.example` corrigés).
- **Retour arrière** : retirer l'appel à `productionBuildProblems` dans `vite.config.ts`.

### D71. R-06 sur le Lot 0 : pas de mesure minimale par les règles, décision documentée
- **Question** : sur `fix/lot0-securite`, les salaires et CIN restent dans
  `teachers`, lisible par `isEducator()` (مدير, إداري, مؤطر, مدرس). Une mesure
  courte serait-elle sûre, par exemple ne plus lire `teachers` hors bureau ?
- **Analyse du code du Lot 0** (`src/App.tsx`) :
  - le tableau de bord de l'enseignant (مدرس) retrouve SA fiche
    (`activeTeacher`) dans la liste `teachers`, par `linkedTeacherId` ou, à
    défaut, par nom identique ; ses halaqas (`teacherClasses`) en dépendent ;
  - les noms des enseignants s'affichent pour la pédagogie dans les halaqas,
    les examens (`examinerId`), les cartes et attestations ;
  - le مؤطر crée les halaqas et choisit leur enseignant dans cette liste.
  Fermer `teachers` hors bureau casse donc le tableau de bord de l'enseignant
  et l'affectation des halaqas. Une lecture « sa seule fiche » (`get` sur
  `linkedTeacherId` d'`authLinks`) exigerait de remplacer l'abonnement à la
  collection pour ces rôles et de supprimer le repli par nom : c'est une
  modification de l'interface et de la session, pas un correctif court ; et la
  fiche de l'enseignant contiendrait toujours son propre salaire. Les règles
  ne filtrent pas des champs : seule la scission (D42) corrige vraiment.
- **Décision** : aucune modification du Lot 0 pour R-06 ; risque accepté pour
  la seule durée entre le Lot 0 et la bascule (qui apporte `staffPrivate`,
  D42). Mesures d'organisation recommandées au directeur : informer le
  personnel que ces champs sont visibles par l'équipe pédagogique jusqu'à la
  bascule ; ne pas compléter de nouvelles CIN ni de nouveaux salaires dans
  l'application avant la bascule si ce n'est pas nécessaire ; garder court
  l'intervalle entre les deux opérations. Test documentaire conservé :
  `tests/emulator/revue-rules.test.ts` (Lot 0) › R-06.
- **Retour arrière** : sans objet.

### D72. Le compte super-admin n'est jamais désactivé automatiquement
- **Constat (revue, moyenne)**, découvert en préparant l'accueil d'une
  deuxième école : l'interface crée une école avec `makeMeDirector` (le
  super-admin en devient directeur pour y créer le vrai directeur). Quand on
  retire ensuite le super-admin de cette école, `setMemberRole` (retrait)
  désactive le compte Auth s'il n'a plus aucune école ; c'est le cas d'un
  super-admin dédié (D25, recommandé). Le parcours normal d'accueil bloquait
  donc le compte de l'administrateur de la plateforme. De même, un directeur
  pouvait le bloquer volontairement : retrait, ou lien vers une fiche du
  personnel puis archivage de la fiche (trigger d'archivage). Démontré par
  `functions/test/revue-durcissement.test.ts` › D72 (échouait avant).
- **Décision** : `isSuperAdminAccount(uid)` (claim `superAdmin`) : jamais de
  désactivation automatique d'un tel compte, ni au retrait de sa dernière
  école, ni à l'archivage. L'appartenance est bien retirée ou suspendue. Le
  super-admin se désactive seulement à la main (console, par un humain).
- **Retour arrière** : retirer les deux appels à `isSuperAdminAccount`.

### D73. Import d'élèves par CSV pour une nouvelle école
- **Évaluation** : une école qui arrive avec 100 à 300 élèves sur un tableur
  devrait sinon les saisir un par un. Un import est simple à écrire si l'on
  s'en tient aux élèves : pas de comptes, pas de paiements réels, pas de photos.
  Ces trois points restent manuels, car ils touchent la sécurité, la finance
  ou la taille des documents.
- **Décision** : `scripts/admin/import-students.ts` (Admin SDK). Garde-fous :
  - ceux des scripts existants : `--project` obligatoire, simulation par
    défaut, `--confirm-prod` et `--database` hors émulateur ;
  - école et paramètres existants exigés ;
  - écriture par `create` seulement, sans jamais toucher un document existant ;
  - validation stricte : genre, dates réelles, hizb de 0 à 60, niveau de
    tajwid, longueurs, caractères de contrôle ;
  - halaqa désignée par son identifiant, ou par son nom EXACT et unique,
    jamais de correspondance approximative ;
  - refus d'une colonne de mot de passe ;
  - doublons détectés dans le fichier et dans l'école (nom complet + date de
    naissance), ce qui rend la relance idempotente ;
  - une anomalie bloque tout, sauf `--skip-invalid` ;
  - identifiants `S-<n>` selon la même règle que l'interface ;
  - cotisations « غير مدفوع » créées seulement avec `--payments=ui`
    (comportement de l'interface) ;
  - rapport sans nom ni téléphone (numéros de ligne, identifiants, codes).
- **Tests** : `tests/emulator/import-students.test.ts` (CSV fictif
  `tests/fixtures/eleves-fictifs.csv`, modèle `scripts/admin/templates/eleves-modele.csv`).
- **Limite** : un élève créé dans l'interface PENDANT l'import peut prendre le
  même identifiant. Le lot échoue alors (`create`) et la relance reprend :
  importer avant d'ouvrir l'école aux utilisateurs.
- **Retour arrière** : les élèves importés portent `importBatch` ; les
  supprimer par l'Admin SDK (un humain) ou depuis l'interface.

### D74. Workflows de mise en prod (D64) : dev protégé comme la prod, artefacts chiffrés
- **Constats (revue, après fusion de `feat/workflows-ops`)** :
  - **dev = données réelles** (élevée). `ops.yml` › `import-firestore` copie
    un export de la prod dans le dev, dont l'agent de service lit le bucket de
    la prod. Or la condition WIF (`repository` + `environment`) délivrait un
    jeton à **toute branche** qui déclare `environment: dev`, puisqu'un
    `workflow_dispatch` exécute le fichier de la branche choisie et que le
    forfait gratuit n'offre aucune règle de branche d'environnement. Toute
    personne ou tout agent capable de pousser une branche pouvait donc obtenir
    `github-ops` (dev) et lire la copie des données réelles. Avant D68, les
    aperçus partageaient en plus cet environnement ;
  - **artefacts** (moyenne). Les rapports, avec identifiants et anomalies, et
    les mots de passe temporaires (répétitions sur le dev avec
    `rotate_passwords=all`) étaient envoyés en clair. Un artefact est lisible
    par tout compte qui lit le dépôt, jetons d'agents compris : la consigne
    « ne jamais télécharger » n'était qu'une règle ;
  - le fournisseur de la prod acceptait aussi n'importe quelle branche
    déclarant `production`. Les garde-fous `github.ref` des workflows ne valent
    que pour les fichiers de `main`.
- **Décision** :
  - condition WIF identique pour le dev et la prod : dépôt, environnement,
    `ref == refs/heads/main` et `job_workflow_ref` dans
    {`deploy.yml`, `deploy-lot0.yml`, `ops.yml`}`@refs/heads/main`
    (`GUIDE-MISE-EN-PROD.md` étape 2, `CI-DEPLOIEMENT.md` §2) ;
  - aperçus : second fournisseur du seul projet de dev (`environment == preview`)
    et compte `github-preview`, limité au Hosting ;
  - `ops.yml` : chiffrement GnuPG des artefacts pour la clé publique
    `ARTIFACT_GPG_PUBLIC_KEY` (la clé privée reste chez le propriétaire),
    avertissement s'il n'y en a pas, et **refus** d'un remplacement de mots de
    passe appliqué sans cette clé ; testé localement (chiffrement, puis
    déchiffrement par la seule clé privée) et par le garde-fou statique
    `tests/unit/workflows.test.ts`.
- **Limites (forfait gratuit)** : quiconque peut pousser sur `main` peut changer
  ces workflows et les lancer : le droit d'écriture reste la frontière de
  confiance (D64). Recommandation : forfait Team (protection de `main`,
  relecteurs d'environnement, `CODEOWNERS`) ou, à défaut, accès en écriture
  limité au propriétaire et aux jetons qui en ont besoin.
- **Retour arrière** : `update-oidc` avec l'ancienne condition ; retirer
  l'étape de chiffrement d'`ops.yml`.

### D75. Condition WIF sans environnement GitHub, `principalSet`, workflows pour Team et Free
- **Contexte** : l'organisation est peut-être sur le forfait GitHub **Free**.
  Documentation GitHub (« Managing environments for deployment », lue le
  22/10/2026) : « Users with GitHub Free plans can only configure environments
  for public repositories » ; Team et Pro le peuvent pour un dépôt privé. Or
  D74 reposait sur les environnements : condition WIF
  `assertion.environment == '<env>'`, autorisation sur le sujet
  `repo:<dépôt>:environment:<env>`, variables d'environnement. L'orchestrateur
  a fait exécuter par le propriétaire une nouvelle spécification Google Cloud et
  GitHub (`docs/PROMPT-NAVIGATEUR.md`).
- **Décision (Google Cloud, spécification de l'orchestrateur)** :
  - condition du fournisseur, identique pour le dev et la prod, sans
    environnement : `assertion.repository == dépôt && assertion.ref ==
    'refs/heads/main' && assertion.job_workflow_ref in [deploy.yml,
    deploy-lot0.yml, ops.yml @refs/heads/main]` ;
  - `iam.workloadIdentityUser` sur `github-deploy` et `github-ops` accordé à
    `principalSet://…/workloadIdentityPools/github/attribute.repository/quran-school-org/quran-school-app`
    (au lieu de `principal://…/subject/repo:…:environment:<env>`, retiré par le
    bloc, rejouable sans risque) ;
  - dev et prod séparés par des projets GCP distincts, chacun avec son pool.
  Raisons : un jeton de job sans `environment:` n'a ni revendication
  `environment` ni sujet `…:environment:…` ; la condition garde ce qui protège
  vraiment (branche `main` et fichier de workflow), et elle fonctionne quel que
  soit le forfait.
- **Décision (workflows)** :
  - `deploy.yml`, `deploy-lot0.yml`, `ops.yml` : job `configuration` (sans jeton,
    sans environnement) qui choisit le mode : `environnement` si
    `USE_GITHUB_ENVIRONMENTS == 'true'` ou si aucune variable de dépôt
    `DEV_FIREBASE_PROJECT_ID` / `PROD_FIREBASE_PROJECT_ID` n'existe (Team,
    Enterprise : rien à changer à la configuration du prompt) ; `prefixe` si
    `USE_GITHUB_ENVIRONMENTS == 'false'` ou si l'une d'elles existe (Free).
    Toute autre valeur de `USE_GITHUB_ENVIRONMENTS` arrête le workflow ;
  - **deux jobs jumeaux** à jeton OIDC : `deployer` / `operation` avec
    `environment: ${{ inputs.environment }}`, et
    `deployer-sans-environnement` / `operation-sans-environnement` **sans** ce
    mot-clé ; mêmes permissions, variables et étapes par ancres YAML
    (documentées par GitHub, « Reusing workflow configurations ») ; conditions
    `if:` exclusives. Écarté : `environment: ${{ cond && 'dev' || '' }}`, car la
    documentation GitHub ne dit pas comment un nom vide est traité (le
    fonctionnement est seulement rapporté par des utilisateurs), ni ce qui se
    passe quand un job déclare `environment:` dans un dépôt privé en Free (elle
    dit seulement qu'un environnement référencé inexistant est créé). Écarté
    aussi : un workflow réutilisable, qui changerait `job_workflow_ref` et
    sortirait de la condition WIF ;
  - variables lues par une **sélection gardée**, sans index calculé (constat
    `obfuscation` de zizmor) ni repli d'un préfixe sur l'autre :
    `(prefix == 'DEV_' && vars.DEV_X) || (prefix == 'PROD_' && vars.PROD_X) ||
    (prefix == '' && vars.X) || ''`, où `prefix` vient de `inputs.environment`
    (`dev` → `DEV_`, `production` → `PROD_`) en mode `prefixe` et vaut `''` en
    mode `environnement`. Contrôle explicite dans le garde-fou : couple
    mode / environnement / préfixe revérifié, et refus si le projet, le
    fournisseur WIF, le compte de service ou le bucket est égal à la variable
    préfixée de l'**autre** environnement ;
  - garde-fous conservés dans les deux modes : production depuis `main`,
    `confirm` = projet, compte de service du projet visé, `dev` jamais vers la
    prod, code fixe, artefacts chiffrés, aucune expression dans les scripts,
    actions épinglées par SHA. Ajoutés à `deploy.yml` (déjà présents dans les
    deux autres) : compte de service du projet visé, production égale à
    `gen-lang-client-0481880143`, format de l'identifiant ; ajouté à
    `deploy-lot0.yml` : production égale à `gen-lang-client-0481880143` ;
  - `ARTIFACT_GPG_PUBLIC_KEY` : préfixée, sinon variable de dépôt (ou
    d'environnement en mode `environnement`) ; c'est une clé publique ;
  - région des triggers Firestore (bases de dev et de prod en `europe-west2`) :
    `FUNCTIONS_TRIGGER_REGION` (`DEV_` en Free) est **obligatoire** pour le dev
    dans `deploy.yml` et `deploy-lot0.yml`, sans repli sur `europe-west1`
    (ancienne valeur codée en dur, incompatible avec une base en
    `europe-west2`) ; elle remplace la région du fichier
    `functions/.env.<projet>`. En production, la région vient du fichier
    versionné (corrigé à part par l'orchestrateur), ou de
    `PROD_FUNCTIONS_TRIGGER_REGION` si elle est posée ; les deux workflows
    exigent une seule ligne `FIRESTORE_TRIGGER_REGION` valide avant de déployer ;
  - `preview.yml` : job `disponibilite` (sans environnement) qui, en mode
    `prefixe`, arrête le workflow avec un message clair avant tout job qui
    déclare `environment: preview` ; inchangé en Team ;
  - aperçus : le fournisseur `preview` passe dans un **pool séparé**
    (`github-apercus`, guide étape 2). `principalSet://…/workloadIdentityPools/github/attribute.repository/…`
    vaut pour tout fournisseur du pool `github` : un fournisseur d'aperçus dans
    ce pool (ancienne version du guide) donnerait `github-deploy` et
    `github-ops` du dev à toute branche déclarant `environment: preview` ;
  - garde-fou statique `tests/unit/workflows.test.ts` étendu (jumeaux par
    alias, sélection des préfixes, absence d'index calculé, arrêt des aperçus).
- **Risques** :
  - la séparation dev / prod ne repose plus sur l'environnement GitHub mais sur
    les **projets GCP distincts** (un jeton accepté par le pool du dev ne donne
    rien sur la prod) et sur la **logique des workflows de `main`** (préfixe ou
    environnement choisi par `inputs.environment`, contrôle croisé, projet de
    prod vérifié). Quiconque peut modifier ces trois workflows sur `main` peut
    viser l'un ou l'autre projet : c'était déjà le cas (D64, D74) ;
  - le pool `github` doit ne contenir que le fournisseur `quran-school-app`
    (contrôle dans CI-DEPLOIEMENT.md §8) ;
  - **hypothèse non vérifiée** : le mappage du prompt contient
    `attribute.environment=assertion.environment`, revendication absente du
    jeton d'un job sans `environment:`. La documentation Google consultée ne
    dit pas si un mappage sur une revendication absente fait échouer
    l'échange. Si le premier run Free échoue sur ce point, retirer
    `attribute.environment` du mappage du fournisseur (rien ne l'utilise) ;
  - non testé sur GitHub (aucun workflow déclenché) : comportement réel des
    ancres YAML et des jobs « skipped », revendication `job_workflow_ref`.
- **Vérifié localement** : `actionlint` 1.7.12 (shellcheck 0.11.0) sans
  constat (dont SC2174 corrigé dans `ops.yml`) ; `zizmor` 1.31.1 `--offline`
  sans constat, et en persona `pedantic` les 2 mêmes constats informatifs que
  `main` (`ci.yml`) ; zizmor lit les alias (une injection volontaire dans une
  étape ancrée est signalée deux fois) ; simulation des étapes `configuration`
  et `Garde-fous` des trois workflows, avec un mini-évaluateur des expressions
  `${{ }}`, en Team et en Free (variables factices) : cas nominaux, refus hors
  `main`, sans `confirm`, `PROD_` absentes (aucun repli sur `DEV_`),
  configurations croisées, dev vers la prod, compte d'un autre projet, clé GPG
  de dépôt / préfixée / de l'autre environnement ; étape de chiffrement jouée
  avec une clé jetable ; `npm run lint`, `npm test`, `npm run build`.
- **Retour arrière** : côté Google, `update-oidc` avec la condition de D74 (avec
  `assertion.environment=='<env>'`) et autorisation par sujet
  `principal://…/subject/repo:…:environment:<env>` à la place du `principalSet`
  (Team ou Enterprise seulement) ; côté GitHub, `USE_GITHUB_ENVIRONMENTS=true`
  force le mode environnement sans changer de code, ou `git revert` des
  commits de `feat/workflows-sans-environnements`.

### D76. Retrait du rapport IA (Gemini) ; fonction `api` réduite à `/api/health`
- **Contexte** : décision du propriétaire (22/10/2026) : l'école n'utilise
  pas l'IA et il n'y aura pas de clé Gemini. Or `api` déclarait
  `defineSecret("GEMINI_API_KEY")` : sans ce secret dans Secret Manager, le
  déploiement des Functions échoue.
- **Décision** : retrait complet de la fonctionnalité.
  - Interface : bouton « تحليل تقدم الطالب بالذكاء الاصطناعي », panneau du
    rapport, état `aiReport` / `aiLoading` / `aiError`, `useAiActions`,
    mention de l'IA dans la fiche vide de l'élève. Le reste du design est
    inchangé (seul le bloc du bouton disparaît de la carte).
  - Client : `requestAiReport`, `AiReportError`, `describeAiReportStatus`,
    `apiUrl`, `getIdToken`, `getAppCheckHeader` (utilisés par le seul rapport),
    variable `VITE_API_BASE_URL` (`src/config/env.ts`, `.env.*`, workflows
    `deploy.yml` et `preview.yml`). Aucun secret n'était versionné :
    `.env.example` ne portait qu'un `GEMINI_API_KEY=""` vide, retiré.
  - Functions : proxy Gemini, `aiQuota.ts` (compteurs à la racine, sans règle
    dédiée : la racine est fermée), vérification App Check de l'en-tête HTTP
    (`appCheckStateOf`, `checkAppCheckHeader`), dépendance `@google/genai`
    (lockfile régénéré par `npm uninstall`), paramètres `AI_*` et
    `GEMINI_MODEL`. `APPCHECK_ENFORCE` reste pour les callables (D44).
  - **`api` gardée, minimale** : `GET /api/health`, 404 pour tout le reste,
    aucun secret, pas de CORS. Raisons : le rewrite `/api/**` de
    `firebase.json` vise `api` (un rewrite vers une fonction absente fait
    échouer le déploiement Hosting) ; `release/lot0` déploie déjà une `api`
    identique, la bascule ne supprime donc aucune fonction ; `firebase.json`,
    la CSP et `npm run test:hosting` restent cohérents sans changement de
    configuration. La CSP n'est pas modifiée (`*.cloudfunctions.net` sert aux
    callables).
  - Tests : `aiQuota.test.ts` et les tests du proxy (D43, D67) retirés ;
    remplacés par : santé, ancienne route `/api/gemini/analyze` → 404 (appel
    direct, émulateur Functions, rewrite Hosting), aucun document `aiQuota`
    créé, fiche d'élève sans mention de l'IA ni appel à `/api/` (Playwright).
  - Docs : étape « Clé Gemini » retirée de `GUIDE-MISE-EN-PROD.md` (étapes
    renumérotées 1 à 6), rôle `roles/secretmanager.viewer` retiré (il ne
    servait qu'à vérifier `GEMINI_API_KEY`) du guide, de
    `PROMPT-NAVIGATEUR.md` et de `CI-DEPLOIEMENT.md` ; runbook `PROXY-IA.md`
    supprimé ; `MIGRATION-BASCULE.md`, `CLE-API-WEB.md`, `NOUVELLE-ECOLE.md`,
    `APP-CHECK.md`, `LOT0-DEPLOIEMENT.md`, `OPERATIONS-CLAUDE.md` et
    `conformite/CNDP.md` (plus de transfert vers Gemini, T6 supprimé) mis à
    jour. Les décisions D43, D44 (partie `api`), D67 et les rapports
    historiques restent tels quels : ils décrivent l'état d'alors.
- **Non retiré** : l'activation de `secretmanager.googleapis.com` dans le bloc
  du guide (sans effet, laissée pour ne pas rejouer le bloc) ; la mention, dans
  `LOT0-DEPLOIEMENT.md`, de la clé Gemini de l'**ancien** service Cloud Run
  d'AI Studio (O-01, S7) : elle reste à supprimer après l'arrêt de ce service.
- **Réintroduire l'IA** : partir de `9c031e6` (dernier `main` avec le
  rapport) ou `git revert` des commits de `feat/retrait-rapport-ia`
  (« Functions : retrait du proxy Gemini… », « Interface : retrait du rapport
  IA… », puis celui des docs). Avant le déploiement : créer le secret
  `GEMINI_API_KEY` dans Secret Manager (prod et dev), remettre les `AI_*` dans
  `functions/.env.<projet>`, le rôle `secretmanager.viewer` du compte de
  déploiement, le runbook `PROXY-IA.md` et le traitement T6 de `CNDP.md`
  (consentement des représentants légaux).

### D77. École de démonstration `demo` sur le dev (`ops.yml` › `seed-demo`), supprimée avant toute copie réelle
- **Contexte** : le Lot 0 est en prod (ancien design) ; le nouveau design et le
  multi-écoles sont sur `main`, pas encore en prod. Le propriétaire veut
  essayer lui-même le nouveau design dans un navigateur, avec des
  identifiants. Le projet de dev `fajr-c4c6e` sert à cela, et servira ensuite
  aux répétitions de migration avec une **copie des données réelles** (§4 du
  runbook de l'orchestrateur). Aucune commande n'est lancée vers un vrai
  projet depuis un conteneur : tout passe par `ops.yml` (D64).
- **Décision (script `scripts/dev/seed-demo.ts`, Admin SDK)** :
  - école d'identifiant fixe `demo`, nom « مدرسة تجريبية (بيانات وهمية) »,
    marquée `demo: true` ; données **fictives** du jeu des émulateurs
    (`scripts/dev/fixtures/legacy-alfajr.ts`) écrites directement au format
    multi-écoles (`schoolId` dans chaque document, fiches RH dans
    `staffPrivate`) : 10 élèves, 5 membres du personnel (3 fiches RH), 2
    halaqas, présences, examens, suivi, paiements, recettes, dépenses,
    salaire, activité (participants, dépenses), notification, paramètres de
    cotisation de l'école n°1. Exclus : l'élève à la photo de ~950 Ko et à la
    halaqa orpheline (S-111) et la présence orpheline (S-999), qui ne servent
    qu'aux tests de migration ;
  - un compte par rôle principal : `demo_directeur` (مدير), `demo_admin`
    (إداري, fiche t2), `demo_enseignant` (مدرس, fiche t1, halaqa c1),
    `demo_parent` (ولي أمر, élèves S-101 et S-102), `demo_eleve` (طالب, S-109) ;
    emails techniques `@comptes.kuttab.local`, registre `usernames`, profil
    `users/{uid}` avec `schoolIds: ["demo"]` et membre de `schools/demo`
    **seulement** ; droits par défaut du rôle (`permissions: null`) ; claims
    Auth **vidés** à chaque passage (jamais de `superAdmin`), puis contrôlés
    (aucun claim, aucune autre école) ; `mustChangePassword: false` (comptes
    de démonstration, mots de passe renouvelés à chaque relance) ;
  - mots de passe **aléatoires** de 19 caractères
    (`generateTemporaryPassword(4)`, même alphabet CSPRNG que le Lot 0 :
    environ 79 bits), écrits dans le seul fichier secret
    `seed-demo-<horodatage>/mots-de-passe-temporaires.csv` (mode 600), jamais
    dans Firestore ni dans la sortie ;
  - **idempotent** : une relance supprime récursivement `schools/demo`, la
    réécrit, donne de nouveaux mots de passe aux comptes `demo_*`, révoque
    leurs sessions et les réactive ;
  - **refus** : projet `gen-lang-client-0481880143` (et base de la prod),
    contrôlé **avant** toute autre vérification, sans option pour passer
    outre (une option inconnue, `--force` compris, est refusée) ;
    `--project` obligatoire ; simulation par défaut ; sur un vrai projet,
    `--database` et `--confirm-prod=<projet>` (`scripts/admin/lib/cli.ts`) ;
    refus si un compte `demo_*` est membre ou profil d'une autre école, si son
    nom désigne un autre compte (registre) ou existe au domaine historique ;
  - `--remove` : supprime `schools/demo`, puis les comptes `demo_*` (Auth,
    `users`, `usernames`), avec les mêmes contrôles (jamais un compte membre
    d'une autre école) ;
  - exception assumée à « les comptes ne s'écrivent que par les Cloud
    Functions » : script Admin SDK, comme la migration, limité au dev et aux
    émulateurs.
- **Décision (`ops.yml`)** : actions `seed-demo` et `remove-demo`, refusées en
  production dans le job de garde-fous (et revérifiées dans l'étape du
  script) ; code de `main` ; `apply=true` et `confirm` = identifiant du projet
  de dev **exigés** ; `seed-demo` exige la clé publique
  `ARTIFACT_GPG_PUBLIC_KEY` : le fichier des mots de passe part dans
  l'artefact `mots-de-passe-temporaires-*` chiffré (D74), 1 jour ; journal
  dans le rapport chiffré, seuls les compteurs (`RESUME_JSON`) dans les
  journaux. `import-firestore` lit le document `schools/demo` (API REST
  Firestore, code HTTP seulement) et **refuse** l'import s'il existe ou si la
  lecture échoue.
- **Choix : supprimer l'école `demo` avant la copie des données réelles**
  (plutôt que la garder isolée à côté). Raisons :
  - dès la copie, le dev est traité comme la prod (D74) ; chaque compte de
    démonstration y serait un identifiant de plus, dont les mots de passe
    circulent plus librement (essais, démonstrations à des tiers) ;
  - l'isolation entre écoles repose sur les règles et les Functions que les
    répétitions doivent justement valider : un défaut d'isolation donnerait
    alors aux comptes de démonstration un accès à des données réelles
    d'élèves mineurs ;
  - la répétition doit reproduire la prod (`verify-counts`, registre des
    noms, anomalies de la migration), sans école ni comptes étrangers.
  Mise en œuvre par construction : `remove-demo` (runbook §4, étape 4.0),
  refus de `seed-demo` dès que la base contient autre chose que `demo`
  (collections racine, autre école, autres comptes), refus
  d'`import-firestore` tant que `schools/demo` existe. Une démonstration après
  les répétitions demande donc un dev vidé ou un autre projet.
- **Vérifié localement** (émulateurs, `tests/emulator/seed-demo.test.ts`) :
  données et comptes créés, connexion par rôle, droits par rôle dans `demo`
  et aucun accès à `alfajr` ni `annour` (règles), aucun claim `superAdmin`,
  relance (données remplacées, anciens mots de passe refusés, claim et
  désactivation annulés), conflits de comptes, suppression sans toucher aux
  autres écoles, refus de la prod (arguments et script lancé), mots de passe
  absents de la sortie et du résumé ; garde-fou d'`ops.yml` joué avec bash
  sur des variables factices (`tests/unit/workflows.test.ts`) ; `actionlint`
  et `zizmor --offline` sans nouveau constat.
- **Non testé sur GitHub** : aucun workflow déclenché ; la lecture REST de
  `schools/demo` avec le jeton de `github-ops` (`datastore.user`) et
  l'Admin SDK sur le dev (`firebaseauth.admin`) ne sont pas essayés.
- **Retour arrière** : `remove-demo` sur le dev, puis `git revert` des
  commits de `feat/demo-dev` (script, actions d'`ops.yml`, tests, docs).

### D78. Logo temporaire de l'école (favicon, icônes, écran de connexion)
- **Contexte** : l'école n'a pas encore de logo définitif ; `public/favicon.svg`
  ne correspondait pas à la charte « لوحة الكتّاب ». Un logo temporaire a été
  dessiné dans la charte (`design/logo-temporaire/` : étoile à huit branches
  dorée `#D4A017` sur fond nuit `#102446`, livre ouvert au centre).
- **Décision** :
  - `public/favicon.svg` (logo temporaire), `favicon.ico` (32 px),
    `apple-touch-icon.png` (180 px), `icon-192.png` et `logo.svg` (512 px)
    sont servis par Hosting ; `index.html` déclare l'icône svg et ico,
    l'`apple-touch-icon` et `theme-color` `#102446`. `icon-192.png` est prêt
    pour un futur manifeste (aucune balise sans manifeste) ;
  - `LoginScreen` affiche `logo.svg` dans la tuile centrale quand les
    paramètres de l'école n'ont pas de logo (`associationLogo`), à la place de
    l'`Emblem` seul ;
  - la barre latérale (`AppFrame` → `NavBrand`), le panneau nuit de la
    connexion, `SchoolPicker`, `SessionCheckingScreen`, les cartes et les
    impressions gardent l'`Emblem` : à 44-56 px sur fond nuit, l'étoile pleine
    de l'`Emblem` est plus lisible que le logo, dont le livre central devient
    illisible à cette taille ;
  - garde-fous : `tests/unit/hostingHeaders.test.ts` (balises et fichiers) et
    `tests/hosting/rewrite.test.ts` (fichiers servis par Hosting, pas réécrits
    vers `index.html`). La CSP n'a pas à changer (`img-src 'self'`, polices
    déjà autorisées).
- **À faire** : remplacer ce logo temporaire par le **vrai logo de l'école**,
  saisi dans **Paramètres** (`associationLogo`) ; il remplace alors le logo
  temporaire sur l'écran de connexion et dans la barre latérale. Le favicon
  et les icônes restent ceux de `public/` jusqu'à leur remplacement par des
  fichiers définitifs (mêmes noms, mêmes tailles).
- **Lot 0** : décision équivalente D56 sur `feat/lot0-connexion-charte`
  (branche issue de `release/lot0`), où l'écran de connexion reprend en plus la
  charte de `LoginScreen`.
- **Retour arrière** : `git revert` des commits de `feat/logo-favicon`
  (l'ancien favicon et l'`Emblem` de la tuile de connexion reviennent).

### D79. Traduction française de TEST (sélecteur AR / FR), dev seulement
- **Contexte** : le propriétaire, francophone, veut tester l'application
  multi-écoles en français. C'est **temporaire** : la traduction sera retirée
  de la version finale. Elle ne doit changer ni la logique ni les données
  (valeurs de rôles en arabe, `value` des `<select>`, saisies, noms), ni le
  design arabe, ni les ~115 fichiers d'écrans, et doit se retirer en un geste.
- **Décision : une couche d'affichage posée sur le DOM**, isolée dans
  `src/i18n-test/` (plutôt qu'une bibliothèque i18n, qui aurait imposé de
  modifier chaque écran puis de tout défaire) :
  - `fr.ts` : dictionnaire arabe → français (1 933 entrées) ; clé = chaîne
    arabe exacte, espaces normalisés ; une clé avec `{0}`, `{1}`… est un
    **motif** (gabarits `${…}` : nombres, noms, dates) ; une valeur capturée
    est traduite si elle est elle-même au dictionnaire (rôle, mois, statut),
    sinon reprise telle quelle. Les dates formatées (mois, jours) sont
    traduites mot à mot. Un motif « faible » (texte fixe de moins de 4
    lettres : « {0} و{1} », « {0} ({1}) ») est écarté si ses valeurs sont de
    l'arabe inconnu (une citation ne devient pas « … et … ») ;
  - `dom.ts` : un `MutationObserver` sur `<body>` modifie **en place**
    (`nodeValue`) les nœuds texte reconnus, sans jamais remplacer ni insérer
    de nœud : React continue de les mettre à jour, et chaque mise à jour est
    retraduite. Attributs traduits : `placeholder`, `title`, `aria-label`,
    `alt`, `label` des options. Texte des `<option>` traduit, **valeur
    jamais** : une option sans attribut `value` reçoit d'abord sa valeur arabe
    d'origine (sinon sa valeur suivrait le texte). Jamais touchés : valeur des
    `input`/`textarea`, contenu `contenteditable`, `script`/`style`, et tout ce
    qui est sous `[data-no-translate]`. Retour en AR : chaque texte et attribut
    traduit reprend sa valeur arabe ; l'observateur ne tourne pas en AR (DOM
    de `#root` identique à celui sans le module) ;
  - boîtes natives `alert` / `confirm` / `prompt` : en FR, seul leur message
    est traduit (la valeur par défaut d'un `prompt`, une donnée, ne l'est pas) ;
  - `<html lang="fr" dir="ltr">` en FR ; `fr.css` inverse le sens des
    conteneurs qui portent `dir="rtl"` ou `style="direction: rtl"` en dur, et
    quelques alignements (`text-right`, icône de déconnexion), **uniquement
    sous `html[lang="fr"]`** ;
  - sélecteur « TEST · AR · FR » (`switcher.ts`) : petit élément autonome
    ajouté à `<body>`, hors de l'arbre React, dans le coin bas du côté de la
    zone principale ; présent sur l'écran de connexion, le choix d'école et
    dans l'application. Choix initial : au centre de la barre du haut, mais la
    barre s'allonge en français et le sélecteur y masquait la pastille de
    synchronisation à 1 440 px ; l'insérer dans `src/shell/` aurait ajouté des
    imports (et du code dans le bundle de prod) à défaire au retrait. Choix
    mémorisé dans `localStorage` (`i18n-test:lang`, hors des préfixes vidés à
    la déconnexion, accès protégés) ;
  - chaîne sans traduction : l'arabe reste affiché ; en `npm run dev`,
    `console.debug("[i18n-test] sans traduction : …")` une fois par chaîne
    (et `window.__frTestMissing` pour les tests).
- **Drapeau de build `VITE_ENABLE_FR_TEST`** (lu par `src/config/env.ts`
  directement sur `import.meta.env`, donc remplacé par une constante) :
  - `"true"` dans `.env.development` (dev local, e2e, `test:hosting`), dans
    l'étape propre au dev de `deploy.yml` (« Configuration web du projet de
    dev », qui écrit `.env.production.local`) et dans `preview.yml` (aperçus,
    qui ne visent que le projet de dev et refusent la prod) ; **jamais** dans
    `.env.production` ni dans la branche prod de `deploy.yml` ; rien dans
    `deploy-lot0.yml` (code de `release/lot0`, sans le module) ;
  - `src/main.tsx` n'importe le module que par `import('./i18n-test')` sous
    `if (frTestEnabled)` : en production, la branche est éliminée et le
    bundle ne contient ni le dictionnaire ni le sélecteur (vérifié sur
    `dist/` après `npm run build` : un seul fichier JS, aucune chaîne du module) ;
  - garde-fous (`scripts/dev/buildGuards.ts`, branchés dans `vite.config.ts`) :
    `frTestBuildProblems` refuse un build de production avec le drapeau vrai
    pour le projet de `.env.production` (prod, lu dans le fichier versionné,
    rien de codé en dur) ; `frTestBundleProblems` fait échouer le build si un
    module de `src/i18n-test/` est dans le bundle sans le drapeau.
- **Couverture** : `npx tsx src/i18n-test/coverage.ts` extrait (API du
  compilateur TypeScript) les littéraux, gabarits et textes JSX arabes de
  `src/` et les messages `HttpsError` de `functions/src`, hors gabarits
  d'impression (`src/print/`, autre fenêtre : **hors périmètre**, sauf
  `src/print/cards` affiché dans l'atelier des cartes) et hors données
  fictives (`scripts/dev`, fixtures) : 1 932 chaînes affichées, 1 930
  traduites, 2 citations (hadiths) laissées en arabe volontairement
  (`exclusions.ts`), 5 textes jamais affichés (messages WhatsApp envoyés aux
  parents, qui restent en arabe). Le parcours e2e de tous les écrans en FR
  (6 rôles) ne signale plus que des données fictives (noms, halaqas, notes).
- **Tests** : `tests/unit/i18nTest.test.ts` (moteur, dictionnaire, couverture
  à 100 %, drapeau dev seulement, import dynamique unique, garde-fous, lignes
  du drapeau dans les workflows) ; `tests/e2e/i18n-fr.spec.ts` (bascule AR →
  FR → AR et retour à `dir="rtl"`, connexion et navigation en FR, valeur des
  rôles et saisies intactes ; options `CAPTURE_DIR` et `I18N_MISSING_OUT`).
  Captures : `docs/design/captures/fr-test/` (données fictives).
- **Limites connues** : l'ordre des mots suit les fragments JSX (un nombre
  rendu à part reste à sa place) ; une donnée arabe dans une phrase française
  peut s'afficher dans un ordre bidirectionnel inattendu ; les documents
  imprimés depuis l'aperçu d'un écran (copie de son HTML) sortent dans la
  langue affichée ; les valeurs saisies en arabe (horaires, catégories) qui
  coïncident avec une entrée du dictionnaire s'affichent traduites (affichage
  seulement, la donnée ne change pas).
- **Procédure de retrait** (version finale) :
  1. supprimer le dossier `src/i18n-test/` ;
  2. dans `src/main.tsx`, supprimer l'import de `frTestEnabled` et le bloc
     `if (frTestEnabled) { import('./i18n-test')… } else { render(); }` en
     gardant un simple `render();` ;
  3. supprimer le drapeau : `frTestEnabled` dans `src/config/env.ts`,
     `VITE_ENABLE_FR_TEST` dans `src/vite-env.d.ts` et `.env.development`, les
     deux lignes `echo 'VITE_ENABLE_FR_TEST="true"'` (et leur commentaire)
     de `deploy.yml` et `preview.yml` ;
  4. supprimer `tests/unit/i18nTest.test.ts` et `tests/e2e/i18n-fr.spec.ts`,
     et, au choix, `docs/design/captures/fr-test/` ;
  5. retirer les garde-fous devenus sans objet : `frTestBuildProblems`,
     `committedProductionProjectId`, `frTestBundleProblems` (et l'import de
     `dotenv`) dans `scripts/dev/buildGuards.ts`, `frTestBundleGuard` et ses
     appels dans `vite.config.ts` ;
  6. `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
  Les écrans n'ayant pas été modifiés, rien d'autre n'est à défaire.
- **Retour arrière** : `git revert` des commits de `feat/traduction-fr-tests`,
  ou, pour couper la traduction sans retirer le code, `VITE_ENABLE_FR_TEST`
  absent ou `"false"` (le module n'est alors plus dans le bundle).

### D80. Super-admin du dev par `ops.yml` › `dev-super-admin` (prod : `migrate-to-tenants`)
- **Contexte** : le propriétaire veut tester la création d'écoles sur le
  projet de dev `fajr-c4c6e`, qui contient désormais une **copie des données
  réelles** migrée (école `alfajr`, 88 comptes), traitée comme la prod (D77).
  Le claim `superAdmin` n'est posé que par `migrate-to-tenants --super-admin`,
  qui exige un compte présent dans les anciens `appUsers` ; `seed-demo` refuse
  volontairement d'en créer. Aucun chemin ne permettait donc de créer un
  super-admin sur le dev, et aucune commande n'est lancée vers un vrai projet
  depuis un conteneur (D64).
- **Décision (script `scripts/admin/dev-super-admin.ts`, Admin SDK)** :
  - **refus du projet `gen-lang-client-0481880143`** avant toute autre
    analyse des arguments (même mal formés, `--force` compris : une option
    inconnue est refusée) ; critère : le **projet** seul, la base du dev
    portant le même identifiant que celle de la prod (comme `seed-demo`) ;
    `--project` obligatoire, simulation par défaut, `--apply` ; sur un vrai
    projet `--database` et `--confirm-prod=<projet>` (`scripts/admin/lib/cli.ts`) ;
  - `--username` obligatoire, normalisé et validé par `normalizeUsername` et
    `isValidUsername` de `src/security/accounts.ts` (copie à l'identique de
    `functions/src/shared/accounts.ts`, parité testée) ; `--full-name`
    facultatif (défaut « Melik Zaanouni », 120 caractères imprimables au plus) ;
  - **convention identifiant → email de `createSchoolUser`** :
    `usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN)`, soit
    `<username>@comptes.kuttab.local` ; la connexion de l'application
    (`signInWithUsername`, `loginEmailCandidates`) essaie le domaine
    historique puis celui-ci ;
  - écrit ce qu'écrit `createSchoolUser`, **sans appartenance** : Auth, puis
    en transaction `usernames/{username}` (`uid`, `email`, `createdAt`,
    `source`) et `users/{uid}` (`username`, `displayName`, `schoolIds: []`,
    `lastSchoolId: null`, `mustChangePassword: true`, `createdAt`,
    `createdBy`) ; compte Auth supprimé si la transaction échoue ; claim
    `superAdmin: true` **ajouté** aux claims existants ; mot de passe
    `generateTemporaryPassword(4)` (19 caractères) dans le seul fichier
    secret `dev-super-admin-<horodatage>/mots-de-passe-temporaires.csv`
    (mode 600), jamais dans Firestore, la sortie ou `resume.json` ;
  - **réutilisation** d'un compte seulement s'il est inscrit au registre et
    que les emails de connexion désignent ce même compte ; sinon
    `ACCOUNT_CONFLICT` (registre vers un autre uid ou un compte absent, compte
    Auth hors registre, c'est-à-dire inscription libre sous un identifiant
    anticipé, jamais promu, ou deux domaines vers deux comptes) ;
  - compte membre d'une école (profil `schoolIds` ou
    `schools/*/members/{uid}`) : `MEMBER_ACCOUNT`, sauf
    `--allow-existing-member` (option du script seulement, le workflow ne la
    passe jamais : un compte réel de la copie n'est pas promu par le dev) ;
  - **relance** : nouveau mot de passe, sessions révoquées, compte réactivé,
    claims gardés, `mustChangePassword: true`, écoles du profil intactes ;
  - `--revoke` : claim `superAdmin` retiré (autres claims gardés), sessions
    révoquées, compte désactivé s'il n'appartient à aucune école ; **rien
    n'est supprimé** ;
  - résumé `resume.json` sans mot de passe : `mode`, `operation`,
    `username`, `accountFound`, `created`, `reset`, `superAdmin`,
    `schoolMemberships`, `disabled`, `sessionsRevoked`, `passwordsFile` ;
  - exception assumée à « les comptes ne s'écrivent que par les Cloud
    Functions » (comme la migration et `seed-demo`) : script Admin SDK
    limité au dev et aux émulateurs.
- **Décision (`ops.yml`)** : actions `dev-super-admin` et
  `dev-super-admin-revoke` (retrait : sans lui, l'orchestrateur ne pourrait
  pas retirer le claim sans commande vers le dev depuis un conteneur), avec les
  garde-fous de `seed-demo` : refusées en production dans le job de
  garde-fous et revalidées dans l'étape du script ; code de `main` ;
  `apply=true` et `confirm` = identifiant du projet de dev exigés ;
  `dev-super-admin` exige `ARTIFACT_GPG_PUBLIC_KEY` (mot de passe dans
  l'artefact chiffré `mots-de-passe-temporaires-*`, 1 jour) ; seuls les
  compteurs filtrés (`RESUME_JSON`) vont dans les journaux.
- **Choix de l'entrée `username`** (plutôt que la variable
  `DEV_SUPER_ADMIN_USERNAME`) : cette variable est déjà lue par
  `migrate-to-tenants` sur le dev (runbook, 4.4), où elle désigne un compte
  des `appUsers` ; la réutiliser lierait deux usages (une répétition de
  migration promouvrait ce nom, ou échouerait en `SUPER_ADMIN_NOT_FOUND`), et
  la poser demande une modification des paramètres du dépôt par le
  propriétaire. L'entrée est validée par `^[a-z0-9][a-z0-9._-]{1,39}$` (format
  des Functions) dans le job de garde-fous puis dans l'étape, n'est jamais
  affichée si elle est invalide, passe par `env` (aucune interpolation dans
  un script) et est refusée pour toute autre action. Choisir le nom ne donne
  pas accès au compte : le mot de passe ne part que chiffré pour la clé du
  propriétaire, et un nom déjà pris ou membre d'une école est refusé. Le nom
  complet reste fixe dans le script (aucune entrée libre à valider).
- **Droits** : ceux du compte `github-ops` du dev déjà prévus
  (`firebaseauth.admin`, `datastore.user`), aucun rôle nouveau
  (CI-DEPLOIEMENT.md §3).
- **Limites** : un jeton d'identification déjà émis garde le claim jusqu'à
  son expiration (une heure au plus) après `--revoke` ; `mustChangePassword`
  n'est imposé par l'interface qu'à l'entrée dans une école (le super-admin
  sans école arrive sur la page de choix) ; après création d'une école avec
  `makeMeDirector`, le compte en est membre et la relance par le workflow
  s'arrête sur `MEMBER_ACCOUNT` (changer son mot de passe dans l'application).
- **Vérifié localement** (émulateurs, `tests/emulator/dev-super-admin.test.ts`) :
  compte créé avec l'email de `createSchoolUser`, connexion comme
  l'application, claim présent et aucune appartenance, règles (liste des
  écoles, aucune donnée d'école lue), `createSchool` par l'émulateur Functions
  (avec et sans `makeMeDirector`), relance (nouveau mot de passe, ancien
  refusé, sessions révoquées, réactivation, claims gardés), refus d'un compte
  membre et option `--allow-existing-member`, conflits d'identifiant,
  `--revoke` (claim retiré, désactivation sans école, rien de supprimé,
  `createSchool` refusé ensuite), refus de la prod (arguments et script
  lancé, `--force` compris), mot de passe absent de la sortie et du résumé ;
  garde-fou d'`ops.yml` joué avec bash (`tests/unit/workflows.test.ts`) ;
  `zizmor --offline` sans nouveau constat.
- **Non testé sur GitHub** : aucun workflow déclenché ; l'Admin SDK avec le
  jeton de `github-ops` du dev n'est pas essayé pour cette action.
- **Retour arrière** : `dev-super-admin-revoke` sur le dev (ou suppression du
  compte à la main dans la console du dev, par un humain), puis `git revert`
  des commits de `feat/dev-super-admin` (script, actions et entrée
  d'`ops.yml`, tests, docs).

### D81. Le rôle directeur prime sur une matrice de permissions enregistrée (interface)
- **Contexte** : à la répétition 1 sur le dev (données réelles migrées), le
  directeur connecté ne voyait pas le bouton « إضافة كادر / عامل جديد ». Dans
  l'ancienne application (et `release/lot0`), `checkUserPermission` donnait
  tous les droits au seul compte `admin_alfajr`, codé en dur ; le multi-écoles
  a retiré ce contournement (super-admin = claim), mais une matrice
  `permissions` enregistrée sur un compte prime sur le rôle. Le compte du
  directeur migré gardait une matrice restrictive : régression qui aurait
  touché la prod à la bascule.
- **Décision** : dans `checkUserPermission`, un compte de rôle `مدير` a tous
  les droits, quelle que soit sa matrice. C'est cohérent avec les règles
  Firestore (`isDirector`, sans lecture de la matrice) et les Cloud Functions
  (`DIRECTOR_ROLES`). La matrice garde son effet pour les autres rôles.
  Test : `tests/unit/permissions.test.ts`.
- **Retour arrière** : `git revert` du commit ; pour un directeur, corriger sa
  matrice dans Paramètres › المستخدمين (ou passer `permissions: null`).

### D82. Données fictives en volume dans une école de test du dev (`ops.yml` › `seed-school-fixtures`)
- **Contexte** : le propriétaire veut essayer l'application multi-écoles sur
  le dev `fajr-c4c6e` avec beaucoup de données, dans l'école de test
  `test1234` qu'il a créée depuis l'interface en super-admin (D80), où il a
  déjà saisi quelques documents (1 fiche du personnel, 2 membres, des
  notifications) à garder. Le dev contient aussi `alfajr`, **copie des
  données réelles** d'élèves mineurs (D77, D80). `seed-demo` ne convient pas :
  il remplace toute l'école `demo` et refuse une base qui contient d'autres
  données.
- **Décision (script `scripts/dev/seed-school-fixtures.ts`, Admin SDK, jeu
  pur `scripts/dev/fixtures/school-fixtures.ts`)** :
  - options `--project`, `--school=<id>` (obligatoire,
    `^[a-z0-9-]{3,40}$`), `--size=small|large` (`large` par défaut),
    simulation par défaut, `--apply`, `--confirm-prod=<projet>` et
    `--database` sur un vrai projet (`scripts/admin/lib/cli.ts`), `--remove` ;
  - **refus contrôlés en premier, sans option pour les lever** : projet
    `gen-lang-client-0481880143` (le projet seul, comme `seed-demo`), avant
    toute autre analyse ; école `alfajr` (toutes graphies), avant toute
    connexion, puis à nouveau dans les fonctions ; école absente
    (`schools/{id}` est écrit par `createSchool`) : `SCHOOL_NOT_FOUND` ;
    école de plus de 20 élèves non générés : `REAL_SCHOOL`. Ces refus valent
    aussi pour `--remove` ;
  - **jeu `large`** (volumes pour `test1234` au 24 octobre 2026, ouverture
    en octobre ; ils varient un peu avec l'école et la date) : 150 élèves
    (5 à 17 ans, garçons et filles, fratries, 0 à 60 hizbs, sourate en cours,
    tajwid, documents fournis ou manquants, 4 archivés), 12 halaqas (aucune le
    vendredi), 15 membres du personnel de toutes catégories (fiche publique +
    `staffPrivate` : salaire, contrat, CIN `XX…`, naissance, adresse
    « (عنوان وهمي) », contact d'urgence), 4 824 présences (chaque jour de
    halaqa des 3 derniers mois), 1 522 suivis quotidiens du hifz (30 jours),
    264 examens (notes et mentions d'attestation), 146 cotisations avec
    retards et impayés, 18 dépenses, 10 autres recettes, 39 salaires (mois passés
    versés, mois en cours en attente), 4 activités avec 88 participants et 6
    dépenses, 30 notifications : 7 143 documents, **7 155 écritures** comptes
    compris. `small` : 15 élèves, 2 halaqas, 6 membres du personnel, 592
    présences, 886 documents, 898 écritures. Écriture par
    lots de 400 ; le test unitaire borne `large` sous 20 000 écritures ;
  - **cotisations** : depuis le début de la saison (septembre de
    `activeAcademicSeason`), **jamais avant le mois d'ouverture** des
    paramètres (l'application masque ces mois), plus le mois d'ouverture
    s'il précède la saison (sinon l'application crée elle-même des lignes
    `p_init_*` non marquées). `test1234`, créée en octobre, n'a donc que les
    cotisations d'octobre ; pour voir septembre, régler le mois d'ouverture
    sur شتمبر dans الإعدادات avant le seed. Les paramètres ne sont que lus ;
  - **marquage** : `demoData: true` et identifiant `DEMO-…` (`DEMO-S-001`,
    `DEMO-C-01`, `DEMO-T-01`, `DEMO-P-…`…), avec deux exceptions :
    `staffPrivate` (les règles y imposent une liste fermée de champs et
    l'interface y écrit en fusion : `demoData` y rendrait la fiche RH
    impossible à modifier ; marquage = identifiant `DEMO-T-…` égal à
    `teacherId`, fiche publique marquée) et `attendance` (l'interface
    identifie une présence par `a_<date>_<élève>` : un identifiant `DEMO-…`
    créerait un doublon à la première modification ; marquage = `demoData`
    + identifiant `a_<date>_DEMO-S-…`). Vérifié avec les règles : un
    document marqué se relit et se modifie en fusion depuis l'interface
    (élève, fiche publique et fiche RH, présence, notification marquée lue
    par un enseignant), et `demoData` reste en place ;
  - **relance idempotente** : jeu déterministe (école, taille, date) ;
    documents marqués réécrits, marqués hors du jeu supprimés ; un document
    **non marqué** de même identifiant n'est jamais réécrit (compté
    `skippedUnmarked`) ; `--remove` ne supprime que les documents marqués et
    compte les documents non marqués que l'interface a créés pour un élève
    `DEMO-` (`orphansLeft`, ex. absence automatique), sans les toucher ;
  - **comptes** `test_admin` (إداري, fiche `DEMO-T-10`), `test_enseignant`
    (مدرس, fiche `DEMO-T-01` et ses halaqas), `test_parent` (ولي أمر, deux
    élèves d'une fratrie), `test_eleve` (طالب, l'élève le plus âgé) :
    convention de `createSchoolUser` (`usernameToEmail` vers
    `comptes.kuttab.local`, `usernames`, `users`, `members`), membres de
    l'école visée seulement, aucun claim (retiré à la relance),
    `mustChangePassword: false` (comptes d'essai, mot de passe neuf à chaque
    relance) ; marqués `users.demoAccount` + `demoSchoolId`,
    `usernames.source = seed-school-fixtures`, `members.demoData`. Un
    identifiant pris par un autre compte (registre, compte Auth non marqué,
    compte historique) ou marqué pour une autre école : `ACCOUNT_CONFLICT`
    avant toute écriture ; `--remove` l'ignore (`accounts.skipped`) ;
  - mots de passe aléatoires de 19 caractères, dans le seul fichier secret
    `seed-school-fixtures-<horodatage>/mots-de-passe-temporaires.csv`
    (mode 600) ; `resume.json` sans mot de passe : `mode`, `operation`,
    `schoolId`, `size`, `collections`, `writes`, `skippedUnmarked`,
    `unmarkedKept`, `paymentMonths`, `accounts`, `superAdminClaims`,
    `otherSchoolMemberships`, `passwordsFile` (et pour le retrait
    `removed`, `orphansLeft`) ;
  - exception assumée à « les comptes ne s'écrivent que par les Cloud
    Functions » (comme `seed-demo` et `dev-super-admin`).
- **Décision (`ops.yml`)** : actions `seed-school-fixtures` et
  `remove-school-fixtures`, garde-fous de `seed-demo` : refusées en
  production dans le job de garde-fous puis dans l'étape du script, code de
  `main`, `apply=true` et `confirm` = projet de dev, `ARTIFACT_GPG_PUBLIC_KEY`
  exigée pour le seed (mots de passe dans l'artefact chiffré
  `mots-de-passe-temporaires-*`, 1 jour). Entrée `school_id` validée par
  `^[a-z0-9-]{3,40}$` puis **refus explicite d'`alfajr`**, dans les deux
  étapes, passée par `env`, jamais affichée si elle est invalide, refusée
  pour toute autre action. Entrée `size` en choix fermé (`large` par défaut,
  `small`), refusée à `small` hors seed. Résumé en liste blanche.
- **Contrôle visuel** (émulateurs, école `annour` peuplée en `large`, compte
  directeur, Chromium 1440 px, 7 302 écritures) : tableau de bord, élèves,
  paiements, présences, comptabilité et examens s'affichent correctement ;
  seed en 3 s sur les émulateurs.
  Lenteur notable mais pas bloquante : changement d'onglet en 0,8 à 0,9 s
  pour élèves, paiements, présences et examens (0,1 à 0,25 s sans le jeu),
  listes sans pagination (148 lignes, 11 000 nœuds DOM pour les examens),
  cache local de 1,2 Mio. Le directeur s'abonne à toutes les collections :
  **environ 7 150 lectures Firestore par ouverture de session** sur le dev.
  Non optimisé ici.
- **Vérifié localement** : `tests/unit/schoolFixtures.test.ts` (volumes,
  quotas, marquage, références, horaires lus comme l'application, cotisations
  et ouverture), `tests/emulator/seed-school-fixtures.test.ts` (volumes,
  saisies manuelles intactes avant et après seed et retrait, refus prod,
  `alfajr`, école absente, plus de 20 vrais élèves, idempotence, conflits de
  comptes, connexion comme l'application et droits par rôle, marquage
  compatible avec les règles, aucun mot de passe dans la sortie),
  `tests/unit/workflows.test.ts` (garde-fou joué avec bash),
  `zizmor --offline` sans constat.
- **Non testé sur GitHub** : aucun workflow déclenché.
- **Retour arrière** : `remove-school-fixtures` sur le dev (documents
  marqués et comptes `test_*` supprimés ; les documents non marqués restent,
  y compris ceux créés par l'interface pour des élèves `DEMO-`, à supprimer
  depuis l'interface si besoin), puis `git revert` des commits de
  `feat/seed-ecole-test`.
