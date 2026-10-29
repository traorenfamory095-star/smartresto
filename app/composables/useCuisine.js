const STATUTS_TICKETS = ['en_attente', 'en_preparation', 'prete']

const TRANSITIONS_LIGNE = {
  en_attente: 'en_preparation',
  en_preparation: 'prete',
}

function identifiantValide(valeur) {
  const id = Number(valeur)
  return Number.isSafeInteger(id) && id > 0
}

export function transitionLigneCuisineValide(de, vers) {
  return Object.hasOwn(TRANSITIONS_LIGNE, de) && TRANSITIONS_LIGNE[de] === vers
}

export function toutesLignesCuisinePretes(lignes = []) {
  return Array.isArray(lignes) && lignes.length > 0 && lignes.every((ligne) => ligne.statutCuisine === 'prete')
}

export function assemblerTicketsCuisine({ commandes = [], lignes = [], plats = [], tables = [] } = {}) {
  const commandesValides = Array.isArray(commandes) ? commandes : []
  const lignesValides = Array.isArray(lignes) ? lignes : []
  const platsValides = Array.isArray(plats) ? plats : []
  const tablesValides = Array.isArray(tables) ? tables : []
  const lignesParCommande = new Map()
  const platsParId = new Map(platsValides.map((plat) => [String(plat.id), plat]))
  const tablesParId = new Map(tablesValides.map((table) => [String(table.id), table]))

  for (const ligne of lignesValides) {
    const cle = String(ligne.commandeId)
    if (!lignesParCommande.has(cle)) lignesParCommande.set(cle, [])
    lignesParCommande.get(cle).push({
      ...ligne,
      plat: platsParId.get(String(ligne.platId)) ?? null,
    })
  }

  return commandesValides
    .filter((commande) => STATUTS_TICKETS.includes(commande.statut))
    .map((commande) => {
      const lignesDuTicket = lignesParCommande.get(String(commande.id)) ?? []
      return {
        ...commande,
        table: tablesParId.get(String(commande.tableId)) ?? null,
        lignes: lignesDuTicket,
        lignesPretes: lignesDuTicket.filter((ligne) => ligne.statutCuisine === 'prete').length,
      }
    })
    .sort((a, b) => String(a.creeLe ?? '').localeCompare(String(b.creeLe ?? '')))
}

export function useCuisine() {
  const { lire, modifier } = useApi()

  async function chargerTickets() {
    const [commandes, lignes, plats, tables] = await Promise.all([
      lire('/commandes'),
      lire('/lignesCommande'),
      lire('/plats'),
      lire('/tables'),
    ])

    if (![commandes, lignes, plats, tables].every(Array.isArray)) {
      throw new Error('Les données reçues pour les tickets sont invalides.')
    }

    return assemblerTicketsCuisine({ commandes, lignes, plats, tables })
  }

  async function changerStatutLigne(id, nouveauStatut) {
    if (!identifiantValide(id)) throw new Error('Identifiant de ligne invalide.')
    if (!['en_preparation', 'prete'].includes(nouveauStatut)) {
      throw new Error('Ce statut de préparation n’est pas autorisé.')
    }

    const ligne = await lire(`/lignesCommande/${Number(id)}`)
    if (!identifiantValide(ligne.commandeId)) {
      throw new Error('Cette ligne ne référence pas une commande valide.')
    }
    const commande = await lire(`/commandes/${Number(ligne.commandeId)}`)
    if (commande.statut !== 'en_preparation') {
      throw new Error('Démarrez la préparation de la commande avant de modifier ses lignes.')
    }

    if (!transitionLigneCuisineValide(ligne.statutCuisine, nouveauStatut)) {
      throw new Error('Cette ligne a déjà changé d’état ou la transition demandée est invalide.')
    }

    return modifier(`/lignesCommande/${Number(id)}`, { statutCuisine: nouveauStatut })
  }

  async function changerStatutCommande(id, nouveauStatut) {
    if (!identifiantValide(id)) throw new Error('Identifiant de commande invalide.')
    if (!['en_preparation', 'prete'].includes(nouveauStatut)) {
      throw new Error('Ce statut de commande n’est pas autorisé depuis la Cuisine.')
    }

    const commande = await lire(`/commandes/${Number(id)}`)
    const transitionAutorisee =
      (commande.statut === 'en_attente' && nouveauStatut === 'en_preparation') ||
      (commande.statut === 'en_preparation' && nouveauStatut === 'prete')

    if (!transitionAutorisee) {
      throw new Error('Cette commande a déjà changé d’état ou la transition demandée est invalide.')
    }

    if (nouveauStatut === 'prete') {
      const lignes = await lire('/lignesCommande', { commandeId: Number(id) })
      if (!toutesLignesCuisinePretes(lignes)) {
        throw new Error('Toutes les lignes doivent être prêtes avant de terminer le ticket.')
      }
    }

    return modifier(`/commandes/${Number(id)}`, { statut: nouveauStatut })
  }

  return { chargerTickets, changerStatutLigne, changerStatutCommande }
}
