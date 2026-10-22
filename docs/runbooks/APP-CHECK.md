# Runbook — activation d'App Check (reCAPTCHA Enterprise)

> **À exécuter par un humain**, d'abord sur le projet de **dev**, puis sur la
> prod. Rien n'a été exécuté par un agent. Décision : D44.
> Code prêt et **désactivé par défaut** : `VITE_APPCHECK_SITE_KEY` vide côté
> client, `APPCHECK_ENFORCE=false` côté Functions.

```bash
export PROJECT=gen-lang-client-0481880143          # ou l'identifiant du projet de dev
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export DOMAIN=<domaine-hosting>                     # ex. gen-lang-client-0481880143.web.app
```

## 0. Ce que fait le code
- Client (`src/firebase.ts`) : si `VITE_APPCHECK_SITE_KEY` est défini,
  `initializeAppCheck` avec `ReCaptchaEnterpriseProvider` et rafraîchissement
  automatique. Firestore, Auth et les callables joignent alors le jeton ; la
  fonction `api` le reçoit dans l'en-tête `X-Firebase-AppCheck`. En mode
  émulateurs, ou si `VITE_APPCHECK_DEBUG_TOKEN` est défini, le fournisseur de
  débogage est utilisé.
- Functions : callables `enforceAppCheck: APPCHECK_ENFORCE` ; `api` vérifie
  l'en-tête et ne refuse (401) que si `APPCHECK_ENFORCE=true`. Dans les deux
  cas un journal `appcheck` / `ai.analyze` indique l'état du jeton (`valid`,
  `missing`, `invalid`) : c'est la mesure de la période d'observation.

## 1. Clé reCAPTCHA Enterprise
```bash
gcloud services enable recaptchaenterprise.googleapis.com firebaseappcheck.googleapis.com --project=$PROJECT
gcloud recaptcha keys create --display-name="kuttab-web-appcheck" --web \
  --domains=$DOMAIN,localhost --integration-type=SCORE --project=$PROJECT
gcloud recaptcha keys list --project=$PROJECT          # noter l'identifiant (clé de site)
```
(Retirer `localhost` de la clé de prod.)

## 2. Enregistrement de l'application web dans App Check
Console Firebase › App Check › Applications › application web › **reCAPTCHA
Enterprise** › coller la clé de site › durée de vie du jeton : 1 h (défaut).
Ne **pas** cliquer « Appliquer » (Enforce) sur aucun service à ce stade.

Projet de dev seulement : App Check › application web › menu › **Gérer les
jetons de débogage** › ajouter un jeton (UUID) ; le mettre dans `.env.local`
(`VITE_APPCHECK_DEBUG_TOKEN=…`) et, pour la CI, dans la variable de
l'environnement GitHub `dev`. Jamais de jeton de débogage sur la prod.

## 3. Déploiement du client avec la clé (observation)
Ajouter à `.env.production` (valeur publique) puis déployer le Hosting :
```bash
echo 'VITE_APPCHECK_SITE_KEY="<clé de site>"' >> .env.production
npm run build && npx firebase deploy --only hosting --project prod
```
Commiter `.env.production` (clé publique, aucun secret).

## 4. Période d'observation (au moins 7 jours, idéalement 14)
- Console Firebase › App Check › **Métriques** par service (Firestore,
  Authentication) : part des requêtes « vérifiées ». Objectif : > 99 % avant
  application ; les requêtes « non vérifiées » restantes doivent s'expliquer
  (anciens onglets, robots, scripts d'administration : l'Admin SDK n'est pas
  concerné par App Check).
- Journaux des Functions :
  `jsonPayload.message="appcheck"` (callables) et
  `jsonPayload.message="ai.analyze" jsonPayload.appCheck!="valid"` (`api`).
- Vérifier depuis les postes de l'école (navigateurs anciens, bloqueurs) que
  reCAPTCHA se charge : la CSP de `firebase.json` autorise `www.google.com`,
  `www.gstatic.com`, `www.recaptcha.net` et `content-firebaseappcheck.googleapis.com`.

## 5. Application (enforcement), service par service
1. Functions : `APPCHECK_ENFORCE=true` dans `functions/.env.gen-lang-client-0481880143`, puis
   ```bash
   npx firebase deploy --only functions --project prod
   ```
2. Firestore : Console › App Check › API › Cloud Firestore › **Appliquer**
   (s'applique à toutes les bases du projet, dont la base nommée `$DB`).
3. Authentication : Console › App Check › API › Authentication › **Appliquer**
   (le cas échéant, Identity Platform).
Délai de propagation : jusqu'à 15 minutes. Tester connexion, lecture, écriture,
création de compte (callable) et rapport IA.

## 6. Retour arrière
- Console › App Check › API › service › **Ne plus appliquer** (immédiat à 15 min).
- Functions : `APPCHECK_ENFORCE=false` et redéploiement.
- Client : vider `VITE_APPCHECK_SITE_KEY`, rebuild, redéploiement du Hosting
  (seulement si reCAPTCHA pose problème : sans application, la clé est sans effet bloquant).
