export default defineNuxtRouteMiddleware(async (to) => {
  const {
    utilisateur,
    estConnecte,
    peut,
    seDeconnecter,
  } = useAuth()

  const { lire } = useApi()

  const cookie = useCookie('smartresto-user', {
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    path: '/',
  })

  if (estConnecte.value) {
    let employe

    try {
      const employes = await lire('/employes', {
        id: utilisateur.value.id,
      })

      employe = employes.find(
        (personne) =>
          String(personne.id) === String(utilisateur.value.id),
      )
    } catch {
      // Une panne de l’API ne doit pas effacer la session.
      return abortNavigation(
        createError({
          statusCode: 503,
          statusMessage:
            'Impossible de vérifier ton compte. Réessaie dans un instant.',
        }),
      )
    }

    const rolesAutorises = [
      'admin',
      'gerant',
      'serveur',
      'cuisinier',
      'caissier',
    ]

    if (
      !employe ||
      employe.actif !== true ||
      !rolesAutorises.includes(employe.role)
    ) {
      // Évite une redirection vers la page où on se trouve déjà.
      if (to.path === '/connexion') {
        utilisateur.value = null
        cookie.value = null
        return
      }

      return seDeconnecter()
    }

    // Actualise aussi le rôle et le nom, sans le mot de passe.
    const session = {
      id: employe.id,
      nom: employe.nom,
      email: employe.email,
      role: employe.role,
    }

    utilisateur.value = session
    cookie.value = session
  }

  if (to.path === '/connexion') {
    if (estConnecte.value) {
      return navigateTo('/tableau-de-bord')
    }

    return
  }

  if (estRoutePublique(to.path)) return

  if (!estConnecte.value) {
    return navigateTo('/connexion')
  }

  if (!peut(to.path)) {
    return navigateTo('/')
  }
})