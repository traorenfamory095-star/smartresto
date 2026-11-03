// Protège les pages d'administration. Propriétaire : Gaël (module Personnel et rôles).
// - Pages publiques (site, carte, réservation) : libres.
// - Non connecté sur une page d'administration : renvoyé vers /connexion, puis ramené à la page voulue.
// - Connecté sans le droit (un serveur qui tape /rapports) : renvoyé vers le tableau de bord.
// Masquer un lien dans le menu est du confort ; c'est ce middleware qui bloque vraiment la route.
import { estRouteLibre, redirectionSure } from '~/utils/permissions.js'

export default defineNuxtRouteMiddleware((to) => {
  const { estConnecte, peut } = useAuth()

  if (to.path === '/connexion') {
    // Déjà connecté : inutile de revoir le formulaire.
    if (estConnecte.value) return navigateTo(redirectionSure(to.query.redirection))
    return
  }

  if (estRouteLibre(to.path)) return

  if (!estConnecte.value) {
    return navigateTo({ path: '/connexion', query: { espace: 'administration', redirection: to.fullPath } })
  }

  if (!peut(to.path)) {
    if (import.meta.client) useNotifier().erreur("Votre rôle ne donne pas accès à cette page.")
    return navigateTo('/tableau-de-bord')
  }
})
