const BASE = 'https://images.unsplash.com'
const OPTIONS = '?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85'

export const IMAGES_SECOURS = {
  poisson: `${BASE}/photo-1737138472956-79f272bf288c${OPTIONS}&w=1200`,
  poisson2: `${BASE}/photo-1737140789642-9788a3388494${OPTIONS}&w=1000`,
  brochettes: `${BASE}/photo-1529563021893-cc83c992d75d${OPTIONS}&w=1200`,
  grillade: `${BASE}/photo-1722282470007-893a5607eeb3${OPTIONS}&w=1000`,
}

function trierCategories(categories) {
  return [...categories].sort((a, b) => Number(a.ordre) - Number(b.ordre))
}

function normaliserNom(nom) {
  return String(nom ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}

export function compterPlatsParCategorie(plats) {
  return plats.reduce((comptages, plat) => {
    const categorieId = String(plat.categorieId)
    comptages[categorieId] = (comptages[categorieId] ?? 0) + 1
    return comptages
  }, {})
}

export function trierParOrdre(categories) {
  return [...categories].sort((a, b) => Number(a.ordre) - Number(b.ordre))
}

export function echangerOrdre(categories, id, direction) {
  const categoriesTriees = trierParOrdre(categories)
  const index = categoriesTriees.findIndex((categorie) => String(categorie.id) === String(id))
  const delta = direction === 'monter' || direction === 'up' ? -1
    : direction === 'descendre' || direction === 'down' ? 1
      : 0
  const voisin = categoriesTriees[index + delta]

  if (index < 0 || delta === 0 || !voisin) return null

  const categorie = categoriesTriees[index]
  return [
    { ...categorie, ordre: voisin.ordre },
    { ...voisin, ordre: categorie.ordre },
  ]
}

export function validerCategorie(donnees, categories, idEnCours = null) {
  const erreurs = {}
  const nom = String(donnees.nom ?? '').trim()
  const ordre = Number(donnees.ordre)
  const autreCategorie = (categorie) => idEnCours === null
    || String(categorie.id) !== String(idEnCours)

  if (!nom) {
    erreurs.nom = 'Name is required.'
  } else if (categories.some((categorie) =>
    autreCategorie(categorie) && normaliserNom(categorie.nom) === normaliserNom(nom),
  )) {
    erreurs.nom = 'A category with this name already exists.'
  }

  if (!Number.isInteger(ordre) || ordre < 1) {
    erreurs.ordre = 'Order must be an integer greater than or equal to 1.'
  } else if (categories.some((categorie) =>
    autreCategorie(categorie) && Number(categorie.ordre) === ordre,
  )) {
    erreurs.ordre = 'This order is already used.'
  }

  return erreurs
}

export function peutSupprimer(nbPlats) {
  return Number(nbPlats) === 0
}

export function libellePlats(nombre) {
  const quantite = Number(nombre)
  return `${quantite} ${quantite === 1 ? 'dish' : 'dishes'}`
}

export function verifierDisponibilite(lignes, plats) {
  const platsParId = new Map((plats ?? []).map((plat) => [String(plat.id), plat]))
  return (lignes ?? []).filter((ligne) => platsParId.get(String(ligne.platId))?.disponible !== true)
}

export function validerConfirmation({ tableId, nbCouverts, note }, tables) {
  const erreurs = {}
  const table = (tables ?? []).find((element) => String(element.id) === String(tableId))
  const couverts = Number(nbCouverts)

  if (!tableId) {
    erreurs.tableId = 'Choisissez une table.'
  } else if (!table || !table.actif) {
    erreurs.tableId = "Cette table n'est pas disponible."
  }

  if (!Number.isInteger(couverts) || couverts < 1) {
    erreurs.nbCouverts = 'Le nombre de couverts doit être au moins égal à 1.'
  } else if (table && couverts > Number(table.capacite)) {
    erreurs.nbCouverts = `Cette table accueille au maximum ${table.capacite} personnes.`
  }

  if (String(note ?? '').length > 200) {
    erreurs.note = 'La note ne peut pas dépasser 200 caractères.'
  }

  return erreurs
}

export function libelleArticles(nombre) {
  const quantite = Number(nombre)
  return `${quantite} ${quantite === 1 ? 'article' : 'articles'}`
}

export function montantLigneCentimes(ligne) {
  return Math.round(Number(ligne.prixUnitaire) * 100) * Number(ligne.quantite)
}

export function creerServiceCommandeClient({
  panier,
  creerCommande,
  notifier,
  lirePlats,
  lireServeurId,
}) {
  async function confirmer({ tableId, nbCouverts, note }) {
    if (!panier.lignes.value.length) {
      return { erreur: new Error('Ajoutez au moins un plat avant de confirmer la commande.') }
    }

    try {
      const plats = await lirePlats()
      const indisponibles = verifierDisponibilite(panier.lignes.value, plats)
      if (indisponibles.length) return { indisponibles }

      const serveurId = lireServeurId()
      if (serveurId === null || serveurId === undefined) {
        throw new Error("Impossible d'associer un serveur à cette commande.")
      }

      const resume = {
        total: panier.total.value,
        nbArticles: panier.nbArticles.value,
        tableId: Number(tableId),
      }
      const commande = await creerCommande({
        tableId: Number(tableId),
        serveurId,
        nbCouverts: Number(nbCouverts),
        note: String(note ?? ''),
        lignes: panier.lignes.value.map((ligne) => ({ ...ligne })),
      })

      panier.vider()
      notifier.succes(`Commande #${commande.id} enregistrée.`)
      return { commande, resume }
    } catch (erreur) {
      notifier.erreur(erreur)
      return { erreur }
    }
  }

  return { confirmer }
}

function normaliserNomCategorie(nom) {
  return String(nom ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function imageParId(images, plat) {
  const index = Number.isFinite(Number(plat.id)) ? Math.abs(Number(plat.id)) % images.length : 0
  return images[index]
}

export function resoudreImagePlat(plat, categorie) {
  if (typeof plat.imageUrl === 'string' && plat.imageUrl.trim()) return plat.imageUrl.trim()

  const nomCategorie = normaliserNomCategorie(categorie?.nom)

  if (nomCategorie === 'grillades') {
    return imageParId([IMAGES_SECOURS.grillade, IMAGES_SECOURS.brochettes], plat)
  }
  if (nomCategorie === 'poissons du lac') {
    return imageParId([IMAGES_SECOURS.poisson, IMAGES_SECOURS.poisson2], plat)
  }
  if (nomCategorie === 'plats traditionnels') {
    return imageParId([IMAGES_SECOURS.poisson2, IMAGES_SECOURS.grillade], plat)
  }

  return imageParId(
    [IMAGES_SECOURS.poisson, IMAGES_SECOURS.poisson2, IMAGES_SECOURS.brochettes, IMAGES_SECOURS.grillade],
    plat,
  )
}

export function creerAjoutDepuisCarte(panier, notifier) {
  return function ajouterDepuisCarte(plat) {
    try {
      panier.ajouter(plat)
      notifier.succes(`${plat.nom} ajouté au panier.`)
      return true
    } catch (erreur) {
      notifier.erreur(erreur)
      return false
    }
  }
}

function estDisponible(plat) {
  return plat.disponible === true
}

export function construirePastilles(categories, plats) {
  const categoriesAvecPlats = new Set(
    plats.filter(estDisponible).map((plat) => String(plat.categorieId)),
  )

  return trierCategories(categories).filter((categorie) =>
    categoriesAvecPlats.has(String(categorie.id)),
  )
}

export function construireCarte(categories, plats, recherche = '', categorieIdActive = null) {
  const motRecherche = recherche.trim().toLocaleLowerCase()

  return trierCategories(categories)
    .map((categorie) => {
      const platsDeCategorie = plats
        .filter((plat) => estDisponible(plat) && String(plat.categorieId) === String(categorie.id))
        .filter((plat) => categorieIdActive === null || String(categorie.id) === String(categorieIdActive))
        .filter((plat) => {
          if (!motRecherche) return true

          return `${plat.nom} ${plat.description}`.toLocaleLowerCase().includes(motRecherche)
        })

      return { ...categorie, plats: platsDeCategorie }
    })
    .filter((categorie) => categorie.plats.length > 0)
}

export function useCategories() {
  const api = useApi()
  const operation = ref(null)

  const { data, pending, error, refresh } = useAsyncData('categories', async () => {
    const categories = await api.lire('/categories', { _sort: 'ordre', _order: 'asc' })
    return [...categories].sort((a, b) => a.ordre - b.ordre)
  })

  async function executer(nomOperation, action) {
    if (operation.value) throw new Error('Another category operation is already in progress.')
    operation.value = nomOperation
    try {
      return await action()
    } finally {
      operation.value = null
    }
  }

  async function recharger() {
    return refresh()
  }

  async function creer(donnees) {
    return executer('enregistrement', async () => {
      const categorie = await api.creer('/categories', {
        nom: String(donnees.nom).trim(),
        ordre: Number(donnees.ordre),
        description: String(donnees.description ?? '').trim(),
      })
      await recharger()
      return categorie
    })
  }

  async function modifier(id, donnees) {
    return executer('enregistrement', async () => {
      const categorie = await api.modifier(`/categories/${id}`, {
        nom: String(donnees.nom).trim(),
        ordre: Number(donnees.ordre),
        description: String(donnees.description ?? '').trim(),
      })
      await recharger()
      return categorie
    })
  }

  async function supprimer(id) {
    return executer('suppression', async () => {
      const plats = await api.lire('/plats', { categorieId: id })
      if (!peutSupprimer(plats.length)) {
        throw new Error(
          `This category contains ${libellePlats(plats.length)}: move or delete them first.`,
        )
      }

      const resultat = await api.supprimer(`/categories/${id}`)
      await recharger()
      return resultat
    })
  }

  async function deplacer(id, direction) {
    return executer('ordre', async () => {
      const changements = echangerOrdre(data.value ?? [], id, direction)
      if (!changements) return false

      try {
        await Promise.all(
          changements.map(({ id: categorieId, ordre }) =>
            api.modifier(`/categories/${categorieId}`, { ordre }),
          ),
        )
      } catch (erreurMiseAJour) {
        try {
          await recharger()
        } catch (erreurRechargement) {
          throw new Error(
            `${erreurMiseAJour.message} The category list could not be reloaded: ${erreurRechargement.message}`,
            { cause: erreurMiseAJour },
          )
        }
        throw erreurMiseAJour
      }

      await recharger()
      return true
    })
  }

  function monter(id) {
    return deplacer(id, 'monter')
  }

  function descendre(id) {
    return deplacer(id, 'descendre')
  }

  return {
    categories: data,
    pending,
    error,
    operation,
    refresh: recharger,
    recharger,
    creer,
    modifier,
    supprimer,
    monter,
    descendre,
  }
}

export function useCommandeClient() {
  const api = useApi()
  const panier = usePanier()
  const notifier = useNotifier()
  const { creerCommande } = useCommandes()
  const { utilisateur } = useAuth()

  const {
    data: donneesTables,
    pending: chargementTables,
    error: erreurTables,
    refresh: rechargerTables,
  } = useAsyncData('carte-tables-client', () => api.lire('/tables'), { default: () => [] })

  const service = creerServiceCommandeClient({
    panier,
    creerCommande,
    notifier,
    lirePlats: () => api.lire('/plats'),
    lireServeurId: () => utilisateur.value?.id,
  })

  return {
    panier,
    tables: computed(() => (donneesTables.value ?? []).filter((table) => table.actif)),
    chargementTables,
    erreurTables,
    rechargerTables,
    confirmer: service.confirmer,
    changerQuantite: panier.changerQuantite,
    retirer: panier.retirer,
    changerRemarque: panier.changerRemarque,
  }
}
