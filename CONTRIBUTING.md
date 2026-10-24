# Règles du dépôt SmartResto

Ce document est la loi du dépôt. En cas de doute, il tranche.

## 1. Un fichier, un propriétaire

Vous ne modifiez que ce qui vous appartient. Si vous avez besoin d'un changement ailleurs, ouvrez une Issue : le propriétaire décide.

| Étudiant | Module | Dossiers et fichiers qui lui appartiennent |
|---|---|---|
| Théophile | Tables et réservations | `pages/tables/`, `pages/reservations/`, `components/tables/`, `composables/useTables.js`, `db/tables.json`, `db/reservations.json` |
| Tresor | Plats | `pages/plats/`, `components/plats/`, `composables/usePlats.js`, `db/plats.json` |
| Shammah | Catégories et carte | `pages/categories/`, `pages/carte.vue`, `components/categories/`, `composables/useCategories.js`, `db/categories.json` |
| Traoré | Commandes + socle (Tech Leader) | `pages/commandes/`, `components/commandes/`, `composables/useCommandes.js`, `composables/usePanier.js`, `db/commandes.json`, `db/lignesCommande.json`, **et le socle** : `app.vue`, `nuxt.config`, `layouts/`, `composables/useApi.js`, `composables/useNotifier.js`, `utils/format.js` |
| Jephte | Cuisine | `pages/cuisine/`, `components/cuisine/`, `composables/useCuisine.js` |
| Jean-Pierre | Factures et paiements | `pages/factures/`, `components/factures/`, `composables/useFactures.js`, `db/factures.json`, `db/paiements.json` |
| Gaël | Personnel et rôles | `pages/connexion.vue`, `pages/personnel/`, `middleware/`, `components/personnel/`, `composables/useAuth.js`, `db/employes.json` |
| Julien | Ingrédients et stock | `pages/stock/`, `components/stock/`, `composables/useStock.js`, `db/ingredients.json`, `db/mouvementsStock.json` |
| Sammy | Fournisseurs et approvisionnements | `pages/fournisseurs/`, `pages/approvisionnements/`, `components/fournisseurs/`, `composables/useFournisseurs.js`, `db/fournisseurs.json`, `db/approvisionnements.json` |
| Resia | Rapports de ventes | `pages/rapports/`, `components/rapports/`, `composables/useRapports.js` |

Les tests de chacun vivent dans `tests/<module>/`.

## 2. Qui a le droit d'écrire quoi dans l'API

Lire n'importe quelle ressource est toujours permis. Écrire est réservé :

| Ressource | Écriture autorisée |
|---|---|
| `plats` | Tresor |
| `categories` | Shammah |
| `tables`, `reservations` | Théophile |
| `commandes` | Traoré (création, modification, `servie`, `annulee`) · Jephte (`statut` vers `en_preparation` ou `prete` uniquement) · Jean-Pierre (`statut` vers `payee` uniquement) |
| `lignesCommande` | Traoré · Jephte (champ `statutCuisine` uniquement) |
| `ingredients` | Julien · Sammy (champ `stock`, uniquement à la réception d'un approvisionnement) |
| `mouvementsStock` | Julien · Sammy (création d'un mouvement `entree` à la réception) |
| `fournisseurs`, `approvisionnements` | Sammy |
| `factures`, `paiements` | Jean-Pierre |
| `employes` | Gaël |

## 3. Cycle de vie d'une commande

```
en_attente  ->  en_preparation  ->  prete  ->  servie  ->  payee
     \_______________________ annulee (avant "payee") ____/
```

## 4. Git

- Branche : `feat/<module>-<prenom>` (exemple : `feat/plats-tresor`). Jamais de commit direct sur `main`.
- Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Plusieurs petites Pull Requests, pas une grosse. Au minimum 3 par étudiant, idéalement moins de 400 lignes chacune.
- Remplir le modèle de PR. Une PR sans captures d'écran est renvoyée.
- Seul Traoré (Tech Leader) fusionne dans `main`. Les PR de Traoré sont relues par un autre étudiant avant fusion.
- Avant de pousser : `git pull origin main` sur votre branche.
- **Aucune nouvelle dépendance sans l'accord de Traoré.** Deux installations simultanées créent des conflits sur `package.json` et `package-lock.json`. Demandez par Issue ; Traoré installe et pousse.

## 5. Données

- `db.json` n'est pas versionné : c'est votre état local. `npm run api` le reconstruit depuis `db/` (état remis à zéro).
- `npm run api:garder` relance l'API sans réinitialiser vos données.
- Pour changer les données de départ partagées, modifiez votre fichier `db/<ressource>.json` dans une PR, puis `npm run db:check`.
- Le port de l'API est **3001** (Nuxt occupe déjà le 3000).
