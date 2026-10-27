// Messages de succès / d'erreur affichés à l'écran par <UiNotification /> (déjà placé dans app.vue).
// Propriétaire : Traoré (socle).
//
//   const notifier = useNotifier()
//   notifier.succes('Plat enregistré')
//   notifier.erreur(e)            // accepte une Error (affiche e.message) ou une chaîne
export function useNotifier() {
  // useState : la liste est partagée par toute l'application.
  const notifications = useState('smartresto-notifications', () => [])

  function retirer(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function afficher(type, message, duree) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    // On garde au plus 4 messages à l'écran.
    notifications.value = [...notifications.value, { id, type, message }].slice(-4)
    // Les minuteurs n'existent que dans le navigateur.
    if (import.meta.client && duree > 0) setTimeout(() => retirer(id), duree)
    return id
  }

  function succes(message, duree = 4000) {
    return afficher('succes', message, duree)
  }

  function erreur(messageOuErreur, duree = 6000) {
    const message =
      typeof messageOuErreur === 'string'
        ? messageOuErreur
        : (messageOuErreur?.message ?? 'Une erreur est survenue.')
    return afficher('erreur', message, duree)
  }

  return { notifications, succes, erreur, retirer }
}
