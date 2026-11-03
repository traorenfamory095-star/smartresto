// Vérifie que les références entre ressources sont valides (clés étrangères).
// À lancer avant chaque Pull Request qui touche à db/ :  npm run db:check
// Version module ES, cohérente avec scripts/build-db.js (le projet Nuxt est en "type": "module").
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dossier = path.join(__dirname, '..', 'db');

const lire = (nom) => {
  const fichier = path.join(dossier, `${nom}.json`);
  if (!fs.existsSync(fichier)) {
    console.error(`Fichier manquant : db/${nom}.json`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(fichier, 'utf8'));
  } catch (erreur) {
    console.error(`JSON invalide dans db/${nom}.json : ${erreur.message}`);
    process.exit(1);
  }
};

const cache = new Map();
const ids = (nom) => {
  if (!cache.has(nom)) cache.set(nom, new Set(lire(nom).map((x) => x.id)));
  return cache.get(nom);
};

// [ressource, champ, ressource cible]
const regles = [
  ['plats', 'categorieId', 'categories'],
  ['reservations', 'tableId', 'tables'],
  ['commandes', 'tableId', 'tables'],
  ['commandes', 'serveurId', 'employes'],
  ['lignesCommande', 'commandeId', 'commandes'],
  ['lignesCommande', 'platId', 'plats'],
  ['ingredients', 'fournisseurId', 'fournisseurs'],
  ['mouvementsStock', 'ingredientId', 'ingredients'],
  ['approvisionnements', 'fournisseurId', 'fournisseurs'],
  ['factures', 'commandeId', 'commandes'],
  ['paiements', 'factureId', 'factures'],
];

let erreurs = 0;
for (const [source, champ, cible] of regles) {
  const valides = ids(cible);
  for (const ligne of lire(source)) {
    if (!valides.has(ligne[champ])) {
      console.error(`ERREUR  ${source} #${ligne.id} : ${champ} = ${ligne[champ]} n'existe pas dans ${cible}`);
      erreurs++;
    }
  }
}

// Les lignes d'un approvisionnement sont imbriquées : on vérifie aussi leur ingredientId.
const ingredientsValides = ids('ingredients');
for (const appro of lire('approvisionnements')) {
  for (const [index, ligne] of (appro.lignes ?? []).entries()) {
    if (!ingredientsValides.has(ligne.ingredientId)) {
      console.error(`ERREUR  approvisionnements #${appro.id} ligne ${index + 1} : ingredientId = ${ligne.ingredientId} n'existe pas dans ingredients`);
      erreurs++;
    }
  }
}

if (erreurs) {
  console.error(`\n${erreurs} référence(s) invalide(s).`);
  process.exit(1);
}
console.log('Toutes les références entre ressources sont valides.');