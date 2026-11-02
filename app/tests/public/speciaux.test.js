import { describe, it, expect } from 'vitest'
import { choisirSpeciaux } from '../../utils/speciaux.js'

const categories = [
  { id: 1, nom: 'Entrées' }, { id: 2, nom: 'Grillades' }, { id: 5, nom: 'Boissons' }, { id: 6, nom: 'Desserts' },
]
const plats = [
  { id: 1, nom: 'Salade', prix: 3.5, categorieId: 1, disponible: true },
  { id: 2, nom: 'Brochettes', prix: 8, categorieId: 2, disponible: true },
  { id: 3, nom: 'Eau minérale', prix: 1, categorieId: 5, disponible: true },
  { id: 4, nom: 'Mandazi', prix: 2, categorieId: 6, disponible: true },
  { id: 5, nom: 'Capitaine grillé', prix: 1.5, categorieId: 2, disponible: false },
  { id: 6, nom: 'Abricots', prix: 3.5, categorieId: 6, disponible: true },
]

describe('choisirSpeciaux', () => {
  it('trie par prix croissant', () => {
    expect(choisirSpeciaux(plats, categories).map((p) => p.id)).toEqual([4, 6, 1, 2])
  })
  it('exclut les boissons', () => {
    expect(choisirSpeciaux(plats, categories).some((p) => p.categorieId === 5)).toBe(false)
  })
  it('exclut les plats indisponibles, même très peu chers', () => {
    expect(choisirSpeciaux(plats, categories).some((p) => p.id === 5)).toBe(false)
  })
  it('à prix égal, ordre alphabétique', () => {
    const [, a, b] = choisirSpeciaux(plats, categories)
    expect([a.nom, b.nom]).toEqual(['Abricots', 'Salade'])
  })
  it('respecte la limite', () => {
    expect(choisirSpeciaux(plats, categories, 2)).toHaveLength(2)
  })
  it('ne plante pas sans données', () => {
    expect(choisirSpeciaux()).toEqual([])
    expect(choisirSpeciaux([], [])).toEqual([])
  })
  it('ne modifie pas la liste d’origine', () => {
    const copie = [...plats]
    choisirSpeciaux(plats, categories)
    expect(plats).toEqual(copie)
  })
})