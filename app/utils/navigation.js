// SOURCE UNIQUE de tous les liens du site. Propriétaire : Traoré (socle).
//
// - layouts/default.vue lit MENU_ADMIN pour la barre latérale (filtrée par useAuth().peut).
// - layouts/public.vue lit MENU_PUBLIC pour la barre du haut.
// - Le middleware de Gaël lit ROUTES_PUBLIQUES (voir estRoutePublique).
// Personne n'a donc jamais besoin de modifier un layout pour ajouter un lien :
// on ajoute une ligne ici (Issue à Traoré).

// Pages accessibles sans être connecté.
export const ROUTES_PUBLIQUES = [
  '/',
  '/carte',
  '/a-propos',
  '/speciaux',
  '/contact',
  '/reserver',
  '/connexion',
]

export const MENU_PUBLIC = [
  { chemin: '/', libelle: 'Accueil' },
  { chemin: '/carte', libelle: 'Carte' },
  { chemin: '/a-propos', libelle: 'À propos' },
  { chemin: '/speciaux', libelle: 'Spéciaux' },
  { chemin: '/contact', libelle: 'Contact' },
]

// `icone` : nom d'une icône de <UiIcone>. `description` : texte du tableau de bord.
export const MENU_ADMIN = [
  { chemin: '/tableau-de-bord', libelle: 'Tableau de bord', icone: 'tableau', description: "Vue d'ensemble et raccourcis." },
  { chemin: '/carte', libelle: 'Voir la carte', icone: 'carte', description: 'La carte telle que la voit un client.' },
  { chemin: '/plats', libelle: 'Plats', icone: 'plats', description: 'Créer, modifier et retirer les plats.' },
  { chemin: '/categories', libelle: 'Catégories', icone: 'categories', description: 'Organiser le menu en catégories.' },
  { chemin: '/tables', libelle: 'Tables', icone: 'tables', description: 'Plan de salle et état des tables.' },
  { chemin: '/reservations', libelle: 'Réservations', icone: 'reservations', description: 'Réservations des clients.' },
  { chemin: '/commandes', libelle: 'Commandes', icone: 'commandes', description: 'Prendre et suivre les commandes.' },
  { chemin: '/cuisine', libelle: 'Cuisine', icone: 'cuisine', description: 'Tickets à préparer en cuisine.' },
  { chemin: '/stock', libelle: 'Stock', icone: 'stock', description: 'Ingrédients, seuils et mouvements.' },
  { chemin: '/fournisseurs', libelle: 'Fournisseurs', icone: 'fournisseurs', description: 'Coordonnées et ingrédients fournis.' },
  { chemin: '/approvisionnements', libelle: 'Approvisionnements', icone: 'approvisionnements', description: "Commandes d'achat et réceptions." },
  { chemin: '/factures', libelle: 'Factures', icone: 'factures', description: 'Facturation et paiements.' },
  { chemin: '/rapports', libelle: 'Rapports', icone: 'rapports', description: 'Chiffre d’affaires et statistiques.' },
  { chemin: '/personnel', libelle: 'Personnel', icone: 'personnel', description: "L'équipe et ses rôles." },
]

// Retire la barre finale et la requête : "/plats/?a=1" -> "/plats".
function normaliser(chemin) {
  return (chemin ?? '').split('?')[0].replace(/\/+$/, '') || '/'
}

// Vrai si la page est ouverte à tout le monde (correspondance exacte).
export function estRoutePublique(chemin) {
  return ROUTES_PUBLIQUES.includes(normaliser(chemin))
}

// Trouve le lien admin d'une page, y compris pour les sous-pages :
// "/plats/nouveau" et "/plats/3" donnent le lien "/plats".
export function trouverLien(chemin) {
  const cible = normaliser(chemin)
  let trouve
  for (const lien of MENU_ADMIN) {
    const correspond = cible === lien.chemin || cible.startsWith(`${lien.chemin}/`)
    if (correspond && (!trouve || lien.chemin.length > trouve.chemin.length)) trouve = lien
  }
  return trouve
}
