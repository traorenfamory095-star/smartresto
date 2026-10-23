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