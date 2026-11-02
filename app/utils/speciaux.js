// Choix des plats mis en avant sur la page « Spéciaux ». Propriétaire : Traoré (site public).
// Fonction pure (testable). Aucune offre ni réduction n'est inventée : on met en avant les plats
// disponibles aux prix les plus doux, avec leur vrai prix.

const estBoisson = (categorie) => /boisson/i.test(categorie?.nom ?? '')

// choisirSpeciaux(plats, categories, 6) -> les 6 plats disponibles les moins chers, hors boissons
// (une bouteille d'eau à 1 $ n'est pas un « spécial »). À prix égal : ordre alphabétique.
export function choisirSpeciaux(plats = [], categories = [], limite = 6) {
  const boissons = new Set(categories.filter(estBoisson).map((c) => c.id))
  return plats
    .filter((p) => p.disponible && !boissons.has(p.categorieId))
    .sort((a, b) => Number(a.prix) - Number(b.prix) || String(a.nom).localeCompare(String(b.nom), 'fr'))
    .slice(0, limite)
}