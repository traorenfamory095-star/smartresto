// Panier du site PUBLIC (le client). Propriétaire : Traoré.
// Séparé de usePanier (le panier du personnel, pour une table) : un visiteur ne doit jamais
// remplir le panier de prise de commande de l'équipe.
import {
  ajouterAuPanier, changerQuantite, retirerDuPanier, changerRemarque, nombreArticles,
} from './usePanier.js'
import { calculerTotal } from './useCommandes.js'

export function usePanierPublic() {
  const lignes = useState('panier-public-lignes', () => [])
  const nomClient = useState('panier-public-nom', () => '')
  const telephone = useState('panier-public-tel', () => '')
  const nbCouverts = useState('panier-public-couverts', () => 1)
  const note = useState('panier-public-note', () => '')

  return {
    lignes, nomClient, telephone, nbCouverts, note,
    total: computed(() => calculerTotal(lignes.value)),
    nbArticles: computed(() => nombreArticles(lignes.value)),
    ajouter: (plat) => { lignes.value = ajouterAuPanier(lignes.value, plat) },
    changerQuantite: (platId, q) => { lignes.value = changerQuantite(lignes.value, platId, q) },
    retirer: (platId) => { lignes.value = retirerDuPanier(lignes.value, platId) },
    changerRemarque: (platId, r) => { lignes.value = changerRemarque(lignes.value, platId, r) },
    // On garde le nom et le téléphone : un client qui recommande ne les retape pas.
    vider: () => {
      lignes.value = []
      nbCouverts.value = 1
      note.value = ''
    },
  }
}