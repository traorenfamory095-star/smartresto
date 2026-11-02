// Initialisation des données fictives de départ
globalThis.mockCategories = globalThis.mockCategories || [
  { id: '1', nom: 'Entrées' },
  { id: '2', nom: 'Plats Résistants' },
  { id: '3', nom: 'Desserts' },
  { id: '4', nom: 'Boissons' }
]

globalThis.mockPlats = globalThis.mockPlats || [
  {
    id: '101',
    nom: 'Salade César',
    categorieId: '1',
    description: 'Poulet croustillant, salade romaine, parmesan et sauce césar maison.',
    prix: 14.50,
    tempsPreparation: 10,
    disponible: true
  },
  {
    id: '102',
    nom: 'Filet de Capitaine aux épices',
    categorieId: '2',
    description: 'Poisson local braisé, accompagné d\'alloco ou de chikwangue.',
    prix: 22.00,
    tempsPreparation: 25,
    disponible: true
  },
  {
    id: '103',
    nom: 'Moelleux au Chocolat',
    categorieId: '3',
    description: 'Cœur coulant, servi avec une boule de glace vanille.',
    prix: 8.00,
    tempsPreparation: 12,
    disponible: false
  }
]

// Simulation d'une table de lignes de commande actives
// Le plat 102 est volontairement bloqué ici pour tester la règle métier
globalThis.mockLignesCommande = globalThis.mockLignesCommande || [
  { id: '501', commandeId: '2001', platId: '102', quantite: 2 }
]

export const getDb = () => {
  return {
    categories: globalThis.mockCategories,
    plats: globalThis.mockPlats,
    lignesCommande: globalThis.mockLignesCommande
  }
}