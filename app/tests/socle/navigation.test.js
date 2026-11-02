import { describe, it, expect } from 'vitest'
import {
  choisirLayout, lienActif, titreDeRoute, initiales, libelleRole,
} from '../../app/utils/navigation.js'

describe('choisirLayout', () => {
  it('pages publiques', () => {
    expect(choisirLayout('/carte')).toBe('public')
    expect(choisirLayout('/carte/')).toBe('public')
    expect(choisirLayout('/contact')).toBe('public')
  })
  it('connexion sans habillage', () => {
    expect(choisirLayout('/connexion')).toBe('vierge')
    expect(choisirLayout('/connexion?espace=administration')).toBe('vierge')
  })
  it('pages du personnel', () => {
    expect(choisirLayout('/')).toBe('default')
    expect(choisirLayout('/plats/nouveau')).toBe('default')
  })
  it('pas de faux positif sur un préfixe proche', () => {
    expect(choisirLayout('/carte-speciale')).toBe('default')
  })
})

describe('lienActif', () => {
  it('route exacte et sous-route', () => {
    expect(lienActif('/plats', '/plats')).toBe(true)
    expect(lienActif('/plats/12', '/plats')).toBe(true)
  })
  it("'/' n'est actif que sur '/'", () => {
    expect(lienActif('/', '/')).toBe(true)
    expect(lienActif('/plats', '/')).toBe(false)
  })
  it('pas de faux positif', () => {
    expect(lienActif('/plats-speciaux', '/plats')).toBe(false)
  })
})

describe('titreDeRoute', () => {
  it('route connue et sous-route', () => {
    expect(titreDeRoute('/categories')[0]).toBe('Catégories')
    expect(titreDeRoute('/stock/mouvements')[0]).toBe('Stock')
  })
  it('route inconnue : titre par défaut', () => {
    expect(titreDeRoute('/inconnue')[0]).toBe('Tableau de bord')
  })
})

describe('initiales', () => {
  it('un ou plusieurs mots, ou vide', () => {
    expect(initiales('Neema Bahati')).toBe('NB')
    expect(initiales('Administrateur')).toBe('A')
    expect(initiales('')).toBe('?')
    expect(initiales(undefined)).toBe('?')
  })
})

describe('libelleRole', () => {
  it('rôles connus, absent et inconnu', () => {
    expect(libelleRole('gerant')).toBe('Gérant')
    expect(libelleRole(undefined)).toBe('Invité')
    expect(libelleRole('stagiaire')).toBe('stagiaire')
  })
})