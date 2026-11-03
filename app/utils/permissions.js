// Règles d'accès par rôle, en fonctions pures (testables sans Nuxt).
// Propriétaire : Gaël (module Personnel et rôles). Utilisé par useAuth() et le middleware auth.global.js.

// Pages ouvertes à tous, connecté ou non : le site public et la page de connexion.
export const ROUTES_LIBRES = ['/', '/carte', '/a-propos', '/speciaux', '/contact', '/reserver', '/connexion']

// Rôles qui ont accès à tout.
const ROLES_COMPLETS = ['admin', 'gerant']

// Modules ouverts à chaque rôle (fiche 7). Une sous-page suit le droit de son module.
const MODULES_PAR_ROLE = {
  serveur: ['/tableau-de-bord', '/commandes', '/carte', '/tables', '/reservations'],
  cuisinier: ['/tableau-de-bord', '/cuisine', '/carte'],
  caissier: ['/tableau-de-bord', '/factures', '/commandes'],
}

// Pages d'écriture interdites à un rôle qui n'a que la lecture d'un module.
// Le caissier lit les commandes (/commandes, /commandes/12) mais n'en crée pas.
const PAGES_INTERDITES = {
  caissier: ['/commandes/nouvelle'],
}

// Accepte '/plats', 'plats', '/plats/3/', '/plats?x=1' et renvoie '/plats', '/plats/3'...
export function normaliserChemin(chemin) {
  let propre = String(chemin ?? '').trim().split(/[?#]/)[0]
  if (!propre.startsWith('/')) propre = `/${propre}`
  propre = propre.replace(/\/+$/, '')
  return propre || '/'
}

function correspond(chemin, base) {
  return chemin === base || chemin.startsWith(`${base}/`)
}

export function estRouteLibre(chemin) {
  return ROUTES_LIBRES.includes(normaliserChemin(chemin))
}

// Le rôle `role` peut-il ouvrir la page `chemin` ?
export function rolePeut(role, chemin) {
  const cible = normaliserChemin(chemin)
  if (estRouteLibre(cible)) return true
  if (ROLES_COMPLETS.includes(role)) return true

  const modules = MODULES_PAR_ROLE[role]
  if (!modules) return false
  if ((PAGES_INTERDITES[role] ?? []).some((page) => correspond(cible, page))) return false
  return modules.some((base) => correspond(cible, base))
}

// N'accepte qu'un chemin interne ("/plats/3"), jamais une adresse externe ("//site.com", "https://...").
export function redirectionSure(valeur, parDefaut = '/tableau-de-bord') {
  const texte = Array.isArray(valeur) ? valeur[0] : valeur
  if (typeof texte !== 'string' || !texte.startsWith('/') || texte.startsWith('//')) return parDefaut
  if (normaliserChemin(texte) === '/connexion') return parDefaut
  return texte
}
