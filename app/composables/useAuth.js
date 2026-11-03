// Authentification du personnel. Propriétaire : Gaël (module Personnel et rôles).
// Remplace la version provisoire du socle SANS CHANGER SON INTERFACE :
//
//   utilisateur              ref   { id, nom, email, role } ou null si personne n'est connecté
//   estConnecte              computed booléen
//   peut(chemin)             booléen : ce rôle a-t-il le droit d'ouvrir cette page ?
//                            Accepte '/plats', 'plats' ou une sous-page ('/plats/3').
//   seConnecter(email, mdp)  async -> { ok: true } ou { ok: false, erreur: 'message lisible' }
//   seDeconnecter()          vide l'utilisateur et renvoie vers /connexion
//
// Les règles de droits sont dans utils/permissions.js (fonctions pures, testées).
// Le mot de passe n'est jamais gardé : ni dans l'état, ni dans le cookie.
// (Il est comparé en clair uniquement parce que JSON Server simule le backend.)
import { rolePeut, estRouteLibre } from '~/utils/permissions.js'

const HUIT_HEURES = 60 * 60 * 8

export function useAuth() {
  const { lire } = useApi()

  // Le cookie garde la session après un rafraîchissement (F5), côté serveur comme côté navigateur.
  const cookie = useCookie('smartresto-session', { maxAge: HUIT_HEURES, sameSite: 'lax', path: '/' })
  const utilisateur = useState('smartresto-utilisateur', () => cookie.value ?? null)

  const estConnecte = computed(() => utilisateur.value !== null)

  function peut(chemin) {
    if (!utilisateur.value) return estRouteLibre(chemin)
    return rolePeut(utilisateur.value.role, chemin)
  }

  async function seConnecter(email, motDePasse) {
    const adresse = String(email ?? '').trim().toLowerCase()
    if (!adresse || !motDePasse) {
      return { ok: false, erreur: 'Saisissez votre e-mail et votre mot de passe.' }
    }

    let employes
    try {
      employes = await lire('/employes', { email: adresse })
    } catch {
      return { ok: false, erreur: "Le serveur ne répond pas. Vérifiez que l'API est lancée (npm run api)." }
    }

    const employe = employes.find((personne) => personne.motDePasse === motDePasse)
    if (!employe) {
      return { ok: false, erreur: 'E-mail ou mot de passe incorrect.' }
    }
    if (employe.actif !== true) {
      return { ok: false, erreur: 'Ce compte est désactivé. Adressez-vous au gérant.' }
    }

    const session = { id: employe.id, nom: employe.nom, email: employe.email, role: employe.role }
    utilisateur.value = session
    cookie.value = session
    return { ok: true }
  }

  function seDeconnecter() {
    utilisateur.value = null
    cookie.value = null
    return navigateTo('/connexion?espace=administration')
  }

  return { utilisateur, estConnecte, peut, seConnecter, seDeconnecter }
}
