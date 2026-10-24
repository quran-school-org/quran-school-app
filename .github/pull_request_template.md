## Quoi et pourquoi

<!-- Ce que change la PR, en deux ou trois phrases, et le problème qu'elle règle. -->

## Comment vérifier

<!-- Étapes pour relire : écran, compte de démo, commande. -->

## Vérifications

- [ ] `npm run check` est vert (lint de l'app et des Functions, tests unitaires, build)
- [ ] Si `firestore.rules` ou `functions/` changent : `npm run test:rules` est vert et de nouveaux tests couvrent le changement
- [ ] Si l'interface change : captures avant / après jointes, et rien n'a été touché au design au-delà du nécessaire
- [ ] Toute décision structurante est ajoutée à `docs/DECISIONS.md` (contexte, décision, retour arrière)
- [ ] Aucun secret, export de données ni fichier de mots de passe dans la PR
- [ ] Aucune commande n'a été lancée vers la prod (`gen-lang-client-0481880143`)
