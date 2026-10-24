// Fonctions d'affichage partagées. Propriétaire : Traoré (socle).
// Auto-importées par Nuxt : on les appelle directement dans les composants.

const formatPrix = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
})

// formaterPrix(9.5) -> "9,50 $"
// Une valeur absente ou invalide donne "—" : jamais "NaN $".
export function formaterPrix(nombre) {
  if (nombre === null || nombre === undefined || nombre === '') return '—'
  const valeur = Number(nombre)
  if (!Number.isFinite(valeur)) return '—'
  return formatPrix.format(valeur)
}

// Une date seule ("2026-10-21") est lue à l'heure locale, sinon elle reculerait d'un jour
// dans les fuseaux à l'ouest de Greenwich.
function versDate(texte) {
  if (!texte) return null
  const seule = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texte)
  const date = seule ? new Date(Number(seule[1]), Number(seule[2]) - 1, Number(seule[3])) : new Date(texte)
  return Number.isNaN(date.getTime()) ? null : date
}

// formaterDate("2026-10-21") -> "21 oct. 2026"
export function formaterDate(texte) {
  const date = versDate(texte)
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

// formaterHeure("2026-10-21T12:05:00") -> "12:05"
export function formaterHeure(texte) {
  const date = versDate(texte)
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}
