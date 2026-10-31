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
    const fresh = await lireAppro(appro.id)
    if (fresh.statut !== 'commande') throw new Error('Déjà reçu par une autre session.')

    if (!Array.isArray(fresh.lignes) || fresh.lignes.length === 0) {
      throw new Error('Cet approvisionnement ne contient aucune ligne.')
    }

    const lignes = fresh.lignes.map((ligne, index) => {
      const quantite = Number(ligne.quantite)
      if (ligne.ingredientId === null || ligne.ingredientId === undefined || ligne.ingredientId === '') {
        throw new Error(`Ligne ${index + 1} : ingrédient manquant.`)
      }
      if (!Number.isFinite(quantite) || quantite <= 0) {
        throw new Error(`Ligne ${index + 1} : quantité invalide.`)
      }
      return { ...ligne, quantite }
    })

    const stocks = new Map()
    for (const ligne of lignes) {
      const key = String(ligne.ingredientId)
      if (!stocks.has(key)) {
        const ingredient = await api.lire(`/ingredients/${ligne.ingredientId}`)
        if (!ingredient) throw new Error(`Ingrédient ${ligne.ingredientId} introuvable.`)
        const stock = Number(ingredient.stock)
        if (!Number.isFinite(stock)) {
          throw new Error(`Le stock de « ${ingredient.nom} » est invalide.`)
        }
        stocks.set(key, { ingredient, stock, quantite: 0 })
      }
      const changement = stocks.get(key)
      changement.quantite += ligne.quantite
      if (!Number.isFinite(changement.stock + changement.quantite)) {
        throw new Error(`La quantité totale pour « ${changement.ingredient.nom} » est invalide.`)
      }
    }

    const mouvements = lignes.map((ligne, index) => ({
      ingredientId: ligne.ingredientId,
      motif: `Appro #${appro.id} - ligne ${index + 1}`,
      quantite: ligne.quantite,
    }))
    const stocksModifies = []
    const erreursRetourArriere = []

    async function marquerAControler() {
      try {
        await api.modifier(`/approvisionnements/${appro.id}`, { statut: 'a_verifier' })
        return true
      } catch (e) {
        erreursRetourArriere.push(`statut de la commande : ${e.message}`)
        return false
      }
    }

    async function annulerReception() {
      for (const mouvement of mouvements) {
        try {
          const existants = await api.lire('/mouvementsStock', { motif: mouvement.motif })
          for (const existant of existants) {
            await api.supprimer(`/mouvementsStock/${existant.id}`)
          }
        } catch (e) {
          erreursRetourArriere.push(`mouvement « ${mouvement.motif} » : ${e.message}`)
        }
      }

      for (const changement of stocksModifies.reverse()) {
        try {
          const actuel = await api.lire(`/ingredients/${changement.ingredient.id}`)
          const stockActuel = Number(actuel.stock)
          if (stockActuel === changement.stock + changement.quantite) {
            await api.modifier(`/ingredients/${changement.ingredient.id}`, { stock: changement.stock })
          } else if (stockActuel !== changement.stock) {
            throw new Error('le stock a changé entre-temps, restauration automatique refusée')
          }
        } catch (e) {
          erreursRetourArriere.push(`stock de « ${changement.ingredient.nom} » : ${e.message}`)
        }
      }
    }

    for (const changement of stocks.values()) {
      const stockAttendu = changement.stock + changement.quantite
      try {
        await api.modifier(`/ingredients/${changement.ingredient.id}`, { stock: stockAttendu })
        stocksModifies.push(changement)
      } catch (e) {
        try {
          const actuel = await api.lire(`/ingredients/${changement.ingredient.id}`)
          const stockActuel = Number(actuel.stock)
          if (stockActuel === stockAttendu) stocksModifies.push(changement)
          else if (stockActuel !== changement.stock) {
            erreursRetourArriere.push(`stock de « ${changement.ingredient.nom} » : état incertain après l'échec de la mise à jour`)
          }
        } catch (lectureErreur) {
          erreursRetourArriere.push(`vérification du stock de « ${changement.ingredient.nom} » : ${lectureErreur.message}`)
        }
        await annulerReception()
        if (erreursRetourArriere.length) {
          const statutMisAJour = await marquerAControler()
          const suite = statutMisAJour
            ? 'La commande est marquée à vérifier.'
            : 'Le statut n’a pas pu être modifié ; une vérification manuelle est nécessaire.'
          throw new Error(`Réception interrompue : ${e.message}. Retour arrière incomplet (${erreursRetourArriere.join('; ')}). ${suite}`)
        }
        throw new Error(`Réception interrompue : ${e.message}. Les modifications ont été annulées ; vous pouvez réessayer.`)
      }
    }

    try {
      for (const mouvement of mouvements) {
        await api.creer('/mouvementsStock', {
          ingredientId: mouvement.ingredientId,
          type: 'entree',
          quantite: mouvement.quantite,
          date: new Date().toISOString().slice(0, 19),
          motif: mouvement.motif,
        })
      }
    } catch (e) {
      await annulerReception()
      if (erreursRetourArriere.length) {
        const statutMisAJour = await marquerAControler()
        const suite = statutMisAJour
          ? 'La commande est marquée à vérifier.'
          : 'Le statut n’a pas pu être modifié ; une vérification manuelle est nécessaire.'
        throw new Error(`Réception interrompue : ${e.message}. Retour arrière incomplet (${erreursRetourArriere.join('; ')}). ${suite}`)
      }
      throw new Error(`Réception interrompue : ${e.message}. Les modifications ont été annulées ; vous pouvez réessayer.`)
    }

    try {
      await api.modifier(`/approvisionnements/${appro.id}`, {
        statut: 'recue',
        dateReception: new Date().toISOString().slice(0, 10),
      })
    } catch (e) {
      let statutActuel
      try {
        statutActuel = (await lireAppro(appro.id)).statut
      } catch (lectureErreur) {
        const statutMisAJour = await marquerAControler()
        const suite = statutMisAJour
          ? 'La commande est marquée à vérifier.'
          : 'Le statut n’a pas pu être modifié ; vérifiez la commande avant toute nouvelle réception.'
        throw new Error(`Impossible de confirmer la réception (${e.message}) : ${lectureErreur.message}. ${suite}`)
      }
      if (statutActuel === 'recue') return

      await annulerReception()
      if (erreursRetourArriere.length) {
        const statutMisAJour = await marquerAControler()
        const suite = statutMisAJour
          ? 'La commande est marquée à vérifier.'
          : 'Le statut n’a pas pu être modifié ; une vérification manuelle est nécessaire.'
        throw new Error(`Réception interrompue : ${e.message}. Retour arrière incomplet (${erreursRetourArriere.join('; ')}). ${suite}`)
      }
      throw new Error(`Réception interrompue : ${e.message}. Les modifications ont été annulées ; vous pouvez réessayer.`)
    }
  }

  return { lister, lire, creer, modifier, supprimer, listerAppro, lireAppro, creerAppro, receptionner }
}

// ---- Fonctions pures ----
export function calculerTotalAppro(lignes) {
  return lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.prixUnitaire), 0)
}

export function validerLignesAppro(lignes, fournisseurId, ingredients) {
  if (fournisseurId === null || fournisseurId === undefined || fournisseurId === '') {
    return 'Choisissez un fournisseur.'
  }
  if (!Array.isArray(lignes) || lignes.length === 0) {
    return 'Ajoutez au moins une ligne.'
  }

  for (const [index, ligne] of lignes.entries()) {
    if (ligne.ingredientId === null || ligne.ingredientId === undefined || ligne.ingredientId === '') {
      return `Ligne ${index + 1} : choisissez un ingrédient.`
    }
    if (!ingredients.some(ingredient => String(ingredient.id) === String(ligne.ingredientId))) {
      return `Ligne ${index + 1} : cet ingrédient n'est pas proposé par le fournisseur choisi.`
    }
    if (!Number.isFinite(Number(ligne.quantite)) || Number(ligne.quantite) <= 0) {
      return `Ligne ${index + 1} : la quantité doit être supérieure à zéro.`
    }
    if (ligne.prixUnitaire === null || ligne.prixUnitaire === undefined || ligne.prixUnitaire === '' ||
      !Number.isFinite(Number(ligne.prixUnitaire)) || Number(ligne.prixUnitaire) < 0) {
      return `Ligne ${index + 1} : le prix doit être un nombre positif ou nul.`
    }
  }
  return null
}

export function filtrerFournisseurs(fournisseurs, { recherche = '', categorie = '' } = {}) {
  return fournisseurs.filter(f => {
    if (recherche && !f.nom.toLowerCase().includes(recherche.toLowerCase())) return false
    if (categorie && f.categorie !== categorie) return false
    return true
  })
}
