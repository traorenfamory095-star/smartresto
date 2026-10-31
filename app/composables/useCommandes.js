// Logique du module Commandes. Propriétaire : Traoré.
// Les fonctions pures (sans Nuxt) sont exportées pour être testées : tests/commandes/.
import { infoStatut, transitionCommandeValide } from '../utils/statuts.js'

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
  return {
    ...commande,
    table,
    serveur,
    lignes: lignesDetaillees,
    total: calculerTotal(lignes),
    catalogue: plats.filter((p) => p.disponible), // pour « Ajouter un plat »
  }
}

// Date et heure LOCALES au format des données ("2026-10-21T12:05:00"), sans fuseau.
export function maintenantLocal(date = new Date()) {
  const deux = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}:${deux(date.getSeconds())}`
}

// Crée une commande ET ses lignes, ou rien du tout.
//
// Le piège : l'API n'a pas de transaction. Il faut une requête pour la commande, puis une par ligne.
// Si l'une des lignes échoue, on supprime les lignes déjà créées puis la commande, pour ne laisser
// aucune commande incomplète (« orpheline ») que la cuisine verrait sans savoir quoi préparer.
//
// `api` = { lire, creer, supprimer } (celles de useApi) : on les injecte pour tester sans réseau.
export async function creerCommandeAvecLignes(api, { tableId, serveurId, nbCouverts, note = '', lignes }) {
  if (!lignes?.length) throw new Error('Ajoutez au moins un plat.')

  // 1. On relit l'état réel de la table : un collègue a pu ouvrir une commande entre-temps.
  const existantes = await api.lire('/commandes', { tableId })
  if (existantes.some(estOuverte)) throw new Error('Cette table a déjà une commande en cours.')

  let commande = null
  const lignesCreees = []
  try {
    // 2. La commande d'abord (on a besoin de son id pour les lignes).
    commande = await api.creer('/commandes', {
      tableId: Number(tableId),
      serveurId,
      statut: 'en_attente',
      creeLe: maintenantLocal(),
      nbCouverts: Number(nbCouverts),
      note,
    })

    // 3. Les lignes en parallèle. allSettled attend TOUTES les réponses : même si l'une échoue,
    //    on sait exactement lesquelles ont été créées, donc lesquelles défaire.
    const resultats = await Promise.allSettled(
      lignes.map((l) =>
        api.creer('/lignesCommande', {
          commandeId: commande.id,
          platId: l.platId,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          statutCuisine: 'en_attente',
          remarque: l.remarque ?? '',
        }),
      ),
    )
    for (const r of resultats) if (r.status === 'fulfilled') lignesCreees.push(r.value)
    const echec = resultats.find((r) => r.status === 'rejected')
    if (echec) throw echec.reason

    return { ...commande, lignes: lignesCreees }
  } catch (cause) {
    if (!commande) throw cause // rien n'a été créé : rien à défaire

    // 4. Retour arrière : les lignes d'abord, la commande ensuite.
    const aSupprimer = [...lignesCreees.map((l) => `/lignesCommande/${l.id}`), `/commandes/${commande.id}`]
    const nettoyage = await Promise.allSettled(aSupprimer.map((chemin) => api.supprimer(chemin)))
    const incomplet = nettoyage.some((r) => r.status === 'rejected')

    const erreur = new Error(
      incomplet
        ? `La commande a échoué et le nettoyage est incomplet : vérifiez la commande n°${commande.id} dans la liste.`
        : "La commande n'a pas pu être enregistrée. Rien n'a été créé, vous pouvez réessayer.",
    )
    erreur.cause = cause
    erreur.nettoyageIncomplet = incomplet
    throw erreur
  }
}

// --- Modification des lignes (seulement tant que la commande est « en_attente ») ---
export const QUANTITE_MAX_LIGNE = 20

// Relit la commande sur le serveur : la cuisine a pu la démarrer depuis l'ouverture de la page.
async function garantirModifiable(api, commandeId) {
  const commande = await api.lire(`/commandes/${commandeId}`)
  if (!actionsDisponibles(commande.statut).modifiable) {
    throw new Error(
      `Cette commande est « ${infoStatut('commande', commande.statut).libelle} » : ses lignes ne peuvent plus être modifiées.`,
    )
  }
  return commande
}

// Change la quantité et/ou la remarque d'une ligne.
export async function modifierLigneCommande(api, commandeId, ligneId, { quantite, remarque } = {}) {
  await garantirModifiable(api, commandeId)
  const ligne = await api.lire(`/lignesCommande/${ligneId}`)
  if (ligne.commandeId !== Number(commandeId)) throw new Error("Cette ligne n'appartient pas à cette commande.")

  const champs = {}
  if (quantite !== undefined) {
    const q = Math.floor(Number(quantite))
    if (!(q >= 1 && q <= QUANTITE_MAX_LIGNE)) {
      throw new Error(`La quantité doit être comprise entre 1 et ${QUANTITE_MAX_LIGNE}.`)
    }
    champs.quantite = q
  }
  if (remarque !== undefined) champs.remarque = String(remarque).slice(0, 120)
  if (!Object.keys(champs).length) return ligne
  return api.modifier(`/lignesCommande/${ligneId}`, champs)
}

// Retire une ligne. Une commande ne peut pas devenir vide : pour tout supprimer, on l'annule.
export async function retirerLigneCommande(api, commandeId, ligneId) {
  await garantirModifiable(api, commandeId)
  const lignes = await api.lire('/lignesCommande', { commandeId })
  if (!lignes.some((l) => l.id === Number(ligneId))) throw new Error("Cette ligne n'existe plus.")
  if (lignes.length <= 1) {
    throw new Error('Une commande doit garder au moins une ligne. Annulez-la pour tout supprimer.')
  }
  await api.supprimer(`/lignesCommande/${ligneId}`)
}

// Ajoute un plat : si la commande le contient déjà, on augmente sa quantité (pas de doublon).
// Le prix unitaire est copié depuis le plat à cet instant.
export async function ajouterPlatACommande(api, commandeId, platId, quantite = 1) {
  await garantirModifiable(api, commandeId)
  const plat = await api.lire(`/plats/${platId}`)
  if (!plat.disponible) throw new Error(`« ${plat.nom} » n'est plus disponible.`)

  const lignes = await api.lire('/lignesCommande', { commandeId })
  const existante = lignes.find((l) => l.platId === plat.id)
  if (existante) {
    const q = Math.min(existante.quantite + quantite, QUANTITE_MAX_LIGNE)
    return api.modifier(`/lignesCommande/${existante.id}`, { quantite: q })
  }
  return api.creer('/lignesCommande', {
    commandeId: Number(commandeId),
    platId: plat.id,
    quantite,
    prixUnitaire: plat.prix,
    statutCuisine: 'en_attente',
    remarque: '',
  })
}

// Change le statut d'une commande en respectant le cycle de vie (CONTRIBUTING.md, section 3).
// On relit l'état réel avant d'écrire : pas de transition sur une donnée périmée.
export async function changerStatutCommande(api, id, nouveauStatut) {
  const actuelle = await api.lire(`/commandes/${id}`)
  if (actuelle.statut === 'payee' && nouveauStatut === 'annulee') {
    throw new Error('Une commande payée ne peut pas être annulée.')
  }
  if (!transitionCommandeValide(actuelle.statut, nouveauStatut)) {
    throw new Error(
      `Impossible de passer cette commande de « ${infoStatut('commande', actuelle.statut).libelle} » à « ${infoStatut('commande', nouveauStatut).libelle} ».`,
    )
  }
  return api.modifier(`/commandes/${id}`, { statut: nouveauStatut })
}

// Composable : chargements et actions du module. À appeler au niveau du setup.
export function useCommandes() {
  const { lire, creer, modifier, supprimer } = useApi()

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

  const api = { lire, creer, modifier, supprimer }
  const creerCommande = (donnees) => creerCommandeAvecLignes(api, donnees)

  return {
    chargerListe,
    chargerDetail,
    creerCommande,
    modifierLigne: (commandeId, ligneId, champs) => modifierLigneCommande(api, commandeId, ligneId, champs),
    retirerLigne: (commandeId, ligneId) => retirerLigneCommande(api, commandeId, ligneId),
    ajouterPlat: (commandeId, platId, quantite) => ajouterPlatACommande(api, commandeId, platId, quantite),
    marquerServie: (id) => changerStatutCommande(api, id, 'servie'),
    annuler: (id) => changerStatutCommande(api, id, 'annulee'),
  }
}