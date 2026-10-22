# Analyse : application de gestion d'écoles coraniques (version AI Studio)

> **Versions analysées** : (1) archive `quran-school-app-main.zip` + maquette `design` ; (2) **version de prod** `quran-school-app-main_1.zip`, reçue le 21/10/2026. Les écarts entre les deux sont décrits au **§ 10**. Les §§ 1 à 9 restent valables pour la prod, avec les compléments du § 10.
> Les passages marqués ⚠️ *À REVÉRIFIER* dépendent de la console (règles réellement déployées, volumes).
> **Pour refaire l'analyse sur la version à jour** : `bash reanalyse.sh <dépôt> <dossier design>` (script fourni avec ce rapport, lecture seule). On compare ensuite sa sortie à l'« Empreinte de référence » (§ 8).
> Aucun code n'a été modifié et aucune action n'a touché la prod.

---

## 0. Résumé

1. **Faille critique, aujourd'hui en prod (si les règles déployées sont celles du dépôt).** La collection `appUsers` se lit **sans être connecté** (`allow read: if true`). Elle contient **les mots de passe en clair** de tous les comptes, administrateur compris. N'importe qui sur Internet peut aussi créer un compte Firebase Auth avec la clé API publique. Ce compte obtient alors lecture, écriture et suppression sur **toutes** les données : élèves mineurs, téléphones des parents, numéros de CIN, salaires. Il faut corriger ça avant tout le reste (voir Lot 0).
2. **« Ajouter un tenantId » ne coûte presque rien côté données.** Tous les accès Firestore passent par 4 fonctions génériques de `src/firebase.ts`. Mettre les chemins sous `schools/{schoolId}/…` prend environ une journée d'agent.
3. **Mais isoler les écoles sans refaire l'authentification ne protège rien.** Aujourd'hui, la connexion compare des mots de passe en clair dans le navigateur. Les règles se contentent de vérifier `request.auth != null` et ne contrôlent aucun rôle. Tant que ça ne change pas, n'importe quel compte lira toutes les écoles, `schoolId` ou pas. **Le gros du travail est l'auth, les rôles et les règles, pas le schéma.** Rester sous 10 écoles ne réduit presque pas l'effort : la difficulté vient de l'isolation, pas du volume.
4. **Il y a des pièges propres à l'architecture « localStorage d'abord ».** Les clés localStorage ne dépendent pas de l'école. `bootstrapCollectionIfEmpty` renvoie le cache local dans toute collection vide. Des « migrations » métier tournent dans chaque navigateur. Ces trois mécanismes peuvent mélanger les données de deux écoles ou réinjecter d'anciennes données après la migration.
5. **La maquette ne couvre que le cadre de l'app** (menu latéral, barre du haut) **et le tableau de bord.** Les 9 autres écrans vers lesquels elle pointe n'existent pas encore, ni la connexion, les paramètres, les portails enseignant/parent/élève ou le sélecteur d'école. Appliquer le design est **le poste le plus long en heures**. En cause : la maquette incomplète et un `App.tsx` de 8 383 lignes avec 108 `useState`.
6. **Estimation** : environ **95 à 160 h d'agent** et **45 à 70 h humaines** (relecture, tests, bascule). Détail au § 6. Ordre conseillé : sécurité + multi-tenant + migration, **livrés avec l'ancien design**, puis le design écran par écran.

---

## 1. Cartographie du code

### 1.1 Stack
| Élément | Valeur |
|---|---|
| Front | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`), `motion`, `lucide-react`, `recharts`, `html5-qrcode` (scan QR par caméra) |
| Back | `server.ts` : Express sur le port 3000. En dev, il embarque Vite en middleware. En prod (`NODE_ENV=production`), il sert `dist/` et **une seule route API** : `POST /api/gemini/analyze` (`@google/genai`, modèle `gemini-3.7-flash`, clé `GEMINI_API_KEY`), plus `/api/health` |
| BaaS | Firebase JS SDK 12 : Firestore (**base nommée** `ai-studio-a6572431-…`) et Auth email/mot de passe. Pas de Storage, pas de Functions |
| Build | `npm run build` = `vite build` + `esbuild server.ts → dist/server.cjs` |
| Gestionnaires | `package-lock.json` **et** `bun.lock` coexistent (à unifier) |
| Traces AI Studio | `metadata.json` (capacités, caméra), `assets/.aistudio/`, `.env.example` (clé injectée par AI Studio), commentaire `DISABLE_HMR` dans `vite.config.ts` |

### 1.2 Structure
```
server.ts                    proxy Gemini + service statique (Cloud Run AI Studio)
firebase.json / .firebaserc  Hosting uniquement, projet par défaut = PROD
firestore.rules              règles (voir § 3)
firebase-applet-config.json  config web Firebase (NON lue par le code : dupliquée en dur dans firebase.ts)
src/
  main.tsx                   point d'entrée
  App.tsx          8 383 l.  TOUT : état global, connexion, routage, 12+ écrans, modales, impressions
  db.ts            1 398 l.  "RealmSimDB" : CRUD localStorage + écriture Firestore, génération des comptes
  firebase.ts        318 l.  init Firebase, saveToFirestore / deleteFromFirestore / subscribeToCollection / bootstrap*
  types.ts           620 l.  modèles + matrice de permissions + checkUserPermission
  components/                écrans extraits (reçoivent données + callbacks en props)
    ActivitiesManagement 3 020 · FinanceManagement 2 697 · TeacherManagement 1 716
    SettingsManagement 1 528 · ClassManagement 585 · PermissionMatrixEditor 458
    TeacherPerformanceChart 367 · StudentCard 362 · AttendanceChart 340
  utils/studentAvatar.tsx
```

### 1.3 Routage et écrans
Il n'y a **pas de routeur** : un `useState activeTab` dans `App.tsx` choisit l'écran affiché.

| `activeTab` | Écran | Où |
|---|---|---|
| `dashboard` | لوحة البيانات (tableau de bord) | App.tsx |
| `teacher-dashboard` | portail enseignant (suivi quotidien : حفظ/مراجعة) | App.tsx |
| `students` | élèves, fiche, rapport IA | App.tsx |
| `teachers` | personnel et enseignants | TeacherManagement |
| `attendance` | présences | App.tsx (+ AttendanceChart) |
| `grades` | examens et certificats | App.tsx |
| `payments` | frais mensuels et reçus | App.tsx |
| `finance` | comptabilité : recettes, dépenses, salaires | FinanceManagement |
| `activities` | activités et sorties (participants, dépenses) | ActivitiesManagement |
| `classes` | halaqas | ClassManagement |
| `notifications` | notifications | App.tsx |
| `id-cards-lab` | cartes QR | App.tsx + StudentCard |
| `settings` | paramètres de l'association et utilisateurs, matrice CRUD | SettingsManagement + PermissionMatrixEditor |
| (non connecté) | écran de connexion | App.tsx |
| `student-*`, `parent-*` | modules déclarés dans `ALL_MODULES` ; rendu à confirmer dans App.tsx | App.tsx |

### 1.4 Gestion d'état et couche d'accès aux données
- **Tout l'état vit dans `App()`** : 16 tableaux de données, plus l'utilisateur, plus des dizaines d'états de formulaires. Les données descendent en props vers les composants, et les modifications remontent par des callbacks `onSave…`.
- **Modèle « localStorage d'abord, écriture Firestore en parallèle »** :
  - `RealmSimDB.saveX()` lit tout le tableau dans localStorage, le modifie, le réécrit, puis appelle `saveToFirestore()` en *fire-and-forget* (pas d'`await`, erreurs avalées).
  - Après une fois connecté, `subscribeToCollection()` pose un `onSnapshot` sur **chaque collection entière**. À chaque événement, il réécrit localStorage puis met à jour le state.
  - `loadDatabase()` relit tout depuis localStorage après chaque action (99 appels `RealmSimDB.` dans App.tsx).
  - **Aucune requête filtrée** (`query`/`where` importés mais jamais utilisés). Chaque client télécharge 100 % de la base.
- **Effets de bord à chaque chargement** :
  - `bootstrapCollectionIfEmpty` (14 collections + settings) : si une collection Firestore est vide, le client y **envoie son cache localStorage**.
  - `RealmSimDB.getAppUsers()` → `syncAppUsers()` **recrée côté client** les comptes enseignants (`t_…`), parents (`p_…`) et élèves de 15 ans et plus (`s_…`), avec le mot de passe `"123"` par défaut. Il réinitialise aussi l'admin `u1` en `admin_alfajr` / `FajrAcademy@2026!`, puis écrit le tout dans Firestore.
  - `loadDatabase()` : migration « paiements avant juillet 2026 » et création automatique de paiements `p_init_…`.
  - `syncAllActivitiesToFinance()` : supprime des recettes et dépenses synthétiques, recalcule les soldes des activités.
- **Sauvegarde/restauration** (bouton du tableau de bord) : l'export JSON ne contient que 9 collections, sans finance ni activités. La restauration **écrit seulement dans localStorage**, pas dans Firestore.
- **Photos** : stockées en base64 directement dans les documents (`readAsDataURL`). Limite de 1 MiB par document, et tous les clients les téléchargent.

### 1.5 Serveur, Hosting et Cloud Run
- `firebase.json` : Hosting `public: dist` avec la règle SPA `** → /index.html`. **Aucun rewrite `/api/**` vers Cloud Run.**
  → Conséquence : sur le domaine Hosting, `fetch("/api/gemini/analyze")` (POST) ne peut pas atteindre Express. **Le rapport IA ne fonctionne probablement que sur l'URL `*.run.app`** du service AI Studio. ⚠️ *À REVÉRIFIER* : quelle URL les utilisateurs ouvrent-ils ?
- **Deux prods possibles** : le Cloud Run AI Studio (front + API) et le Hosting déployé à la main en CLI (front seul). Elles écrivent dans la même base.
- `npm run build` produit `dist/server.cjs` **et** `dist/server.cjs.map`. Ces fichiers sont donc **publiés sur Hosting**, car `firebase.json` n'ignore que les fichiers commençant par un point. Pas de secret dedans, mais c'est une fuite inutile.
- L'endpoint Gemini **n'exige aucune authentification** : risque d'abus et de facturation. Il renvoie aussi `errorInfo` (message d'erreur brut) au client.
- `.firebaserc` a `default: gen-lang-client-0481880143` : **un `firebase deploy` lancé depuis le dépôt part en prod.** À changer en premier (alias `dev`/`prod`, `dev` par défaut).

### 1.6 Config Firebase
- `src/firebase.ts`, lignes 22-31 : config web **en dur**. Le nom de base est en dur aussi, ligne 34. `firebase-applet-config.json` contient les mêmes valeurs, plus `oAuthClientId`, mais **n'est pas importé**.
- La clé API web est publique par nature. Elle doit être restreinte (référents HTTP) et complétée par App Check, mais la vraie protection doit venir des règles.

---

## 2. Modèle de données déduit

### 2.1 Collections (base `ai-studio-a6572431-…`, toutes à la racine)
| Collection | Format des IDs | Champs principaux | Relations |
|---|---|---|---|
| `students` | généré | fullName, photo (base64), birthDate, gender, registrationDate, parentName/Phone/Email, docParentId/docBirthCert/docPhotos (booléens), hizbCount (0–60), currentSurah, tajweedLevel (`ممتاز/متوسط/ضعيف`), notes, **classId**, isArchived | → classes |
| `teachers` (personnel au sens large) | généré, + `settings_director`, `settings_supervisor` (créés depuis les paramètres) | fullName, photo, phone, whatsapp, email, specialty, category (`StaffCategory`), roleTitle, contractType, monthlySalary, **cinNumber**, address, birthDate, emergencyContact, duties, assignedAreas, workSchedule, isFromSettings/settingsKey, isArchived | ← classes.teacherId |
| `classes` | généré | name, **teacherId**, schedule (texte libre, analysé par `ParsedSchedule`), maxStudents, isArchived | → teachers |
| `attendance` | **`a_{date}_{studentId}`** (déterministe) | date, studentId, status (`حاضر/غائب/متأخر`), notes | → students |
| `grades` | généré | studentId, examDate, testedPortion, memorizationGrade, tajweedGrade (/20), overallGrade, **examinerId**, notes | → students, teachers |
| `dailyProgress` | `dp_{timestamp}` | studentId, date, memorizationPart, revisionPart, oldRevisionPart, rating, notes, **teacherId** (fallback `"t1"`) | → students, teachers |
| `payments` | `p_init_{studentId}`, `p_new_{studentId}_{i}`, … | studentId, **year + month (nom arabe marocain)**, amount, paymentDate, status, receiptNo, paymentMethod | → students |
| `otherIncomes` | généré | title, category, amount, date, source (caisse/banque), donorName, receiptNo | — |
| `expenses` | généré | title, category, amount, date, source, invoiceNo, supplier | — |
| `salaryPayments` | `sal_auto_{teacherId}_{ts}_{i}` | personType, **personId**, personName, roleTitle, amount, month, year, paymentDate, paymentMethod, paymentSource, status | → teachers |
| `activities` | généré + jeux d'essai `act_1`, `act_2` | title, type, start/endDate, location, **leaderIds[]**, leaderNames[], contributionFee, maxCapacity, status, targetAudience, programDetails, meetingPoint, champs `synced*` | → teachers |
| `activityParticipants` | généré + jeux d'essai `part_1..4` | **activityId**, participantType, **referenceId** (élève ou enseignant), fullName, phone, classId, fee, paidAmount, paymentStatus, hasParentApproval, medicalNotes | → activities, students/teachers |
| `activityExpenses` | généré + jeux d'essai `exp_act_*` | **activityId**, title, category, amount, date, paymentMethod, supplier | → activities |
| `notifications` | `n_…` | title, message, date, type, isRead | **globale**, pas de destinataire : tout le monde voit tout |
| `settings` | **`system`** (document unique) | identité de l'association (nom, logo, téléphone, adresse, RIB, n° d'agrément, bureau exécutif, président/trésorier/secrétaire), subscriptionFee, currency, activeAcademicSeason, receiptPrefixFormat, stampText, internalBylaws… | — |
| `appUsers` | **`u1`** (admin), **`t_{teacherId}`**, **`p_{studentId}`**, **`s_{studentId}`**, + manuels | username, fullName, **password (EN CLAIR)**, role, isActive, email, phone, drapeaux `canEdit*` / `teacher*` / `parent*`, **permissions** (matrice CRUD + impression par module), lastLogin | dérivé de teachers et students |

⚠️ *À REVÉRIFIER* sur la nouvelle version et dans la console (nombre de documents par collection, collections nouvelles).

### 2.2 Utilisateurs et rôles : `appUsers` vs Auth
- **Rôles** (`UserRole`) : `مدير` (directeur), `إداري` (administratif), `مؤطر` (encadrant), `مدرس` (enseignant), `طالب` (élève), `ولي أمر` (parent). Il existe en plus un **super-admin codé en dur** : tout utilisateur `username === "admin_alfajr"` a tous les droits (`checkUserPermission`).
- **Droits** : une matrice `permissions[moduleId] = {read, create, update, delete, print}`, avec repli sur des valeurs par rôle et sur d'anciens drapeaux. **Ils ne sont appliqués que dans l'interface.**
- **Connexion** (`handleLoginSubmit`, App.tsx ≈ l. 3002) :
  1. Le client charge **tous** les `appUsers` (lecture publique).
  2. Il cherche l'identifiant parmi username, nom complet, email, téléphone ou id, et **compare le mot de passe en clair**.
  3. Il appelle `loginWithFirebaseAuth(username, password)` : email fictif `{username}@alfajr.local`, mot de passe complété par `_secure_fajr` s'il fait moins de 6 caractères. **Si le compte Auth n'existe pas, il est créé automatiquement.**
  4. La session est stockée dans `localStorage.alfajr_logged_user`, **objet complet avec le mot de passe**.
- **Déconnexion** : `logoutFromFirebaseAuth` n'est **jamais appelée**. La session Firebase reste ouverte après « خروج ».
- **Parents** : un compte par téléphone ou nom de parent (`p_{id du premier enfant}`). Les enfants sont retrouvés en comparant le téléphone, ce qui est fragile.
- **Ce qui aide la migration** : les comptes Auth `@alfajr.local` existants ont **le même mot de passe** que dans `appUsers` (ou mot de passe + `_secure_fajr`). On peut donc les réutiliser sans réinitialisation, sauf pour les comptes dont le mot de passe a fuité (tous, en pratique).

### 2.3 Éléments propres à « Al Fajr » codés en dur (à paramétrer par école)
- Nom : `index.html`, `metadata.json`, prompt Gemini (`server.ts`), 26 occurrences de « الفجر » dans App.tsx.
- `admin_alfajr`, `@alfajr.local`, `FajrAcademy@2026!`, `u1`.
- **Tarifs** : `getSubscriptionAmount`, 100 MAD, avec 70 MAD en juillet-août 2026.
- **Ouverture** : `isMonthBeforeJuly2026`, qui masque les paiements avant juillet 2026.
- Âge calculé comme `2026 - birthYear`.
- Remplacement automatique « طنجة → سلا » dans les paramètres.
- Activités de démonstration (`act_1`, …), injectées dans toute base vide.

---

## 3. Sécurité : état actuel et risques

⚠️ *À REVÉRIFIER* : comparer `firestore.rules` du dépôt avec **les règles réellement déployées** (Console › Firestore › base `ai-studio-…` › Règles), car AI Studio peut les avoir changées.

| # | Gravité | Constat | Conséquence |
|---|---|---|---|
| S1 | **Critique** | `appUsers` : `allow read: if true`, avec `password` en clair | N'importe qui récupère tous les identifiants et mots de passe par l'API REST Firestore (projet et clé visibles dans le JS public), puis se connecte comme directeur |
| S2 | **Critique** | Toutes les autres collections : `allow read, write: if isSignedIn()` ; l'inscription Firebase Auth est ouverte | N'importe qui crée un compte (`signUp` avec la clé publique) et peut **lire, modifier et supprimer toutes les données** : mineurs, CIN, salaires, finances |
| S3 | Élevée | Aucune vérification de rôle dans les règles | Un parent ou un élève (mot de passe `123`) peut écrire dans `salaryPayments`, `settings` ou `appUsers`, et **se promouvoir directeur** (`role`, `username: "admin_alfajr"`) |
| S4 | Élevée | Mot de passe par défaut `123` pour tous les comptes générés ; mot de passe admin `FajrAcademy@2026!` **dans le bundle JS** ; réinitialisation automatique de l'admin sur ce mot de passe | Prise de compte triviale |
| S5 | Moyenne | `settings` lisible publiquement et modifiable par tout compte connecté | Défiguration (nom, logo, RIB affiché sur les reçus) |
| S6 | Moyenne | Session = objet utilisateur avec mot de passe dans localStorage ; déconnexion Firebase jamais faite ; **toute la base en cache localStorage** | Fuite sur les PC partagés de l'école |
| S7 | Moyenne | `/api/gemini/analyze` ouvert, renvoie l'erreur brute | Coût et abus |
| S8 | Faible | `dist/server.cjs(.map)` publiés ; aucune validation de schéma dans les règles (seulement `isValidId`) ; photos base64 dans les documents | Fuite mineure, documents corrompus ou trop gros |
| S9 | Conformité | Données de mineurs (photos, dates de naissance) et CIN, sans contrôle d'accès | Loi marocaine 09-08 / CNDP : à traiter avant d'accueillir d'autres écoles (qui est responsable du traitement ?) |

**Règle à retenir** : les règles doivent reposer sur **l'appartenance à une école et le rôle** (documents `members`), jamais sur `request.auth != null` seul. Avec ce principe, un compte créé par un inconnu n'a accès à rien.

---

## 4. Plan multi-tenant

### 4.1 Recommandation : sous-collections `schools/{schoolId}/…` (et `schoolId` dénormalisé dans chaque document)
| Critère | Sous-collections | Champ `schoolId` à plat |
|---|---|---|
| Changement de code | **Minime** : préfixer le chemin dans 4 fonctions de `firebase.ts` | Ajouter `where("schoolId","==",…)` à **chaque** abonnement et `schoolId` à **chaque** écriture (> 60 appels) |
| Règles | `match /schools/{s}/{col}/{id}` + `isMember(s)`, isolation par construction | Vérifier `resource.data.schoolId` en lecture, création et mise à jour, plus l'immuabilité du champ ; un oubli fait fuiter des données |
| IDs fixes (`settings/system`, `u1`, `settings_director`, `a_{date}_{studentId}`, `act_1`…) | **Sans collision** | Collisions entre écoles : il faudrait renommer les IDs |
| Export, suppression, sauvegarde d'une école | Un chemin unique | Requêtes filtrées |
| Vue consolidée du directeur multi-écoles | `collectionGroup("payments").where("schoolId","in",[…])` grâce au champ dénormalisé | Native |

### 4.2 Schéma cible
```
users/{uid}                         profil global : displayName, username, schoolIds[], lastSchoolId (AUCUN mot de passe)
schools/{schoolId}                  name, slug, logo, status, createdAt, plan
schools/{schoolId}/members/{uid}    role, permissions (matrice CRUD), isActive, username,
                                    linkedTeacherId?, linkedStudentIds[]? (parent/élève), mustChangePassword
schools/{schoolId}/settings/system  ex-settings/system + tarifs, date d'ouverture, saison, préfixe des reçus
schools/{schoolId}/{students|teachers|classes|attendance|grades|dailyProgress|payments|
                    otherIncomes|expenses|salaryPayments|activities|activityParticipants|
                    activityExpenses|notifications}/{id}   (+ champ schoolId)
```
- **Super-admin plateforme** (vous) : *custom claim* `superAdmin: true` posé par l'Admin SDK. Il remplace le `admin_alfajr` codé en dur.
- **Directeur multi-écoles** : un seul compte Auth et un document `members/{uid}` avec `role: "مدير"` dans chacune de ses N écoles. `users/{uid}.schoolIds` alimente le sélecteur d'école.
- **Création de comptes et changement de mot de passe d'autrui** : impossibles proprement côté client. Il faut des **Cloud Functions 2nd gen callables** (le projet est en Blaze) : `createSchoolUser`, `resetUserPassword`, `setMemberRole`, `createSchool`. Chacune vérifie l'ID token et l'appartenance de l'appelant. Le proxy Gemini y passe aussi (`/api/**` via rewrite Hosting).
- **Identifiant de connexion** : garder la saisie d'un nom d'utilisateur, mais **unique sur toute la plateforme** (`generateUniqueUsername` existe déjà). Email fictif déterministe : on garde `@alfajr.local` pour les comptes existants, et les nouveaux prennent par exemple `{username}@users.<domaine>`. La connexion devient `signInWithEmailAndPassword`, **puis** lecture du profil. On abandonne la connexion par nom complet ou téléphone (sinon il faut un index public). Voir question Q6.
- **Variante** : mettre les rôles dans des *custom claims* (`{schools: {id: role}}`) évite les `get()` dans les règles, mais impose l'Admin SDK et un rafraîchissement du token à chaque changement. À moins de 10 écoles, **les documents `members` sont plus simples** et restent modifiables depuis l'UI du directeur.

### 4.3 Règles (esquisse)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isSuper()  { return signedIn() && request.auth.token.superAdmin == true; }
    function mPath(s)   { return /databases/$(database)/documents/schools/$(s)/members/$(request.auth.uid); }
    function isMember(s){ return signedIn() && exists(mPath(s)) && get(mPath(s)).data.isActive == true; }
    function role(s)    { return get(mPath(s)).data.role; }
    function hasRole(s, roles) { return isMember(s) && role(s) in roles; }
    function staff(s)   { return hasRole(s, ['مدير','إداري','مؤطر','مدرس']); }
    function office(s)  { return hasRole(s, ['مدير','إداري']); }

    match /users/{uid} { allow read: if request.auth.uid == uid || isSuper(); allow write: if isSuper(); }

    match /schools/{s} {
      allow read: if isMember(s) || isSuper();
      allow create, delete: if isSuper();
      allow update: if isSuper() || hasRole(s, ['مدير']);

      match /members/{uid} {
        allow read: if request.auth.uid == uid || office(s) || isSuper();
        allow write: if isSuper() || (hasRole(s, ['مدير']) && request.resource.data.role in ['إداري','مؤطر','مدرس','طالب','ولي أمر','مدير']);
      }
      match /settings/{doc} { allow read: if isMember(s); allow write: if hasRole(s, ['مدير']) || isSuper(); }

      // Pédagogie : le personnel lit tout et écrit selon son rôle
      match /{col}/{id} {
        allow read:  if staff(s) && col in ['students','teachers','classes','attendance','grades','dailyProgress','activities','activityParticipants','activityExpenses','notifications'];
        allow write: if staff(s) && col in ['attendance','grades','dailyProgress'] && request.resource.data.schoolId == s;
        allow write: if office(s) && col in ['students','teachers','classes','activities','activityParticipants','activityExpenses','notifications'] && request.resource.data.schoolId == s;
        // Finances : bureau uniquement
        allow read, write: if office(s) && col in ['payments','otherIncomes','expenses','salaryPayments'];
      }
    }
    // Anciennes collections racine : lecture seule pendant la période de retour arrière, puis suppression
    match /{document=**} { allow read, write: if false; }
  }
}
```
- **Parents et élèves** : pour leur donner un accès restreint à « leurs » enfants, chaque requête doit être filtrée (`where("studentId","in",linkedStudentIds)`) et les règles doivent le vérifier (`resource.data.studentId in get(mPath(s)).data.linkedStudentIds`). Cela demande de refactorer le chargement de données **pour ces rôles uniquement** : +6 à 10 h. **Option v1** : couper les portails parent/élève pendant la bascule (voir Q5).
- La matrice de permissions par module (`PermissionMatrixEditor`) **reste une aide d'affichage**. Les règles imposent une version simplifiée par rôle. Si la granularité doit être réelle côté serveur, les règles liront `permissions[col]` dans le document `members` (faisable, plus verbeux).
- **Tests obligatoires** : `@firebase/rules-unit-testing` sur l'émulateur, avec une matrice rôle × collection × action, **plus des tests inter-écoles** (un membre de A ne lit rien de B).

### 4.4 Sélection de l'école dans l'UI
1. Connexion, puis lecture de `users/{uid}`. Avec 1 école : sélection automatique. Avec plusieurs : page de choix (cartes d'écoles). Le super-admin voit en plus « créer une école ».
2. **`SchoolContext`** (schoolId, rôle, permissions, settings) placé au-dessus de l'app. L'école est mémorisée dans `users/{uid}.lastSchoolId` et dans localStorage. Une URL `/s/{slug}/…` est souhaitable (favoris, plusieurs onglets) mais suppose d'introduire un routeur ; c'est optionnel en v1.
3. **Sélecteur dans la barre du haut** (à dessiner : absent de la maquette). Au changement d'école : désabonner tous les `onSnapshot`, vider le state, **vider ou basculer le cache local**, puis se réabonner.
4. Identité de l'école (nom, logo, tampon) prise dans `schools/{id}/settings/system`, au lieu des chaînes codées en dur.

### 4.5 Changements de code associés (indispensables)
- `firebase.ts` : `saveToFirestore`, `deleteFromFirestore`, `subscribeToCollection`, `subscribeToSettings` prennent `schoolId` et ajoutent `schoolId` au document.
- **Supprimer** `bootstrapCollectionIfEmpty` / `bootstrapSettingsIfEmpty`, les données de démonstration, et les écritures Firestore de `syncAppUsers` (les comptes sont créés par les Functions).
- **localStorage** : préfixer les clés par école (`kuttab:{schoolId}:students`), purger les anciennes clés `alfajr_*` au premier lancement et à la déconnexion, ne plus stocker l'objet utilisateur. Étape suivante possible : remplacer ce cache maison par la persistance native de Firestore (`persistentLocalCache`). C'est un refactor plus large, car RealmSimDB est appelé partout en synchrone.
- Déplacer les « migrations » client (paiements de juillet 2026, synchro des activités) vers un **script serveur unique**, ou les rendre idempotentes et limitées à l'école.
- Mettre dans les paramètres de l'école : tarifs, mois d'ouverture, saison, devise, préfixe des reçus.
- Déconnexion : appeler `signOut`.

### 4.6 Migration des données existantes vers l'école n°1 (`alfajr`)
**Préalable (lecture seule sur la prod, à faire avec votre accord)**
1. Activer la **restauration à un instant donné (PITR)** sur la base, et/ou programmer des exports quotidiens.
2. Export géré : `gcloud firestore export gs://<bucket-sauvegardes>/$(date +%F) --database=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec --project=gen-lang-client-0481880143`.
3. Export Auth : `firebase auth:export auth-users.json --project gen-lang-client-0481880143`. Ce fichier contient les hachages : **à traiter comme un secret**.
4. Copie JSON lisible (script Admin SDK en lecture seule) pour comparer avant et après.

**Répétition**
5. Créer un **projet Firebase de dev** (par ex. `kuttab-dev`). Y faire un `gcloud firestore import` de l'export dans une base de même nom. Alternative : émulateur + import, mais le format demande un ajustement.
6. Script `scripts/migrate-to-tenants.ts` (Admin SDK, **idempotent**, `--dry-run`, `--school=alfajr`) :
   - copie `X/{id}` vers `schools/alfajr/X/{id}` avec le même ID et `schoolId` ajouté ; `settings/system` vers `schools/alfajr/settings/system` ;
   - `appUsers` : pour chaque compte, retrouve ou crée l'utilisateur Auth `{username}@alfajr.local` (Admin SDK, à partir du mot de passe connu), écrit `users/{uid}` et `schools/alfajr/members/{uid}` (rôle, permissions, liens enseignant/enfants), avec **`mustChangePassword: true`** pour tous (les mots de passe ont été exposés) ;
   - **n'écrit pas** le champ `password` ; pose le claim `superAdmin` sur votre compte ;
   - produit un rapport : nombre de documents par collection (source vs cible), comptes créés ou rattachés, anomalies (parents sans enfant, `classId` orphelins, photos de plus de 900 Ko).
7. Lancer l'app migrée sur le dev, passer les tests de règles et faire une recette manuelle par rôle. **Répéter au moins deux fois.**

**Bascule (fenêtre de maintenance annoncée)**
8. **Geler les déploiements AI Studio et Hosting manuels** (en accord avec l'autre développeur).
9. Nouvel export, puis script sur la prod, puis **en même temps** : déploiement des règles (racine en lecture seule) + Hosting + Functions.
10. Contrôles : comptages, connexion de chaque rôle, et vérification qu'un ancien onglet resté ouvert **ne peut plus écrire à la racine** (sinon `bootstrap` réinjecterait son cache).
11. **Retour arrière** : rollback Hosting en un clic + anciennes règles. Les données racine sont intactes.
12. Après 30 jours : suppression des collections racine (`firebase firestore:delete --recursive`) et du service Cloud Run AI Studio.

---

## 5. Plan design

### 5.1 Contenu de la maquette
- `Main.dc.html` = **tableau de bord** « لوحة الكتّاب ». Il contient : en-tête avec sauvegarde/restauration, **carte du ḥifẓ** (60 ḥizb, un point par élève, clic sur un ḥizb pour voir ses élèves), 4 KPI (élèves actifs, ≥ 20 ḥizb, frais encaissés, barre empilée du tajwīd), **performance des muḥaffiẓ** (bascule notes / effectif), **« à traiter »** (alertes danger/avertissement/neutre), **présences de la semaine** (état vide), **progression du ḥifẓ** par halaqa.
- `Nav.dc.html` : menu latéral bleu nuit avec motif géométrique doré, en 3 groupes (التعليم / المالية / الإدارة) et badges.
- `Topbar.dc.html` : date, saison, pastille « متزامن », cloche, utilisateur, bouton خروج.
- `support.js` et `vendor/` : moteur d'aperçu, **ne fait pas partie du design**.
- **Écrans sans maquette** (liens morts) : Students, Classes, Exams, Fees, Accounting, Activities, Staff, Cards, Notifications. **Hors menu et absents** : connexion, paramètres et utilisateurs, portails enseignant/parent/élève, **sélecteur d'école**, modales et formulaires, gabarits d'impression (reçus, cartes QR, certificats).
- **Écarts avec l'app** :
  - « الحضور والغياب » est marqué « قريباً » (bientôt) alors que le module existe ;
  - le niveau de tajwīd « مبتدئ » n'existe pas dans `TajweedLevel` ;
  - le pied du menu indique « قاعدة البيانات المحلية » ;
  - la maquette contient des **noms qui semblent réels** (personnel) : prudence si on la partage.

### 5.2 Jetons de design à reprendre (`@theme` Tailwind 4 dans `index.css`)
| Rôle | Valeur |
|---|---|
| Fond app / surface / surface 2 | `#ECEDE6` / `#F8F8F3` / `#F1F2EB` |
| Menu latéral / primaire / primaire au survol | `#102446` / `#1B3A6B` / `#102446` |
| Accent or | `#D4A017` (badges, focus `:focus-visible`, point actif) |
| Texte / secondaire / atténué | `#1A1F2B` / `#4A5060` / `#6B7080` |
| Bordures | `#D9DBD0`, `#D0D3C6`, `#E1E3D8` |
| Succès | `#E4EDDC` / `#2F5523` / `#3F8A2E` |
| Danger | `#F5E2DE` / `#A33A2E` / `#7A2A21` |
| Avertissement | `#F6EDD2` / `#5C4300` |
| Polices | **Reem Kufi** (titres : h1 44 px, h2 22-28 px), **IBM Plex Sans Arabic** (texte 13-16 px), **Amiri** (chargée, probablement pour le texte coranique) |
| Formes | rayons 10 / 12 / 14 / 22 px ; cibles tactiles de 44 px ; `font-variant-numeric: tabular-nums` |

Cela remplace la palette actuelle émeraude/ambre (`bg-emerald-800`, `border-amber-400`…).

### 5.3 Composants réutilisables à créer
`AppShell`, `SideNav` (groupes, badge, élément désactivé), `Topbar` (+ **SchoolSwitcher**, `SyncBadge`, `NotificationBell`, `UserChip`), `PageHeader`, `Button` (primary / outline / danger), `Card`/`Section`, `KpiTile`, `ProgressBar`, `StackedBar`, `Pill`/`Badge`, `ActionAlert` (3 tons), `SegmentedControl`, `Select`, `Input`, `FormField`, `Modal`/`Drawer`, `DataTable`/`Row`, `EmptyState`, `InitialAvatar`, `GeometricPattern` (motif SVG), `HifzMap` (widget des 60 ḥizb).

### 5.4 RTL
- Déjà en place : `dir="rtl"` sur `<html>`.
- Utiliser **exclusivement les utilitaires logiques** Tailwind (`ps-/pe-`, `ms-/me-`, `start-/end-`, `border-s`).
- Retourner les icônes directionnelles (la maquette applique `scaleX(-1)` sur la déconnexion).
- Recharts : axes et ordre à inverser.
- Chiffres : occidentaux tabulaires, comme dans la maquette.
- Tester l'impression (`@media print` existe dans `index.css`) et le mobile (la maquette fonctionne en flex-wrap, sans menu repliable dessiné).

### 5.5 Méthode
1. **Préalable** : découper `App.tsx` en écrans (`src/screens/*`) et extraire un `DataProvider` (abonnements + RealmSimDB), **sans changement de comportement**. Cela sert aussi le multi-tenant : il n'y aura qu'un seul endroit pour l'école courante.
2. Jetons, puis composants, puis `AppShell`, puis **tableau de bord** (maquette fidèle).
3. Écrans suivants **par extrapolation** du langage visuel, en attendant les maquettes, un écran par prompt, avec une capture Playwright avant/après.
4. Gabarits d'impression en dernier (reçus, cartes, certificats : charte et tampon par école).

---

## 6. Estimation de l'effort

« h agent » = durée de travail d'un agent Claude Code (compressible en parallèle). « h humain » = relecture, décisions, recette, opérations sur la prod.

| Lot | Contenu | h agent | h humain | Modèle conseillé |
|---|---|---|---|---|
| **0. Correctif de sécurité urgent** *(optionnel, sur la prod actuelle)* | Connexion = `signIn` Firebase **d'abord**, profil lu ensuite ; `appUsers` et `settings` non publics ; retrait des mots de passe en clair ; création de comptes Auth pour tous les utilisateurs par script ; rotation du mot de passe admin ; désactivation de l'inscription client (*à vérifier* : option « User actions » d'Identity Platform) | 4–6 | 3–4 | Opus 5.5 |
| **1. Mise en place et environnement de dev** | Dépôt git + code à jour, projet Firebase dev, alias `.firebaserc` (dev par défaut), config par environnement (`VITE_*`), émulateurs, copie des données de prod vers le dev, un seul gestionnaire de paquets, `CLAUDE.md` | 3–5 | 2–3 | Sonnet 5.5 |
| **2. Découpage de `App.tsx` + DataProvider** | Refactor sans changement fonctionnel, préalable aux lots 3 et 6 | 8–12 | 2–3 | Opus 5.5 (plan) → Sonnet 5.5 (exécution) |
| **3. Données multi-tenant** | Chemins `schools/{id}`, `schoolId`, SchoolContext, cache local par école, suppression de bootstrap/démo/migrations client, paramètres métier par école | 6–10 | 2–3 | Opus 5.5 |
| **4. Auth et rôles** | Connexion Firebase, `users`/`members`, Cloud Functions (création de compte, réinitialisation de mot de passe, rôle, école), super-admin par claim, changement obligatoire de mot de passe, sélecteur d'école, déconnexion, branchement de la matrice de permissions | 12–20 | 4–6 | Opus 5.5 |
| **5. Règles Firestore + tests** | Règles § 4.3, tests rôle × collection × action et inter-écoles. **+6–10 h** si les portails parent/élève sont restreints dès la v1 | 6–10 | 3–4 | Opus 5.5 ; **relecture adverse unique par Fable 5.1** recommandée |
| **6. Migration** | Script idempotent + simulation + rapport, 2 répétitions sur le dev, procédure de bascule et de retour arrière, puis bascule | 6–10 | 6–8 | Opus 5.5 ; relecture Fable 5.1 du script avant la prod |
| **7. Design : socle** | Jetons, composants, AppShell, Topbar + sélecteur d'école | 6–10 | 2–3 | Sonnet 5.5 |
| **8. Design : écrans** | Tableau de bord (maquette) 4–6 h ; ~14 autres écrans et portails sans maquette, 2–4 h chacun ; impressions 4–6 h | 36–60 | 12–18 | Sonnet 5.5 |
| **9. Tests** | Playwright : parcours par rôle et par école, changement d'école, impressions ; vérification de non-régression | 6–10 | 3–4 | Sonnet 5.5 |
| **10. Déploiement** | GitHub Actions (federation d'identité, sans clé JSON), canaux de prévisualisation sur le dev, prod sur tag ou validation manuelle, Functions + secret Gemini (Secret Manager) + rewrite `/api/**`, retrait de Cloud Run AI Studio, restriction de la clé API + App Check | 4–6 | 2–3 | Sonnet 5.5 |
| **Total** | | **≈ 97–159** | **≈ 41–59** (+ Lot 0) | |

**À propos de l'hypothèse « juste des colonnes tenant ID, peu de prompts »** :
- **Juste pour la partie données (Lot 3)** : moins de 10 h d'agent, grâce à la couche Firestore centralisée.
- **Fausse pour l'ensemble.** Sans les lots 4 et 5, l'isolation n'est qu'apparente : un parent d'une école lirait les salaires d'une autre. Et le design (lots 7-8) dépasse à lui seul tout le reste réuni.
- **« Peu de prompts » reste réaliste** avec un `CLAUDE.md` et **un prompt par lot** contenant des critères d'acceptation (tests à faire passer). Il faut toutefois garder **trois validations humaines non négociables** : relecture des règles, résultat de la simulation de migration, bascule en prod.

**Ordre conseillé** : 0 (si accord) → 1 → 2 → 3 + 4 + 5 → 6 (**bascule avec l'ancien design**) → 7 → 8 par écran, en déploiements progressifs → 9 en continu → 10 dès le lot 1 sur le dev.

**Modèles** (tarifs de l'API Anthropic, $ par million de jetons entrée/sortie) :
- **Opus 5.5** (4 / 20) : lots transverses ou critiques pour la sécurité. Effort `high` à `xhigh`.
- **Sonnet 5.5** (2 / 10) : exécution, UI, tests, CI.
- **Haiku 5.5** (0,10 / 0,50) : relancer `reanalyse.sh` sur la nouvelle version et faire l'inventaire des chaînes ou des écarts.
- **Fable 5.1** (10 / 50, le plus capable) : seulement pour **une** relecture adverse des règles et du script de migration avant la prod. Coût marginal faible au regard du risque sur des données réelles.

---

## 7. Questions ouvertes

1. **Code à jour** : quand ? Pouvez-vous aussi copier les **règles réellement déployées** depuis la console ? L'autre développeur va-t-il encore déployer depuis AI Studio, et peut-on geler ses déploiements ?
2. **Quelle URL les utilisateurs ouvrent-ils** : domaine Hosting en arabe ou `*.run.app` ? Le rapport IA fonctionne-t-il en prod aujourd'hui ? Faut-il le garder (budget Gemini) ?
3. **Correctif urgent (Lot 0)** : m'autorisez-vous à le préparer pour la prod actuelle, sans attendre le multi-tenant ?
4. **Organisation** : qui crée les écoles (vous seul, ou en libre-service) ? Une association peut-elle avoir plusieurs clubs, avec des finances communes ou séparées ? Chaque école a-t-elle son propre bureau, son RIB et sa numérotation de reçus ?
5. **Portails parent et élève** : sont-ils réellement utilisés (`lastLogin` des comptes `p_…` / `s_…`) ? Faut-il les garder dès la v1, avec un accès limité aux enfants concernés (+6–10 h) ?
6. **Connexion** : peut-on n'accepter que le nom d'utilisateur, unique sur toute la plateforme, et abandonner la connexion par nom complet ou téléphone ? Ou préférez-vous un code école, un sous-domaine ou un domaine par école ?
7. **Personnes présentes dans plusieurs écoles** : un enseignant peut-il exercer dans deux écoles avec un seul compte ? Un parent peut-il avoir des enfants dans deux écoles ?
8. **Directeur multi-écoles** : a-t-il besoin d'une **vue consolidée** (finances ou effectifs cumulés) ou seulement de passer d'une école à l'autre ?
9. **Design** : d'autres maquettes arrivent-elles (les 9 écrans liés, connexion, paramètres, portails, sélecteur d'école, impressions) ? « مبتدئ » est-il un nouveau niveau de tajwīd ? Les présences doivent-elles vraiment apparaître comme « bientôt » ? Le nom et le logo varient-ils par école dans le menu ?
10. **Volume** : nombre de documents par collection, d'utilisateurs Auth, taille des photos ? (Cela influe sur les coûts, car chaque client télécharge toute la base.)
11. **Environnements** : peut-on créer un projet Firebase de dev (facturation) ? Où héberger le dépôt GitHub (organisation, droits) ? Quelle est la localisation de la base Firestore (pour la région des Functions) ?
12. **Conformité** : qui est responsable du traitement pour chaque école (CNDP) ? Avez-vous le consentement des parents pour les photos des élèves ?
13. **Délais et budget** : y a-t-il une date cible, par exemple la rentrée ou une nouvelle école à accueillir ?

---

## 8. Empreinte de référence (version analysée)
À comparer avec la sortie de `reanalyse.sh` sur la nouvelle version :
- Lignes : App.tsx **8 383**, db.ts **1 398**, firebase.ts **318**, types.ts **620** ; composants : Activities 3 020, Finance 2 697, Teacher 1 716, Settings 1 528 ; total TS ≈ **22 000**.
- **16 collections** à la racine (liste du § 2.1), toutes présentes dans les règles. Lecture publique (`if true`) : `settings`, `appUsers`. Aucun `get()`/`exists()`/claim dans les règles.
- Base nommée `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`, config en dur dans `firebase.ts`. Hosting sans rewrite `/api`. `.firebaserc` par défaut = prod.
- 6 occurrences de `password: … "123"`, 2 de `FajrAcademy@2026!`. Connexion par `matchPassword` côté client ; `logoutFromFirebaseAuth` jamais appelée.
- 16 clés localStorage `alfajr_*` + `alfajr_logged_user`. Aucune mention de `schoolId` ou `tenant`.
- 13 valeurs de `activeTab`. 6 rôles + super-admin `admin_alfajr`.
- Maquette : 3 fichiers `.dc.html` ; 9 pages liées manquantes.

**Ce qui risque le plus de changer dans la version à jour** : numéros de ligne et taille de `App.tsx`, nouvelles collections ou nouveaux champs, règles (modifiées depuis AI Studio ?), flux de connexion, format des IDs, modèle Gemini, ajouts éventuels de Storage ou de Functions. Les §§ 4 à 6 (approche, schéma cible, ordre des lots) devraient rester valables sauf si la nouvelle version a déjà commencé le multi-tenant ou refait l'auth.

---

## 9. Faut-il recommencer depuis le début ?

**Non, ce ne serait pas plus rapide.** L'auth, les règles, la couche données, la migration, toute l'interface (nouveau design) et la CI sont à refaire **dans tous les cas**. Une réécriture n'évite que le lot 2 (découpage d'`App.tsx`, 8–12 h). En échange, elle oblige à reproduire à l'identique les comportements cachés :
- paiements mensuels générés depuis l'inscription, tarifs 70/100 MAD ;
- comptes parents rattachés par téléphone ;
- lien entre activités et comptabilité ;
- numérotation des reçus, cartes QR, scan de présence, certificats ;
- matrice de permissions, rapport IA, sauvegarde et restauration.

Enfin, les données réelles imposent le schéma actuel : ce n'est jamais vraiment « depuis zéro ».

| Option | h agent | Multi-tenant en prod après | Résultat |
|---|---|---|---|
| **A. Faire évoluer** (plan §§ 4–6) | ≈ 97–159 | ≈ 45–70 h (lots 1 à 6), avec l'ancien design | Base héritée d'AI Studio, nettoyée progressivement |
| **B. Nouveau socle + portage écran par écran** (on garde `types.ts`, les fonctions métier pures, les libellés arabes, les gabarits d'impression ; on réécrit routeur, contexte d'école, accès aux données, auth, règles et écrans dans le nouveau design) | ≈ 100–180 (+ Lot 0 obligatoire) | Presque à la fin (bascule unique) | Code propre, maintenable, testable |
| **C. Page blanche** | ≈ 150–250 | Fin du projet | Risque élevé d'oubli de fonctionnalités. Non recommandée |

**Recommandation**
- **Une deuxième école arrive bientôt** : option A. Le multi-tenant sécurisé est en ligne environ deux fois plus tôt.
- **Sinon** : l'option B donne un meilleur résultat pour un coût comparable. Un monolithe de 8 400 lignes rend chaque prompt d'agent lent et risqué.
- **Dans les deux cas**, le correctif de sécurité (Lot 0) doit passer en prod immédiatement.

**Prochaine étape pour chiffrer B précisément** : un inventaire des fonctionnalités et des règles cachées de la version à jour du code.

---

## 10. Version de prod (`quran-school-app-main_1.zip`, 21/10/2026) : écarts avec la première version

**Fichiers modifiés (5)** : `App.tsx` (8 383 → 8 537 l.), `db.ts` (1 398 → 1 546), `types.ts` (620 → 651), `SettingsManagement.tsx` (1 528 → 1 636), `index.html` (balises meta/og).
**Fichiers inchangés** : `firestore.rules`, `firebase.ts`, `server.ts`, `firebase.json`, `.firebaserc`, configs, autres composants.

### 10.1 Ce qui ne change pas
- **Les failles S1 à S5 sont toutes présentes à l'identique.** Règles inchangées, mots de passe en clair, `123` par défaut, `FajrAcademy@2026!` dans le bundle, connexion par comparaison côté client, inscription Auth automatique, `logoutFromFirebaseAuth` jamais appelée.
- Toujours **aucune trace de multi-tenant**.
- Même architecture : localStorage d'abord, `bootstrapCollectionIfEmpty`, abonnements à des collections entières.

### 10.2 Nouveautés fonctionnelles
| Changement | Détail | Impact sur le plan |
|---|---|---|
| **3 nouveaux rôles** | `متطوع` (bénévole), `عامل نظافة / صيانة` (entretien), `أخرى` (autre). **9 rôles au total** ; matrices par défaut dans `getDefaultPermissionsForRole` | Les règles du § 4.3 doivent les classer (personnel sans accès aux données élèves ni aux finances). Le rôle est déduit automatiquement de la catégorie, du titre ou de la spécialité du personnel (`getRoleAndPermissionsForStaff`, recherche de mots-clés) |
| **Archivage = compte suspendu** | Archiver un membre du personnel ou un élève passe son compte en `isActive: false` et `isArchived: true`. Un parent est suspendu quand tous ses enfants sont archivés | **Comportement à conserver** : dans la cible, le statut `members.isActive` sera mis à jour par Function ou par règle |
| **Bouton « مزامنة فورية للأدوار »** (Paramètres › Utilisateurs) | Relance `syncAppUsers` pour aligner les rôles sur la fiche du personnel | Disparaît dans la cible (rôles gérés dans `members`) |
| **Protections du compte directeur** | Nombreux garde-fous « NEVER match director (u1) » : rapprochement de comptes, connexion, état de session | **Indique un incident en prod** : le compte directeur a probablement été écrasé par un parent ou un enseignant de même nom. ⚠️ La migration doit **auditer `appUsers`** (doublons de noms d'utilisateur, `u1` modifié, rôles incohérents) |
| **Indicateurs** | « أبعد حزب بلغه طالب » (ḥizb le plus avancé) en plus de la moyenne ; libellés selon le rôle | Cohérent avec la maquette (« أبعد حزب بلغه طالب ») |

### 10.3 Nouveaux risques introduits
1. **Les comptes se réécrivent en boucle depuis chaque navigateur.** `syncAppUsers` tourne maintenant à **chaque snapshot** de `appUsers` et écrit dans Firestore dès qu'il voit un écart de rôle ou de statut. Deux clients au cache local différent (par exemple un vieil onglet) peuvent **se contredire et s'écraser mutuellement**. Les droits personnalisés `canEdit*` du personnel sont aussi **réinitialisés aux valeurs par défaut** à chaque synchronisation : seule la matrice `permissions` est conservée.
2. **Rattachement parent/élève par correspondance approximative de noms** (`isStudentBelongsToUser`, App.tsx ≈ l. 2742) :
   - **parent** : normalisation (ا/أ/إ, ة/ه, ى/ي) puis **`includes` dans les deux sens**. Un parent nommé « محمد » voit **tous** les élèves dont le nom du parent contient « محمد ». Même chose pour un numéro de téléphone partiellement contenu ;
   - **élève** : même correspondance approximative ; avec `user` nul, la fonction **renvoie `true`** ; et si aucun élève ne correspond, l'écran personnel **affiche le dossier du premier élève actif** (`students.find(s => !s.isArchived) || students[0]`). **Un élève peut donc voir le dossier d'un autre élève** ;
   - **bénévoles, agents d'entretien, « autre »** : la fonction renvoie `true` pour tous les élèves.

   C'est déjà un problème de **confidentialité dans l'interface** (sans parler de la base, entièrement téléchargée de toute façon). Dans la cible, **il faut des liens explicites** `members.linkedStudentIds`, calculés par le script de migration puis **validés à la main** (liste des correspondances douteuses à faire vérifier par l'école).
3. **Connexion ambiguë** : si plusieurs comptes ont le même identifiant (nom complet ou téléphone) et le même mot de passe (`123`), le compte directeur est préféré, sinon le premier trouvé.

### 10.4 Ajustements de l'estimation
| Lot | Avant | Après | Raison |
|---|---|---|---|
| 4. Auth et rôles | 12–20 | **13–22** | 9 rôles ; suspension automatique à l'archivage à reproduire |
| 5. Règles + tests | 6–10 | **7–11** | 3 rôles de plus dans la matrice de tests |
| 6. Migration | 6–10 | **8–13** | Audit et nettoyage de `appUsers` (doublons, `u1`), calcul et **liste de validation des liens parent/enfant** |
| Lot 0 (urgent) | 4–6 | **5–7** | Corriger aussi la boucle d'écriture de `syncAppUsers` et l'affichage du dossier d'un autre élève |
| **Total** | ≈ 97–159 | **≈ 102–167 h agent** | Humain : +2 à 3 h (validation des liens par l'école) |

### 10.5 Empreinte de référence de la version de prod
- Lignes : App.tsx **8 537**, db.ts **1 546**, types.ts **651**, SettingsManagement **1 636**, total TS ≈ **22 500**.
- Règles : **identiques** à la première version (16 collections, `if true` sur `settings` et `appUsers`, aucun `get()`/`exists()`/claim).
- Mots de passe : 6 occurrences de `"123"`, 2 de `FajrAcademy@2026!`. Connexion par `matchPassword` (App.tsx l. 3154).
- **9 rôles** ; 13 valeurs d'`activeTab` ; 17 clés localStorage `alfajr_*` ; aucun `schoolId`.
