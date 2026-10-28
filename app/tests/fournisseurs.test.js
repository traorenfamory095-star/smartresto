import { afterEach, describe, it, expect, vi } from 'vitest'
import { calculerTotalAppro, filtrerFournisseurs, useFournisseurs } from '../composables/useFournisseurs.js'

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
