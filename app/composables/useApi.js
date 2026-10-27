// Porte d'entrée unique vers l'API JSON Server (http://localhost:3001).
// Propriétaire : Traoré (socle).
//
// Utilisation (dans <script setup> ou un composable, jamais dans un gestionnaire d'événement) :
//
//   const { lire, creer, modifier, supprimer } = useApi()
//   const { data: plats, error } = await useAsyncData('plats', () => lire('/plats', { disponible: true }))
//   await modifier(`/plats/${id}`, { disponible: false })   // PATCH
//
// Toutes les fonctions renvoient les données, ou lèvent une Error dont `message` est lisible
// (affichable tel quel) et `statut` le code HTTP (null si le serveur est injoignable).
export function useApi() {
  // useRuntimeConfig() doit être appelé pendant le setup : c'est pour cela que
  // useApi() doit lui aussi être appelé au niveau du setup.
  const baseURL = useRuntimeConfig().public.apiBase

  async function requete(methode, chemin, { corps, parametres } = {}) {
    try {
      return await $fetch(chemin, { baseURL, method: methode, body: corps, query: parametres })
    } catch (e) {
      throw creerErreurApi(e)
    }
  }

  return {
    // GET   /plats?disponible=true
    lire: (chemin, parametres) => requete('GET', chemin, { parametres }),
    // POST  /plats
    creer: (chemin, donnees) => requete('POST', chemin, { corps: donnees }),
    // PATCH /plats/3  (modifie seulement les champs envoyés)
    modifier: (chemin, donnees) => requete('PATCH', chemin, { corps: donnees }),
    // PUT   /plats/3  (remplace toute la ressource)
    remplacer: (chemin, donnees) => requete('PUT', chemin, { corps: donnees }),
    // DELETE /plats/3
    supprimer: (chemin) => requete('DELETE', chemin),
  }
}
