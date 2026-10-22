# Runbook — proxy IA (fonction `api`) : quotas et journaux

> **À exécuter par un humain.** Aucune de ces commandes n'a été lancée par un
> agent. Projet de prod : `gen-lang-client-0481880143`, base
> `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`. Décision : D43.

```bash
export PROJECT=gen-lang-client-0481880143 DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
```

## 1. Ce que fait la fonction
- `POST /api/gemini/analyze` : jeton Firebase, membre actif avec un rôle
  pédagogique, corps ≤ 32 Kio (sinon 413), puis **une** transaction Firestore
  sur quatre compteurs (collection racine `aiQuota`, fermée aux clients) :
  par utilisateur et par jour, par utilisateur et par minute, par école et par
  jour, global par jour (jours en UTC). Au-delà : 429 + `Retry-After`, aucun
  appel au modèle. Compteur indisponible : 503 (le service ne s'ouvre jamais
  sans limite).
- Journaux (`ai.analyze`) : issue, école, pseudonyme de l'utilisateur
  (SHA-256 tronqué), durée, taille de l'invite. Jamais le nom de l'élève, les
  notes, l'invite, la réponse ni le message d'erreur brut.

## 2. Paramètres (non secrets)
Dans `functions/.env.gen-lang-client-0481880143` (versionné), puis redéploiement
des Functions :

| Paramètre | Défaut | Rôle |
|---|---|---|
| `AI_DAILY_LIMIT_PER_USER` | 30 | rapports par utilisateur et par jour |
| `AI_PER_MINUTE_LIMIT_PER_USER` | 5 | rafale par utilisateur et par minute |
| `AI_DAILY_LIMIT_PER_SCHOOL` | 300 | rapports par école et par jour |
| `AI_DAILY_LIMIT_GLOBAL` | 1000 | toute la plateforme, par jour |

Une valeur à `0` ferme le service à ce niveau. **Coupure d'urgence** (abus,
facture) : `AI_DAILY_LIMIT_GLOBAL=0` puis
```bash
npx firebase deploy --only functions:api --project prod
```

## 3. Purge automatique des compteurs (TTL), une fois
Chaque compteur porte `expiresAt` (J+2 pour les compteurs du jour, H+2 pour ceux
de la minute). Activer la politique TTL sur ce champ :
```bash
gcloud firestore fields ttls update expiresAt --collection-group=aiQuota \
  --enable-ttl --database=$DB --project=$PROJECT
gcloud firestore fields ttls list --database=$DB --project=$PROJECT   # contrôle
```
Sans TTL, les compteurs s'accumulent (quelques documents par jour et par
utilisateur actif) sans effet sur le fonctionnement.

## 4. Suivi
- Console › Logging, filtre :
  `resource.type="cloud_run_revision" jsonPayload.message="ai.analyze"`
  puis regrouper par `jsonPayload.outcome` (`ok`, `rate-limited`,
  `fallback-error`, `rejected-*`).
- Alerte conseillée : budget de facturation sur le projet (Console › Facturation
  › Budgets) et alerte sur le volume de `rate-limited`.
- Clé Gemini : Secret Manager `GEMINI_API_KEY` ; restreindre la clé à l'API
  Generative Language dans la console Google AI Studio / Cloud.
