export function useAuth() {
  const { lire } = useApi()

  const cookie = useCookie('smartresto-user', {
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    path: '/',
  })

  const utilisateur = useState(
    'smartresto-utilisateur',
    () => cookie.value ?? null,
  )

  const estConnecte = computed(() => utilisateur.value !== null)

  const acces = {
    serveur: ['/commandes', '/carte', '/tables', '/reservations'],
    cuisinier: ['/cuisine', '/carte'],
    caissier: ['/factures', '/commandes'],
  }

  function peut(chemin) {
    if (typeof chemin !== 'string' || !chemin.startsWith('/')) {
      return false
    }

    const cible =
      chemin.split(/[?#]/)[0].replace(/\/+$/, '') || '/'

    if (estRoutePublique(cible)) return true
    if (!utilisateur.value) return false

    const role = utilisateur.value.role

    if (role === 'admin' || role === 'gerant') return true

    if (cible === '/tableau-de-bord') {
      return Object.hasOwn(acces, role)
    }

    return (acces[role] ?? []).some(
      (route) => cible === route || cible.startsWith(`${route}/`),
    )
  }

  async function seConnecter(email, motDePasse) {
    const emailNormalise = String(email ?? '').trim().toLowerCase()

    if (!emailNormalise || !motDePasse) {
      return {
        ok: false,
        erreur: 'Renseigne ton e-mail et ton mot de passe.',
      }
    }

    try {
      const employes = await lire('/employes', {
        email: emailNormalise,
      })

      const employe = employes.find(
        (personne) => personne.motDePasse === motDePasse,
      )

      if (!employe) {
        return {
          ok: false,
          erreur: 'E-mail ou mot de passe incorrect.',
        }
      }

      if (employe.actif !== true) {
        return {
          ok: false,
          erreur: 'Ce compte est désactivé. Contacte le responsable.',
        }
      }

      // Le mot de passe ne fait jamais partie de la session.
      const session = {
        id: employe.id,
        nom: employe.nom,
        email: employe.email,
        role: employe.role,
      }

      utilisateur.value = session
      cookie.value = session

      return { ok: true }
    } catch {
      return {
        ok: false,
        erreur: 'Connexion au serveur impossible. Réessaie plus tard.',
      }
    }
  }

  function seDeconnecter() {
    utilisateur.value = null
    cookie.value = null

    return navigateTo('/connexion')
  }

  return {
    utilisateur,
    estConnecte,
    peut,
    seConnecter,
    seDeconnecter,
  }
}