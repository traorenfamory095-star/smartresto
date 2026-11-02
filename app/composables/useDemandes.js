// Demandes de commande faites par les clients sur le site public. Propriétaire : Traoré.
//
// Le client ne crée JAMAIS une vraie commande (il n'a ni table ni serveur) : il envoie une
// « demande ». Un membre du personnel la prend en charge, choisit la table, et elle devient
// une vraie commande (voir prendreEnChargeDemande).
//
// Forme d'une demande (db/demandes.json) :
//   { id, nomClient, telephone, nbCouverts, note, creeLe, statut, lignes: [{ platId, quantite, prixUnitaire, remarque }] }
//   statut : 'en_attente' -> 'traitee' (avec commandeId) ou 'refusee'
//
// Les fonctions pures reçoivent `api` = { lire, creer, modifier } pour être testées sans réseau.
import { creerCommandeAvecLignes, estOuverte, maintenantLocal } from './useCommandes.js'

// --- Validation côté client (le serveur JSON n'en fait aucune) ---
export function problemesDemande({ nomClient = '', telephone = '', nbCouverts = 1, lignes = [] } = {}) {
  const problemes = []
  if (String(nomClient).trim().length < 2) problemes.push('Indiquez votre nom.')
  const chiffres = String(telephone).replace(/\D/g, '')
  if (chiffres.length < 8 || chiffres.length > 15) problemes.push('Indiquez un numéro de téléphone valide.')
  if (!(Number(nbCouverts) >= 1)) problemes.push('Indiquez le nombre de personnes.')
  if (!lignes.length) problemes.push('Ajoutez au moins un plat.')
  return problemes
}

export function construireDemande(saisie, maintenant = maintenantLocal()) {
  return {
    nomClient: String(saisie.nomClient).trim(),
    telephone: String(saisie.telephone).trim(),
    nbCouverts: Number(saisie.nbCouverts),
    note: String(saisie.note ?? '').trim().slice(0, 200),
    creeLe: maintenant,
    statut: 'en_attente',
    lignes: saisie.lignes.map((l) => ({
      platId: l.platId,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      remarque: l.remarque ?? '',
    })),
  }
}

// Côté client : enregistre la demande.
export async function envoyerDemande(api, saisie) {
  const problemes = problemesDemande(saisie)
  if (problemes.length) throw new Error(problemes[0])
  return api.creer('/demandes', construireDemande(saisie))
}

// Côté personnel : transforme une demande en vraie commande.
//
// Deux écritures liées (la commande, puis le statut de la demande). Ordre choisi : la commande
// d'abord. Si la 2e échoue, on a une commande en trop (visible, on le dit à l'utilisateur) ;
// dans l'autre ordre on aurait pu PERDRE la demande d'un client sans commande.
export async function prendreEnChargeDemande(api, demande, { tableId, serveurId }) {
  // 1. L'état réel : un collègue a pu la traiter entre-temps (ou double clic).
  const actuelle = await api.lire(`/demandes/${demande.id}`)
  if (actuelle.statut !== 'en_attente') throw new Error('Cette demande a déjà été traitée.')

  // 2. Les plats demandés sont-ils encore servis ?
  const plats = await api.lire('/plats')
  for (const ligne of actuelle.lignes) {
    const plat = plats.find((p) => p.id === ligne.platId)
    if (!plat || !plat.disponible) {
      throw new Error(
        `« ${plat?.nom ?? 'Un plat'} » n'est plus disponible : refusez la demande ou rappelez le client.`,
      )
    }
  }

  // 3. La vraie commande (avec la protection contre les commandes incomplètes, et le contrôle de la table).
  const commande = await creerCommandeAvecLignes(api, {
    tableId,
    serveurId,
    nbCouverts: actuelle.nbCouverts,
    note: `En ligne : ${actuelle.nomClient} (${actuelle.telephone})${actuelle.note ? ` — ${actuelle.note}` : ''}`,
    lignes: actuelle.lignes,
  })

  // 4. La demande est marquée traitée et liée à la commande.
  try {
    await api.modifier(`/demandes/${demande.id}`, { statut: 'traitee', commandeId: commande.id })
  } catch (cause) {
    const erreur = new Error(
      `La commande n°${commande.id} est créée, mais la demande n'a pas pu être marquée « traitée » : ne la reprenez pas.`,
    )
    erreur.cause = cause
    erreur.commandeId = commande.id
    throw erreur
  }
  return commande
}

export async function refuserDemande(api, id) {
  const actuelle = await api.lire(`/demandes/${id}`)
  if (actuelle.statut !== 'en_attente') throw new Error('Cette demande a déjà été traitée.')
  return api.modifier(`/demandes/${id}`, { statut: 'refusee' })
}

// Tables libres, pour le choix de l'admin (même règle que la prise de commande).
export const tablesLibres = (tables, commandes) => {
  const occupees = new Set(commandes.filter(estOuverte).map((c) => c.tableId))
  return tables.filter((t) => t.actif && !occupees.has(t.id))
}

export function useDemandes() {
  const { lire, creer, modifier, supprimer } = useApi()
  const api = { lire, creer, modifier, supprimer }
  return {
    // Les plus anciennes d'abord : on sert dans l'ordre d'arrivée.
    lister: () => lire('/demandes', { statut: 'en_attente', _sort: 'creeLe', _order: 'asc' }),
    envoyer: (saisie) => envoyerDemande(api, saisie),
    prendreEnCharge: (demande, options) => prendreEnChargeDemande(api, demande, options),
    refuser: (id) => refuserDemande(api, id),
  }
}