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
