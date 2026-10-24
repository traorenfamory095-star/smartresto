// VERSION PROVISOIRE : renvoie toujours un administrateur connecté.
// Propriétaire : Gaël, qui la remplacera par la vraie SANS CHANGER CETTE INTERFACE.
// (Traoré ne livre que ce contrat pour que personne ne soit bloqué.)
//
// Contrat à respecter :
//   utilisateur            ref   { id, nom, email, role } ou null si personne n'est connecté
//   estConnecte            computed booléen
//   peut(chemin)           booléen : ce rôle a-t-il le droit d'ouvrir cette page ?
//                          Reçoit un CHEMIN ("/plats", "/stock/mouvements", "/rapports").
//                          Une sous-page suit le droit de son module ("/plats/3" -> "/plats").
//   seConnecter(email, mdp)  async -> { ok: true } ou { ok: false, erreur: 'message lisible' }
//   seDeconnecter()        vide l'utilisateur et renvoie vers /connexion
export function useAuth() {
  const utilisateur = useState('smartresto-utilisateur', () => ({
    id: 1,
    nom: 'Administrateur',
    email: 'admin@smartresto.cd',
    role: 'admin',
  }))

  const estConnecte = computed(() => utilisateur.value !== null)

  function peut(_chemin) {
    return true
  }

  async function seConnecter(_email, _motDePasse) {
    return { ok: true }
  }

  function seDeconnecter() {
    // Provisoire : on ne vide rien, on renvoie seulement vers la page de connexion.
    return navigateTo('/connexion')
  }

  return { utilisateur, estConnecte, peut, seConnecter, seDeconnecter }
}
