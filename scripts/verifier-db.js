// Vérifie que les références entre ressources sont valides (clés étrangères).
// À lancer avant chaque Pull Request qui touche à db/ :  npm run db:check
const fs = require('fs');
const path = require('path');

const dossier = path.join(__dirname, '..', 'db');
const lire = (nom) => JSON.parse(fs.readFileSync(path.join(dossier, `${nom}.json`), 'utf8'));
const ids = (nom) => new Set(lire(nom).map((x) => x.id));

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

if (erreurs) {
  console.error(`\n${erreurs} référence(s) invalide(s).`);
  process.exit(1);
}
console.log('Toutes les références entre ressources sont valides.');
