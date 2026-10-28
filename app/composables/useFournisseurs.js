export function useFournisseurs() {
  const api = useApi()

  const lister = () => api.lire('/fournisseurs')
  const lire = (id) => api.lire(`/fournisseurs/${id}`)
  const creer = (f) => api.creer('/fournisseurs', f)
  const modifier = (id, f) => api.modifier(`/fournisseurs/${id}`, f)

  async function supprimer(id) {
    const appros = await api.lire('/approvisionnements', { fournisseurId: id })
    if (appros.length > 0) throw new Error('Ce fournisseur a des approvisionnements, impossible à supprimer.')
    return api.supprimer(`/fournisseurs/${id}`)
  }

  const listerAppro = () => api.lire('/approvisionnements', { _sort: 'dateCommande', _order: 'desc' })
  const lireAppro = (id) => api.lire(`/approvisionnements/${id}`)
  const creerAppro = (a) => api.creer('/approvisionnements', a)

  async function receptionner(appro) {
    if (appro.statut !== 'commande') throw new Error('Cet approvisionnement est déjà traité.')
    // Double check avant écriture (protection contre double-clic)
    const fresh = await lireAppro(appro.id)
    if (fresh.statut !== 'commande') throw new Error('Déjà reçu par une autre session.')

    // Marquer d'abord l'appro (idempotence)
    await api.modifier(`/approvisionnements/${appro.id}`, {
      statut: 'recue',
      dateReception: new Date().toISOString().slice(0, 10)
    })

    // Puis pour chaque ligne : mouvement entree + incrément du stock
    for (const ligne of appro.lignes) {
      const ing = await api.lire(`/ingredients/${ligne.ingredientId}`)
      if (!ing) continue
      await api.creer('/mouvementsStock', {
        ingredientId: ing.id, type: 'entree', quantite: ligne.quantite,
        date: new Date().toISOString().slice(0, 19), motif: `Appro #${appro.id}`
      })
      await api.modifier(`/ingredients/${ing.id}`, { stock: Number(ing.stock) + Number(ligne.quantite) })
    }
  }

  return { lister, lire, creer, modifier, supprimer, listerAppro, lireAppro, creerAppro, receptionner }
}

// ---- Fonctions pures ----
export function calculerTotalAppro(lignes) {
  return lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.prixUnitaire), 0)
}

export function filtrerFournisseurs(fournisseurs, { recherche = '', categorie = '' } = {}) {
  return fournisseurs.filter(f => {
    if (recherche && !f.nom.toLowerCase().includes(recherche.toLowerCase())) return false
    if (categorie && f.categorie !== categorie) return false
    return true
  })
}
