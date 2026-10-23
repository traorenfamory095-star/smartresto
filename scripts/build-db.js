// Fusionne tous les fichiers de db/ en un seul db.json que JSON Server peut servir.
// db.json n'est PAS versionné (voir .gitignore) : c'est votre état local de travail.
// Les données de départ partagées vivent dans db/<ressource>.json (chaque fichier a un propriétaire).
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dossier = path.join(__dirname, '..', 'db');
const sortie = path.join(__dirname, '..', 'db.json');
const base = {};

const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith('.json')).sort();
for (const fichier of fichiers) {
  const nom = path.basename(fichier, '.json');
  try {
    base[nom] = JSON.parse(fs.readFileSync(path.join(dossier, fichier), 'utf8'));
  } catch (erreur) {
    console.error(`JSON invalide dans db/${fichier} : ${erreur.message}`);
    process.exit(1);
  }
}

fs.writeFileSync(sortie, JSON.stringify(base, null, 2));
console.log(`db.json reconstruit à partir de ${fichiers.length} fichiers : ${Object.keys(base).join(', ')}`);
