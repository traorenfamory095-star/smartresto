// Routes publiques : habillées avec la navigation du site (layout "public")
export const ROUTES_PUBLIQUES = ['/carte', '/a-propos', '/speciaux', '/contact', '/reserver']
// Routes plein écran, sans aucun habillage (layout "vierge")
export const ROUTES_SANS_HABILLAGE = ['/connexion']

export const LIENS_PUBLICS = [
  { href: '/', libelle: 'Accueil' },
  { href: '/carte', libelle: 'Carte' },
  { href: '/a-propos', libelle: 'À propos' },
  { href: '/speciaux', libelle: 'Spéciaux' },
  { href: '/contact', libelle: 'Contact' },
]

// `nom` : valeur passée à peut(...). null = toujours visible.
export const LIENS_MENU_ADMIN = [
  { nom: null, href: '/tableau-de-bord', libelle: 'Tableau de bord', icone: 'home' },
  { nom: 'plats', href: '/plats', libelle: 'Plats', icone: 'dish' },
  { nom: 'categories', href: '/categories', libelle: 'Catégories', icone: 'category' },
  { nom: 'tables', href: '/tables', libelle: 'Tables', icone: 'table' },
  { nom: 'reservations', href: '/reservations', libelle: 'Réservations', icone: 'calendar' },
  { nom: 'commandes', href: '/commandes', libelle: 'Commandes', icone: 'order' },
  { nom: 'cuisine', href: '/cuisine', libelle: 'Cuisine', icone: 'chef' },
  { nom: 'stock', href: '/stock', libelle: 'Stock', icone: 'stock' },
  { nom: 'fournisseurs', href: '/fournisseurs', libelle: 'Fournisseurs', icone: 'truck' },
  { nom: 'approvisionnements', href: '/approvisionnements', libelle: 'Approvisionnements', icone: 'supply' },
  { nom: 'factures', href: '/factures', libelle: 'Factures', icone: 'invoice' },
  { nom: 'rapports', href: '/rapports', libelle: 'Rapports', icone: 'chart' },
  { nom: 'personnel', href: '/personnel', libelle: 'Personnel', icone: 'users' },
]

export const TITRES_PAGES = {
  '/': ['Tableau de bord', 'Une vue claire sur votre restaurant.'],
  '/tableau-de-bord': ['Tableau de bord', 'Une vue claire sur votre restaurant.'],
  '/plats': ['Plats', 'Gérez les plats proposés à la carte.'],
  '/categories': ['Catégories', "Organisez votre carte et son ordre d'affichage."],
  '/tables': ['Tables', "Visualisez l'occupation de votre salle."],
  '/reservations': ['Réservations', 'Planifiez les arrivées de vos clients.'],
  '/commandes': ['Commandes', 'Suivez et créez les commandes en cours.'],
  '/cuisine': ['Cuisine', 'Pilotez le service en temps réel.'],
  '/stock': ['Stock', 'Gardez un œil sur vos ingrédients.'],
  '/fournisseurs': ['Fournisseurs', 'Centralisez vos partenaires et coordonnées.'],
  '/approvisionnements': ['Approvisionnements', 'Suivez vos commandes fournisseurs.'],
  '/factures': ['Factures', 'Gérez les règlements et soldes.'],
  '/rapports': ['Rapports', 'Comprenez la performance du restaurant.'],
  '/personnel': ['Personnel', 'Gérez les membres de votre équipe.'],
}

const LIBELLES_ROLES = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  serveur: 'Serveur',
  cuisinier: 'Cuisinier',
  caissier: 'Caissier',
}

function normaliserChemin(chemin = '/') {
  const sansRequete = String(chemin).split(/[?#]/)[0] || '/'
  if (sansRequete.length === 1) return sansRequete
  return sansRequete.replace(/\/+$/, '') || '/'
}

function correspond(chemin, base) {
  return chemin === base || chemin.startsWith(base + '/')
}

export function choisirLayout(chemin) {
  const propre = normaliserChemin(chemin)
  if (ROUTES_SANS_HABILLAGE.some((base) => correspond(propre, base))) return 'vierge'
  if (ROUTES_PUBLIQUES.some((base) => correspond(propre, base))) return 'public'
  return 'default'
}

export function lienActif(chemin, href) {
  const propre = normaliserChemin(chemin)
  if (href === '/') return propre === '/'
  return correspond(propre, href)
}

export function titreDeRoute(chemin) {
  const propre = normaliserChemin(chemin)
  let meilleur = null
  for (const base of Object.keys(TITRES_PAGES)) {
    if (base === '/') continue
    if (correspond(propre, base) && (!meilleur || base.length > meilleur.length)) meilleur = base
  }
  return TITRES_PAGES[meilleur ?? '/']
}

export function initiales(nom) {
  const mots = String(nom ?? '').trim().split(/\s+/).filter(Boolean)
  if (!mots.length) return '?'
  return mots.slice(0, 2).map((mot) => mot[0].toUpperCase()).join('')
}

export function libelleRole(role) {
  if (!role) return 'Invité'
  return LIBELLES_ROLES[role] ?? role
}