// Logique du module Commandes. Propriétaire : Traoré.
// Les fonctions pures (sans Nuxt) sont exportées pour être testées : tests/commandes/.

// --- Argent : on calcule en centimes (entiers) pour éviter 0.1 + 0.2 = 0.30000000000000004 ---
export const enCentimes = (montant) => Math.round(Number(montant) * 100) || 0

// calculerTotal([{ quantite: 2, prixUnitaire: 4.5 }, ...]) -> 9 (en dollars, exact au centime)
export function calculerTotal(lignes = []) {
  const centimes = lignes.reduce(
    (somme, l) => somme + enCentimes(l.prixUnitaire) * (Number(l.quantite) || 0),
    0,
  )
  return centimes / 100
}

// Une commande est « ouverte » tant qu'elle n'est ni payée ni annulée (la table est alors occupée).
export const estOuverte = (commande) => !['payee', 'annulee'].includes(commande.statut)

// Assemble commandes + lignes + tables + serveurs en UN passage (4 requêtes au total,
// pas une requête par commande).
export function assemblerCommandes({ commandes = [], lignes = [], tables = [], employes = [] }) {
  const lignesParCommande = new Map()
  for (const l of lignes) {
    if (!lignesParCommande.has(l.commandeId)) lignesParCommande.set(l.commandeId, [])
    lignesParCommande.get(l.commandeId).push(l)
  }
  const tableParId = new Map(tables.map((t) => [t.id, t]))
  const employeParId = new Map(employes.map((e) => [e.id, e]))

  return commandes.map((c) => {
    const lignesDeLaCommande = lignesParCommande.get(c.id) ?? []
    return {
      ...c,
      table: tableParId.get(c.tableId) ?? null,
      serveur: employeParId.get(c.serveurId) ?? null,
      lignes: lignesDeLaCommande,
      nbArticles: lignesDeLaCommande.reduce((s, l) => s + (Number(l.quantite) || 0), 0),
      total: calculerTotal(lignesDeLaCommande),
    }
  })
}

const sansAccent = (texte) =>
  String(texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// filtrerCommandes(liste, { statut, tableId, date: '2026-10-21', recherche })
// Les filtres se combinent ; un filtre vide ('' ou null) est ignoré. Plus récentes d'abord.
export function filtrerCommandes(liste, { statut = '', tableId = '', date = '', recherche = '' } = {}) {
  const mot = sansAccent(recherche).trim()
  return liste
    .filter((c) => !statut || c.statut === statut)
    .filter((c) => !tableId || c.tableId === Number(tableId))
    .filter((c) => !date || String(c.creeLe).startsWith(date))
    .filter((c) => {
      if (!mot) return true
      const texte = sansAccent(
        [`#${c.id}`, c.id, `table ${c.table?.numero ?? ''}`, c.serveur?.nom, c.note].join(' '),
      )
      return texte.includes(mot)
    })
    .sort((a, b) => String(b.creeLe).localeCompare(String(a.creeLe)))
}

// Total du service affiché sous la liste : les commandes annulées ne comptent pas.
export const totalDuService = (liste) =>
  calculerTotal(liste.filter((c) => c.statut !== 'annulee').map((c) => ({ quantite: 1, prixUnitaire: c.total })))

// Ce qu'on a le droit de faire sur une commande (CONTRIBUTING.md, section 3).
// Traoré écrit `servie` et `annulee` ; une commande payée ne s'annule jamais.
export function actionsDisponibles(statut) {
  return {
    peutServir: statut === 'prete',
    peutAnnuler: !['payee', 'annulee'].includes(statut),
    modifiable: statut === 'en_attente',
  }
}

// Assemble le détail : chaque ligne reçoit son plat et son total de ligne.
export function assemblerDetail({ commande, lignes = [], plats = [], table = null, serveur = null }) {
  const platParId = new Map(plats.map((p) => [p.id, p]))
  const lignesDetaillees = lignes.map((l) => ({
    ...l,
    plat: platParId.get(l.platId) ?? null,
    total: calculerTotal([l]),
  }))
  return { ...commande, table, serveur, lignes: lignesDetaillees, total: calculerTotal(lignes) }
}

// Composable : chargements et actions du module. À appeler au niveau du setup.
export function useCommandes() {
  const { lire, modifier } = useApi()

  // Liste : 4 requêtes en parallèle, quel que soit le nombre de commandes.
  async function chargerListe() {
    const [commandes, lignes, tables, employes] = await Promise.all([
      lire('/commandes'),
      lire('/lignesCommande'),
      lire('/tables'),
      lire('/employes'),
    ])
    return assemblerCommandes({ commandes, lignes, tables, employes })
  }

  // Détail : la commande d'abord (404 si elle n'existe pas), puis le reste en parallèle.
  async function chargerDetail(id) {
    const commande = await lire(`/commandes/${id}`)
    const [lignes, plats, table, serveur] = await Promise.all([
      lire('/lignesCommande', { commandeId: id }),
      lire('/plats'),
      lire(`/tables/${commande.tableId}`).catch(() => null),
      lire(`/employes/${commande.serveurId}`).catch(() => null),
    ])
    return assemblerDetail({ commande, lignes, plats, table, serveur })
  }

  // On relit l'état réel avant d'écrire : pas de transition sur une donnée périmée.
  async function changerStatut(id, nouveauStatut) {
    const actuelle = await lire(`/commandes/${id}`)
    if (!transitionCommandeValide(actuelle.statut, nouveauStatut)) {
      throw new Error(
        `Impossible de passer cette commande de « ${infoStatut('commande', actuelle.statut).libelle} » à « ${infoStatut('commande', nouveauStatut).libelle} ».`,
      )
    }
    return modifier(`/commandes/${id}`, { statut: nouveauStatut })
  }

  return {
    chargerListe,
    chargerDetail,
    marquerServie: (id) => changerStatut(id, 'servie'),
    annuler: (id) => changerStatut(id, 'annulee'),
  }
}