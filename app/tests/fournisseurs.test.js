import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  calculerTotalAppro,
  filtrerFournisseurs,
  useFournisseurs,
  validerLignesAppro,
} from '../composables/useFournisseurs.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fournisseurs : accès API', () => {
  it('utilise les méthodes et chemins de useApi', async () => {
    const api = {
      lire: vi.fn().mockResolvedValue([]),
      creer: vi.fn().mockResolvedValue({ id: 1 }),
      modifier: vi.fn().mockResolvedValue({ id: 1 }),
      supprimer: vi.fn().mockResolvedValue({}),
    }
    vi.stubGlobal('useApi', () => api)

    const fournisseurs = useFournisseurs()
    await fournisseurs.lister()
    await fournisseurs.lire(1)
    await fournisseurs.creer({ nom: 'Primeur' })
    await fournisseurs.modifier(1, { nom: 'Nouveau nom' })

    expect(api.lire).toHaveBeenNthCalledWith(1, '/fournisseurs')
    expect(api.lire).toHaveBeenNthCalledWith(2, '/fournisseurs/1')
    expect(api.creer).toHaveBeenCalledWith('/fournisseurs', { nom: 'Primeur' })
    expect(api.modifier).toHaveBeenCalledWith('/fournisseurs/1', { nom: 'Nouveau nom' })
  })

  it('empêche la suppression d’un fournisseur lié à des approvisionnements', async () => {
    const api = {
      lire: vi.fn().mockResolvedValue([{ id: 5 }]),
      supprimer: vi.fn(),
    }
    vi.stubGlobal('useApi', () => api)

    await expect(useFournisseurs().supprimer(1)).rejects.toThrow(
      'Ce fournisseur a des approvisionnements, impossible à supprimer.',
    )
    expect(api.supprimer).not.toHaveBeenCalled()
  })
})

describe('fournisseurs : calculerTotalAppro', () => {
  it('somme correctement le total d’un approvisionnement', () => {
    const lignes = [
      { quantite: 2, prixUnitaire: 4.5 },
      { quantite: 3, prixUnitaire: 2.25 },
    ]

    expect(calculerTotalAppro(lignes)).toBe(15.75)
  })

  it('retourne 0 pour une liste vide', () => {
    expect(calculerTotalAppro([])).toBe(0)
  })
})

describe('approvisionnements : validation des lignes', () => {
  const ingredients = [{ id: 2, fournisseurId: 1 }, { id: 3, fournisseurId: 1 }]

  it('accepte les lignes valides avec une quantité décimale et un prix nul', () => {
    expect(validerLignesAppro(
      [{ ingredientId: 2, quantite: 0.5, prixUnitaire: 0 }],
      1,
      ingredients,
    )).toBeNull()
  })

  it.each([
    [[], 1, ingredients, 'Ajoutez au moins une ligne.'],
    [[{ ingredientId: null, quantite: 1, prixUnitaire: 1 }], 1, ingredients, 'Ligne 1 : choisissez un ingrédient.'],
    [[{ ingredientId: 2, quantite: 0, prixUnitaire: 1 }], 1, ingredients, 'Ligne 1 : la quantité doit être supérieure à zéro.'],
    [[{ ingredientId: 2, quantite: 1, prixUnitaire: null }], 1, ingredients, 'Ligne 1 : le prix doit être un nombre positif ou nul.'],
    [[{ ingredientId: 2, quantite: 1, prixUnitaire: -1 }], 1, ingredients, 'Ligne 1 : le prix doit être un nombre positif ou nul.'],
    [[{ ingredientId: 4, quantite: 1, prixUnitaire: 1 }], 1, ingredients, "Ligne 1 : cet ingrédient n'est pas proposé par le fournisseur choisi."],
  ])('rejette une entrée invalide', (lignes, fournisseurId, listeIngredients, message) => {
    expect(validerLignesAppro(lignes, fournisseurId, listeIngredients)).toBe(message)
  })
})

describe('approvisionnements : réception', () => {
  function creerApiReception({ echecMouvement = false } = {}) {
    const appro = {
      id: 8,
      statut: 'commande',
      lignes: [{ ingredientId: 2, quantite: 3 }],
    }
    const ingredient = { id: 2, nom: 'Riz', stock: 5 }
    const mouvements = []
    const api = {
      lire: vi.fn(async (chemin, parametres) => {
        if (chemin === '/approvisionnements/8') return { ...appro, lignes: [...appro.lignes] }
        if (chemin === '/ingredients/2') return { ...ingredient }
        if (chemin === '/mouvementsStock') return mouvements.filter(m => m.motif === parametres.motif)
        throw new Error(`Chemin inattendu : ${chemin}`)
      }),
      modifier: vi.fn(async (chemin, donnees) => {
        if (chemin === '/ingredients/2') Object.assign(ingredient, donnees)
        else if (chemin === '/approvisionnements/8') Object.assign(appro, donnees)
        else throw new Error(`Chemin inattendu : ${chemin}`)
      }),
      creer: vi.fn(async (chemin, donnees) => {
        if (echecMouvement) throw new Error('Échec du mouvement')
        mouvements.push({ id: mouvements.length + 1, ...donnees })
      }),
      supprimer: vi.fn(async (chemin) => {
        const id = Number(chemin.split('/').pop())
        const index = mouvements.findIndex(m => m.id === id)
        if (index >= 0) mouvements.splice(index, 1)
      }),
    }
    return { api, appro, ingredient, mouvements }
  }

  it('met à jour le stock et marque la commande reçue après création du mouvement', async () => {
    const { api, appro, ingredient, mouvements } = creerApiReception()
    vi.stubGlobal('useApi', () => api)

    await useFournisseurs().receptionner(appro)

    expect(ingredient.stock).toBe(8)
    expect(mouvements).toHaveLength(1)
    expect(appro.statut).toBe('recue')
  })

  it('restaure le stock si la création du mouvement échoue', async () => {
    const { api, appro, ingredient, mouvements } = creerApiReception({ echecMouvement: true })
    vi.stubGlobal('useApi', () => api)

    await expect(useFournisseurs().receptionner(appro)).rejects.toThrow('Les modifications ont été annulées')

    expect(ingredient.stock).toBe(5)
    expect(mouvements).toHaveLength(0)
    expect(appro.statut).toBe('commande')
  })
})

describe('fournisseurs : filtrerFournisseurs', () => {
  const fournisseurs = [
    { id: 1, nom: 'Primeur du Nord', categorie: 'fruit' },
    { id: 2, nom: 'Boulangerie de la Rue', categorie: 'boulangerie' },
    { id: 3, nom: 'Fromages du Sud', categorie: 'fruit' },
  ]

  it('filtre par recherche sans tenir compte de la casse', () => {
    const resultats = filtrerFournisseurs(fournisseurs, { recherche: 'rue' })
    expect(resultats).toHaveLength(1)
    expect(resultats[0].id).toBe(2)
  })

  it('filtre par catégorie et par recherche combinés', () => {
    const resultats = filtrerFournisseurs(fournisseurs, { recherche: 'du', categorie: 'fruit' })
    expect(resultats).toHaveLength(2)
    expect(resultats.map(f => f.nom)).toEqual(['Primeur du Nord', 'Fromages du Sud'])
  })
})
