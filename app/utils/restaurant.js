// Coordonnées du restaurant, à UN seul endroit. Propriétaire : Traoré (site public).
// Auto-importé par Nuxt : on écrit RESTAURANT.telephone directement dans une page.
// ATTENTION : ces valeurs viennent de la maquette Figma, ce sont des exemples.
// Remplacez-les par les vraies coordonnées avant la démonstration finale.
export const RESTAURANT = {
  adresse: 'Avenue du Lac, Goma, RDC',
  telephone: '+243 995 221 410',
  email: 'bonjour@smartresto.cd',
  horaires: 'Mar–Dim · 12:00–22:30',
}

// lienTelephone('+243 995 221 410') -> 'tel:+243995221410'
// On garde le « + » de tête et les chiffres : un lien « tel: » ne doit pas contenir d'espaces.
export function lienTelephone(telephone = '') {
  const texte = String(telephone).trim()
  const chiffres = texte.replace(/\D/g, '')
  if (!chiffres) return ''
  return `tel:${texte.startsWith('+') ? '+' : ''}${chiffres}`
}