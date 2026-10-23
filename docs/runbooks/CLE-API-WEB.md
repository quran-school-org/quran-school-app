# Runbook — restriction de la clé API web Firebase

> **À EXÉCUTER PAR UN HUMAIN**, sur le projet de dev d'abord. Aucune commande
> n'a été lancée par un agent. Décision : D50.
> La clé web (`VITE_FIREBASE_API_KEY`, dans `.env.production`) est publique par
> nature : la restreindre limite son usage hors de l'application (quota,
> abus de l'API Identity Toolkit), elle ne remplace pas les règles Firestore.

```bash
export PROJECT=gen-lang-client-0481880143      # ou le projet de dev
export WEB_KEY=$(grep VITE_FIREBASE_API_KEY .env.production | cut -d'"' -f2)
gcloud services api-keys list --project=$PROJECT \
  --format="table(uid,displayName,restrictions.browserKeyRestrictions,restrictions.apiTargets)"
export KEY_ID=$(gcloud services api-keys lookup "$WEB_KEY" --project=$PROJECT --format='value(name)' | awk -F/ '{print $NF}')
gcloud services api-keys describe $KEY_ID --project=$PROJECT    # état actuel, à conserver (retour arrière)
```

## 1. Domaines de l'application
Lister les domaines réellement utilisés (Hosting, domaine personnalisé
éventuel, URL `*.run.app` d'AI Studio **à ne pas reprendre** : ce service doit
être arrêté, O-01) :
```bash
npx firebase hosting:sites:list --project prod
npx firebase hosting:channel:list --project prod   # domaines servis par chaque site
```

## 2. Restriction par référent HTTP et par API
```bash
gcloud services api-keys update $KEY_ID --project=$PROJECT \
  --allowed-referrers="https://$PROJECT.web.app/*,https://$PROJECT.firebaseapp.com/*" \
  --api-target=service=identitytoolkit.googleapis.com \
  --api-target=service=securetoken.googleapis.com \
  --api-target=service=firestore.googleapis.com \
  --api-target=service=firebaseappcheck.googleapis.com
```
- Ajouter `https://<domaine-personnalisé>/*` s'il existe.
- **Projet de dev** : ajouter `http://localhost:3000/*` et
  `http://127.0.0.1:3000/*` si l'on teste le front local contre le dev, et
  `https://$PROJECT--*.web.app/*` n'étant pas un motif accepté, autoriser
  `https://*.web.app/*` **sur le dev uniquement** (canaux d'aperçu, D46).
- Les appels aux Cloud Functions (callables, `api`) n'utilisent pas la clé ;
  Cloud Storage non plus. Si une fonctionnalité Firebase est ajoutée plus tard
  (Storage, Messaging…), ajouter son API ici.

Délai de propagation : jusqu'à 5 minutes.

## 3. Vérifications
- Depuis l'application (onglet privé) : connexion, lecture, écriture, création
  de compte.
- Hors navigateur (doit échouer : référent absent) :
  ```bash
  curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$WEB_KEY" \
    -H 'Content-Type: application/json' -d '{"email":"x@alfajr.local","password":"x","returnSecureToken":true}' | head -5
  # → "API_KEY_HTTP_REFERRER_BLOCKED"
  ```
- Les contrôles en ligne de commande des runbooks (ex. `MIGRATION-BASCULE.md`
  §5) doivent alors envoyer le référent :
  `curl -H "Referer: https://$PROJECT.web.app/" …`.
- Les scripts d'administration (Admin SDK) ne sont pas concernés.

## 4. Clé Gemini : sans objet (D76)
L'application n'utilise plus d'IA : aucune clé Gemini dans Secret Manager,
aucune à restreindre. Seule reste celle de l'ancien service Cloud Run d'AI
Studio, s'il en avait une : la **supprimer** après l'arrêt de ce service
(O-01, `LOT0-DEPLOIEMENT.md`).

## 5. Compléments Authentication (console)
- Authentication › Paramètres › Domaines autorisés : garder seulement les
  domaines du §1 (et `localhost` sur le dev).
- Inscription libre désactivée et protection contre l'énumération des e-mails
  activée (O-02, runbook `LOT0-DEPLOIEMENT.md`).

## 6. Retour arrière
```bash
gcloud services api-keys update $KEY_ID --project=$PROJECT --clear-restrictions
```
(puis réappliquer l'état noté avec `describe` si une restriction existait avant).
