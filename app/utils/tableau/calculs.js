// Calculs du tableau de bord. Propriétaire : Traoré.
// Fonctions pures (sans Nuxt, sans réseau) : on les teste avec des données écrites à la main.
//
// Ce fichier est dans un SOUS-DOSSIER de utils/ : Nuxt ne l'auto-importe donc pas, et ses noms
// (jourLocal, ajouterJours...) ne risquent pas d'entrer en conflit avec ceux d'un autre module.
// La page l'importe explicitement : import { syntheseDuJour } from '~/utils/tableau/calculs.js'
import { assemblerCommandes, enCentimes, estOuverte, filtrerCommandes } from '../../composables/useCommandes.js'

const deux = (n) => String(n).padStart(2, '0')

// --- Dates : tout est en heure LOCALE, comme les données ("2026-10-21T12:05:00") ---

// jourLocal(new Date(2026, 9, 21, 19, 5)) -> '2026-10-21'
export const jourLocal = (date) => `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`

// ajouterJours('2026-10-21', -6) -> '2026-10-15'. On calcule à midi pour éviter tout décalage d'heure d'été.
export function ajouterJours(jour, nombre) {
  const [annee, mois, j] = jour.split('-').map(Number)
  return jourLocal(new Date(annee, mois - 1, j + nombre, 12))
}

const MODELE_JOUR = /^\d{4}-\d{2}-\d{2}$/
const MODELE_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/

// Permet de rejouer un jour passé : /tableau-de-bord?date=2026-10-21&heure=18:30
// Sans paramètre (ou avec un paramètre invalide), on prend l'heure réelle.
// Renvoie { maintenant: Date, simule: booléen }.
export function referenceMaintenant({ date, heure } = {}, reel = new Date()) {
  const reelle = { maintenant: new Date(reel), simule: false }
  if (typeof date !== 'string' || !MODELE_JOUR.test(date)) return reelle

  const [annee, mois, jour] = date.split('-').map(Number)
  const simulee = new Date(annee, mois - 1, jour, reel.getHours(), reel.getMinutes(), reel.getSeconds())
  // « 2026-02-31 » deviendrait le 3 mars : on refuse les dates qui n'existent pas.
  if (simulee.getMonth() !== mois - 1 || simulee.getDate() !== jour) return reelle

  if (typeof heure === 'string' && MODELE_HEURE.test(heure)) {
    const [h, m] = heure.split(':').map(Number)
    simulee.setHours(h, m, 0, 0)
  }
  return { maintenant: simulee, simule: true }
}

// --- Textes d'accueil ---

// Avant 5 h et à partir de 18 h : « Bonsoir ».
export const salutation = (date) => (date.getHours() >= 18 || date.getHours() < 5 ? 'Bonsoir' : 'Bonjour')

// prenom('Patrick Lwanzo') -> 'Patrick'
export const prenom = (nom) => String(nom ?? '').trim().split(/\s+/)[0] ?? ''

// dateEnLettres(new Date(2026, 9, 21)) -> 'Mercredi 21 octobre'
export function dateEnLettres(date) {
  const texte = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

// accorder(2, 'table occupée', 'tables occupées') -> '2 tables occupées' ; accorder(0, ...) -> '0 table occupée'
export const accorder = (nombre, singulier, pluriel) => `${nombre} ${nombre > 1 ? pluriel : singulier}`

// etiquetteTable({ numero: 4 }) -> 'T04' ; sans table : '—'
export const etiquetteTable = (table) => (table ? `T${String(table.numero).padStart(2, '0')}` : '—')

// resumeNoms(['Boeuf', 'Tilapia', 'Riz'], 2) -> 'Boeuf, Tilapia +1'
export function resumeNoms(noms = [], max = 2) {
  const premiers = noms.slice(0, max).join(', ')
  return noms.length > max ? `${premiers} +${noms.length - max}` : premiers
}

// --- Argent et variation ---

// Chiffre d'affaires = commandes PAYÉES dont le jour est entre `debut` et `fin` (inclus).
// Les commandes servies (pas encore payées) et annulées ne comptent pas. Calcul en centimes.
// `commandes` : commandes déjà assemblées (voir assemblerCommandes), avec leur `total`.
export function chiffreAffaires(commandes = [], debut, fin) {
  const centimes = commandes
    .filter((c) => c.statut === 'payee')
    .filter((c) => {
      const jour = String(c.creeLe).slice(0, 10)
      return jour >= debut && jour <= fin
    })
    .reduce((somme, c) => somme + enCentimes(c.total), 0)
  return centimes / 100
}

// variationPourcent(287, 102) -> 181.4 ; sans base de comparaison (précédent <= 0) : null, jamais NaN ni Infinity.
export function variationPourcent(actuel, precedent) {
  if (!(precedent > 0)) return null
  return Math.round(((actuel - precedent) / precedent) * 1000) / 10
}

// libelleVariation(12.4) -> '+12,4 % vs 7 jours précédents'
export function libelleVariation(variation) {
  if (variation === null || variation === undefined) return 'Pas de comparaison possible'
  const nombre = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(variation)
  return `${nombre} % vs 7 jours précédents`
}

// --- Stock ---

// Un ingrédient est en alerte quand stock <= seuil (valeur calculée, jamais stockée).
export function estEnAlerte(ingredient) {
  const stock = Number(ingredient?.stock)
  const seuil = Number(ingredient?.seuilAlerte)
  return Number.isFinite(stock) && Number.isFinite(seuil) && stock <= seuil
}

// --- Réservations ---

const enMinutes = (heure) => {
  const [h, m] = String(heure).split(':').map(Number)
  return h * 60 + m
}

// Réservations confirmées d'aujourd'hui qui n'ont pas encore eu lieu (30 minutes de tolérance
// pour un client en retard), de la plus proche à la plus lointaine.
export function prochainesReservations(reservations = [], maintenant, limite = 3) {
  const jour = jourLocal(maintenant)
  const seuil = maintenant.getHours() * 60 + maintenant.getMinutes() - 30
  return reservations
    .filter((r) => r.statut === 'confirmee' && r.date === jour && enMinutes(r.heure) >= seuil)
    .sort((a, b) => enMinutes(a.heure) - enMinutes(b.heure) || a.id - b.id)
    .slice(0, limite)
}

// --- Synthèse : tout ce que la page affiche, calculé en un seul passage ---

export function syntheseDuJour(
  { commandes = [], lignes = [], tables = [], reservations = [], ingredients = [] } = {},
  maintenant,
) {
  const jour = jourLocal(maintenant)
  const assemblees = assemblerCommandes({ commandes, lignes, tables })
  const ouvertes = assemblees.filter(estOuverte)

  // Chiffre d'affaires : les 7 derniers jours (aujourd'hui inclus) contre les 7 jours d'avant.
  const semaine = chiffreAffaires(assemblees, ajouterJours(jour, -6), jour)
  const precedente = chiffreAffaires(assemblees, ajouterJours(jour, -13), ajouterJours(jour, -7))

  // Tables : occupée = elle porte une commande ouverte (même règle que le plan de salle).
  const tablesActives = tables.filter((t) => t.actif !== false)
  const idsActifs = new Set(tablesActives.map((t) => t.id))
  const occupees = new Set(ouvertes.map((c) => c.tableId).filter((id) => idsActifs.has(id)))

  // Réservations du jour (confirmées seulement).
  const duJour = reservations.filter((r) => r.statut === 'confirmee' && r.date === jour)

  const alertes = ingredients
    .filter(estEnAlerte)
    .map((i) => i.nom)
    .sort((a, b) => String(a).localeCompare(String(b), 'fr'))

  return {
    jour,
    ca: { semaine, precedente, variation: variationPourcent(semaine, precedente) },
    commandes: {
      aujourdhui: assemblees.filter((c) => String(c.creeLe).slice(0, 10) === jour && c.statut !== 'annulee').length,
      enCours: ouvertes.length,
    },
    tables: { occupees: occupees.size, actives: tablesActives.length },
    reservations: {
      nombre: duJour.length,
      couverts: duJour.reduce((somme, r) => somme + (Number(r.nbPersonnes) || 0), 0),
      prochaines: prochainesReservations(duJour, maintenant),
    },
    stock: { nombre: alertes.length, noms: alertes },
    dernieres: filtrerCommandes(assemblees).slice(0, 4), // les plus récentes d'abord
  }
}