// Transforme n'importe quelle erreur de requête en une Error au message lisible.
// Fonction pure (testable) : utilisée par composables/useApi.js.
// L'erreur renvoyée porte `statut` (code HTTP, ou null si le serveur est injoignable).
export function creerErreurApi(e) {
  const statut = e?.statusCode ?? e?.status ?? e?.response?.status ?? null

  let message
  if (statut === null) {
    message = "Impossible de joindre l'API. Vérifiez que « npm run api » est lancé."
  } else if (statut === 404) {
    message = 'Élément introuvable.'
  } else if (statut >= 500) {
    message = 'Le serveur a rencontré un problème. Réessayez dans un instant.'
  } else {
    message = `La requête a été refusée (code ${statut}).`
  }

  const erreur = new Error(message)
  erreur.statut = statut
  erreur.cause = e
  return erreur
}
