import { describe, it, expect } from 'vitest'
import { calculerTotalAppro, filtrerFournisseurs } from '../composables/useFournisseurs.js'

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
