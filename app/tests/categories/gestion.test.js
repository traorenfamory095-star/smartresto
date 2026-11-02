import { describe, expect, it } from 'vitest'
import {
  compterPlatsParCategorie,
  echangerOrdre,
  libellePlats,
  peutSupprimer,
  trierParOrdre,
  validerCategorie,
} from '../../composables/useCategories.js'

const categories = [
  { id: 2, nom: 'Grillades', ordre: 2 },
  { id: 1, nom: 'Entrées', ordre: 1 },
  { id: 3, nom: 'Desserts', ordre: 3 },
]

describe('categories : compterPlatsParCategorie', () => {
  it('compte tous les plats, y compris ceux qui sont indisponibles', () => {
    expect(compterPlatsParCategorie([
      { id: 1, categorieId: 2, disponible: true },
      { id: 2, categorieId: 2, disponible: false },
      { id: 3, categorieId: 1, disponible: true },
    ])).toEqual({ 1: 1, 2: 2 })
  })
})

describe('categories : trierParOrdre', () => {
  it('renvoie les catégories triées sans modifier la liste source', () => {
    expect(trierParOrdre(categories).map((categorie) => categorie.id)).toEqual([1, 2, 3])
    expect(categories.map((categorie) => categorie.id)).toEqual([2, 1, 3])
  })
})

describe('categories : echangerOrdre', () => {
  it('échange l’ordre de deux catégories adjacentes', () => {
    expect(echangerOrdre(categories, 2, 'monter')).toEqual([
      { id: 2, nom: 'Grillades', ordre: 1 },
      { id: 1, nom: 'Entrées', ordre: 2 },
    ])
  })

  it('ne permet pas de déplacer la première catégorie vers le haut', () => {
    expect(echangerOrdre(categories, 1, 'monter')).toBeNull()
  })

  it('ne permet pas de déplacer la dernière catégorie vers le bas', () => {
    expect(echangerOrdre(categories, 3, 'descendre')).toBeNull()
  })
})

describe('categories : validerCategorie', () => {
  it('rejette un nom vide', () => {
    expect(validerCategorie(
      { nom: '  ', ordre: 4 },
      categories,
    )).toMatchObject({ nom: 'Name is required.' })
  })

  it('rejette les doublons de noms sans tenir compte de la casse et des accents', () => {
    expect(validerCategorie(
      { nom: ' entreeS ', ordre: 4 },
      categories,
    )).toMatchObject({ nom: 'A category with this name already exists.' })
  })

  it('n’indique pas de faux doublon pour la catégorie modifiée', () => {
    expect(validerCategorie(
      { nom: 'Entrées', ordre: 1 },
      categories,
      1,
    )).toEqual({})
  })

  it('rejette un ordre utilisé par une autre catégorie', () => {
    expect(validerCategorie(
      { nom: 'Nouvelle', ordre: 2 },
      categories,
    )).toMatchObject({ ordre: 'This order is already used.' })
  })

  it.each([0, -1, 1.5, 'abc', ''])('rejette un ordre invalide (%s)', (ordre) => {
    expect(validerCategorie(
      { nom: 'Nouvelle', ordre },
      categories,
    )).toMatchObject({
      ordre: 'Order must be an integer greater than or equal to 1.',
    })
  })
})

describe('categories : règles de suppression et libellé', () => {
  it('autorise la suppression uniquement si la catégorie est vide', () => {
    expect(peutSupprimer(0)).toBe(true)
    expect(peutSupprimer(1)).toBe(false)
  })

  it('formate le nombre de plats au singulier et au pluriel', () => {
    expect(libellePlats(0)).toBe('0 dishes')
    expect(libellePlats(1)).toBe('1 dish')
    expect(libellePlats(6)).toBe('6 dishes')
  })
})
