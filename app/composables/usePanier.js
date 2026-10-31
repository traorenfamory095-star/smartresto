// Panier de la prise de commande. Propriétaire : Traoré.
// Les fonctions pures (sans Nuxt) servent à la fois au composable et aux tests : tests/commandes/panier.test.js.
import { calculerTotal, estOuverte } from './useCommandes.js'

export const QUANTITE_MAX = 20

// Une ligne du panier : { platId, nom, prixUnitaire, quantite, remarque }
// prixUnitaire est COPIÉ depuis le plat au moment de l'ajout : si Tresor change le prix
// plus tard, une commande déjà prise garde le prix annoncé au client.
export function ajouterAuPanier(lignes, plat) {
  const existante = lignes.find((l) => l.platId === plat.id)
  if (existante) return changerQuantite(lignes, plat.id, existante.quantite + 1)
  return [...lignes, { platId: plat.id, nom: plat.nom, prixUnitaire: plat.prix, quantite: 1, remarque: '' }]
}

// Une quantité de 0 (ou moins) retire la ligne ; au-delà de QUANTITE_MAX on s'arrête.
export function changerQuantite(lignes, platId, quantite) {
  const q = Math.min(Math.floor(Number(quantite)) || 0, QUANTITE_MAX)
  if (q <= 0) return retirerDuPanier(lignes, platId)
  return lignes.map((l) => (l.platId === platId ? { ...l, quantite: q } : l))
}

export const retirerDuPanier = (lignes, platId) => lignes.filter((l) => l.platId !== platId)

export const changerRemarque = (lignes, platId, remarque) =>
  lignes.map((l) => (l.platId === platId ? { ...l, remarque: String(remarque).slice(0, 120) } : l))

export const nombreArticles = (lignes) => lignes.reduce((s, l) => s + l.quantite, 0)

// Les tables qui portent une commande ni payée ni annulée : on ne peut pas y en ouvrir une seconde.
export const tablesOccupees = (commandes) => new Set(commandes.filter(estOuverte).map((c) => c.tableId))

// Ce qui empêche de valider la commande (liste vide = on peut valider).
export function problemesCommande({ tableId, lignes, nbCouverts }, occupees = new Set()) {
  const problemes = []
  if (!tableId) problemes.push('Choisissez une table.')
  else if (occupees.has(Number(tableId))) problemes.push('Cette table a déjà une commande en cours.')
  if (!lignes.length) problemes.push('Ajoutez au moins un plat.')
  if (!(Number(nbCouverts) >= 1)) problemes.push('Indiquez le nombre de couverts.')
  return problemes
}

// État partagé : le panier survit quand on change de page (useState), et il est vidé après une commande.
export function usePanier() {
  const lignes = useState('panier-lignes', () => [])
  const tableId = useState('panier-table', () => '')
  const nbCouverts = useState('panier-couverts', () => 2)
  const note = useState('panier-note', () => '')

  return {
    lignes,
    tableId,
    nbCouverts,
    note,
    total: computed(() => calculerTotal(lignes.value)),
    nbArticles: computed(() => nombreArticles(lignes.value)),
    ajouter: (plat) => { lignes.value = ajouterAuPanier(lignes.value, plat) },
    changerQuantite: (platId, q) => { lignes.value = changerQuantite(lignes.value, platId, q) },
    retirer: (platId) => { lignes.value = retirerDuPanier(lignes.value, platId) },
    changerRemarque: (platId, r) => { lignes.value = changerRemarque(lignes.value, platId, r) },
    vider: () => {
      lignes.value = []
      tableId.value = ''
      nbCouverts.value = 2
      note.value = ''
    },
  }
}