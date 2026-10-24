// Les cinq rôles de l'application (valeurs stockées dans employes.json) et leur libellé.
// Propriétaire : Traoré (socle). Les droits par rôle, eux, sont à Gaël (useAuth).
export const ROLES = ['admin', 'gerant', 'serveur', 'cuisinier', 'caissier']

const LIBELLES = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  serveur: 'Serveur',
  cuisinier: 'Cuisinier',
  caissier: 'Caissier',
}

export function libelleRole(role) {
  return LIBELLES[role] ?? role ?? '—'
}
