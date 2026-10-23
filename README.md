# SmartResto

Application de gestion de restaurant, projet d'équipe Nuxt.

## Lancer le projet

Il faut **deux terminaux ouverts en même temps**.

### 1. Première fois seulement

```bash
git clone <adresse-du-depot>
cd smartresto
npm install
```

### 2. Terminal 1 : l'API (données)

```bash
npm run api
```

L'API tourne sur http://localhost:3001. Pour vérifier, ouvre
http://localhost:3001/plats : tu dois voir du JSON.

⚠️ Cette commande **remet tes données à zéro** à chaque lancement.
Pour garder tes données, utilise `npm run api:garder`.

### 3. Terminal 2 : le site

```bash
npm run dev
```

Le site tourne sur http://localhost:3000.

### Si ça ne marche pas

- `Port already in use` : un ancien terminal est encore ouvert. Ferme-le.
- Page blanche : vérifie que l'API (terminal 1) tourne bien.

# Propriété des fichiers — SmartResto

Ce document précise le propriétaire de chaque fichier et les limites de modification. Il complète `CONTRIBUTING.md`, qui reste la référence officielle. Les commentaires placés dans les fichiers source rappellent ces règles ; pour les fichiers JSON et `package.json`, où les commentaires invalideraient le format, cette table fait foi.

## Membres et périmètres

- **Traoré — Tech Leader + Commandes** : socle Nuxt, layout, API commune, notifications, formatage, configuration, scripts de base de données, commandes et lignes de commande. Fusionne les PR dans `main`. Les PR de Traoré doivent être relues par un autre membre.
- **Théophile — Tables et réservations** : pages, composants, composable et données de tables/réservations.
- **Tresor — Plats** : page, composants, composable et données des plats.
- **Shammah — Catégories et carte** : pages, composants, composable et données des catégories ; affiche les plats via l’API.
- **Jephte — Cuisine** : écran cuisine et suivi des statuts de préparation. Ne possède pas les données complètes des commandes.
- **Jean-Pierre — Factures et paiements** : pages, composants, composable, données de factures et paiements.
- **Gaël — Personnel et rôles** : connexion, personnel, middleware, composable d’authentification et données employés.
- **Julien — Ingrédients et stock** : page, composants, composable et données d’ingrédients/mouvements de stock.
- **Sammy — Fournisseurs et approvisionnements** : pages, composants, composable et données fournisseurs/approvisionnements.
- **Resia — Rapports de ventes** : pages, composants et composable des rapports ; lecture des données par l’API uniquement.

## Propriétaire des fichiers présents

| Chemin relatif à `smartresto/` | Propriétaire | Limite principale |
|---|---|---|
| `app/app.vue` | Traoré | Socle global ; changement coordonné uniquement |
| `app/layouts/default.vue` | Traoré | Layout partagé ; changement coordonné uniquement |
| `app/assets/css/main.css` | Traoré | Styles globaux partagés |
| `app/composables/useApi.js` | Traoré | Client API commun |
| `app/composables/useNotifier.js` | Traoré | Notifications communes |
| `app/utils/format.js` | Traoré | Formatage commun |
| `app/composables/useAuth.js` | Gaël ; interface initiale coordonnée par Traoré | Conserver l’interface convenue et prévenir les consommateurs avant tout changement |
| `app/pages/commandes/index.vue` | Traoré | Commandes ; autres modules ne changent que les champs autorisés via API |
| `app/pages/tables/index.vue` | Théophile | Tables |
| `app/pages/reservations/index.vue` | Théophile | Réservations et disponibilité |
| `app/pages/plats/index.vue` | Tresor | Plats ; ne modifie pas les catégories |
| `app/pages/categories/index.vue` | Shammah | Catégories |
| `app/pages/carte.vue` | Shammah | Carte ; lit les plats via l’API |
| `app/pages/cuisine/index.vue` | Jephte | Cuisine ; statut vers `en_preparation`/`prete` uniquement |
| `app/pages/factures/index.vue` | Jean-Pierre | Factures et paiements |
| `app/pages/connexion.vue` | Gaël | Connexion et autorisations |
| `app/pages/personnel/index.vue` | Gaël | Personnel et rôles |
| `app/pages/stock/index.vue` | Julien | Ingrédients et mouvements de stock |
| `app/pages/fournisseurs/index.vue` | Sammy | Fournisseurs |
| `app/pages/approvisionnements/index.vue` | Sammy | Approvisionnements et réception |
| `app/pages/rapports/index.vue` | Resia | Rapports en lecture seule |
| `nuxt.config.ts` | Traoré | Configuration Nuxt partagée |
| `tailwind.config.js` | Traoré | Configuration Tailwind partagée |
| `tsconfig.json` | Traoré | Configuration TypeScript partagée |
| `package.json` | Traoré | Scripts/dépendances ; aucune dépendance ajoutée sans son accord |
| `package-lock.json` | Traoré | Verrouillage des dépendances ; ne pas modifier séparément de `package.json` |
| `scripts/build-db.js` | Traoré | Construit `db.json` depuis `db/*.json` |
| `scripts/verifier-db.js` | Traoré | Validation des données/références |
| `README.md` | Traoré | Instructions d’installation et de démarrage |
| `.gitignore` | Traoré | Fichiers exclus de Git |
| `.github/pull_request_template.md` | Traoré | Modèle partagé des PR |
| `CONTRIBUTING.md` (à la racine du dépôt) | Traoré, avec règles communes à l’équipe | Document de référence ; changements annoncés à toute l’équipe |

## Propriétaire des données JSON

Les fichiers JSON ne supportent pas les commentaires. Ne pas ajouter de `//` ou `/* */` dans ces fichiers : cela casserait le JSON. Leur propriété est déclarée ici.

| Fichier | Propriétaire | Règles d’écriture |
|---|---|---|
| `db/plats.json` | Tresor | Écriture par Tresor uniquement |
| `db/categories.json` | Shammah | Écriture par Shammah uniquement |
| `db/tables.json` | Théophile | Écriture par Théophile uniquement |
| `db/reservations.json` | Théophile | Écriture par Théophile uniquement |
| `db/commandes.json` | Traoré | Jephte ne modifie que le statut vers `en_preparation` ou `prete`; Jean-Pierre ne modifie que le statut vers `payee` |
| `db/lignesCommande.json` | Traoré | Jephte ne modifie que `statutCuisine` |
| `db/employes.json` | Gaël | Écriture par Gaël uniquement |
| `db/factures.json` | Jean-Pierre | Écriture par Jean-Pierre uniquement |
| `db/paiements.json` | Jean-Pierre | Écriture par Jean-Pierre uniquement |
| `db/ingredients.json` | Julien | Sammy ne modifie que `stock`, à la réception valide d’un approvisionnement |
| `db/mouvementsStock.json` | Julien | Sammy peut créer un mouvement `entree` à la réception ; pas de réécriture de l’historique |
| `db/fournisseurs.json` | Sammy | Écriture par Sammy uniquement |
| `db/approvisionnements.json` | Sammy | Écriture par Sammy uniquement |
| `db.json` | Généré localement | Ne pas modifier manuellement ni versionner ; `npm run api` le reconstruit |

## Fichiers à créer par module

Ces fichiers n’étaient pas tous présents dans l’archive. Créez-les seulement si nécessaires, en conservant les propriétaires suivants :

| Chemin proposé | Propriétaire |
|---|---|
| `app/components/commandes/*`, `app/composables/useCommandes.js`, `app/composables/usePanier.js` | Traoré |
| `app/components/tables/*`, `app/composables/useTables.js` | Théophile |
| `app/components/reservations/*` | Théophile |
| `app/components/plats/*`, `app/composables/usePlats.js` | Tresor |
| `app/components/categories/*`, `app/composables/useCategories.js` | Shammah |
| `app/components/cuisine/*`, `app/composables/useCuisine.js` | Jephte |
| `app/components/factures/*`, `app/composables/useFactures.js` | Jean-Pierre |
| `app/components/personnel/*`, `app/middleware/*` | Gaël |
| `app/components/stock/*`, `app/composables/useStock.js` | Julien |
| `app/components/fournisseurs/*`, `app/composables/useFournisseurs.js` | Sammy |
| `app/components/rapports/*`, `app/composables/useRapports.js` | Resia |
| `tests/<module>/*` | Propriétaire du module correspondant |

## Règles non négociables

1. Ne modifier que ses fichiers. Si un changement est nécessaire ailleurs, ouvrir une Issue et obtenir l’accord du propriétaire.
2. Communiquer entre modules via l’API, pas par imports directs du code d’un autre module.
3. Aucun commit direct sur `main`. Utiliser `feat/<module>-<prenom>` et une Pull Request.
4. Seul Traoré fusionne les PR ; ses propres PR sont relues par un autre membre.
5. Aucune dépendance nouvelle sans accord de Traoré.
6. `npm run api` reconstruit `db.json` et réinitialise les données ; `npm run api:garder` relance l’API sans cette reconstruction.
7. Cycle des commandes : `en_attente → en_preparation → prete → servie → payee`; l’annulation est possible avant `payee`.
