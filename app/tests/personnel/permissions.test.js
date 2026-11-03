import { describe, it, expect } from 'vitest'
import {
  normaliserChemin, estRouteLibre, rolePeut, redirectionSure,
} from '../../utils/permissions.js'

describe('normaliserChemin', () => {
  it('accepte un nom de module ou un chemin', () => {
    expect(normaliserChemin('plats')).toBe('/plats')
    expect(normaliserChemin('/plats/')).toBe('/plats')
    expect(normaliserChemin('/plats/3?onglet=2')).toBe('/plats/3')
    expect(normaliserChemin('')).toBe('/')
  })
})

describe('estRouteLibre', () => {
  it('le site public et la connexion sont libres', () => {
    for (const chemin of ['/', '/carte', '/a-propos', '/speciaux', '/contact', '/reserver', '/connexion']) {
      expect(estRouteLibre(chemin)).toBe(true)
    }
  })
  it("l'administration ne l'est pas", () => {
    expect(estRouteLibre('/plats')).toBe(false)
    expect(estRouteLibre('/tableau-de-bord')).toBe(false)
    expect(estRouteLibre('/carte-speciale')).toBe(false)
  })
})

describe('rolePeut', () => {
  it('admin et gérant accèdent à tout', () => {
    for (const role of ['admin', 'gerant']) {
      expect(rolePeut(role, '/rapports')).toBe(true)
      expect(rolePeut(role, '/personnel/3')).toBe(true)
      expect(rolePeut(role, 'stock')).toBe(true)
    }
  })

  it('serveur : commandes, carte, tables, réservations', () => {
    expect(rolePeut('serveur', '/commandes/nouvelle')).toBe(true)
    expect(rolePeut('serveur', 'tables')).toBe(true)
    expect(rolePeut('serveur', '/reservations')).toBe(true)
    expect(rolePeut('serveur', '/rapports')).toBe(false)
    expect(rolePeut('serveur', '/personnel')).toBe(false)
    expect(rolePeut('serveur', '/factures')).toBe(false)
  })

  it('cuisinier : cuisine et carte', () => {
    expect(rolePeut('cuisinier', '/cuisine')).toBe(true)
    expect(rolePeut('cuisinier', '/carte')).toBe(true)
    expect(rolePeut('cuisinier', '/commandes')).toBe(false)
    expect(rolePeut('cuisinier', '/stock')).toBe(false)
  })

  it('caissier : factures, et commandes en lecture seulement', () => {
    expect(rolePeut('caissier', '/factures/nouvelle')).toBe(true)
    expect(rolePeut('caissier', '/commandes')).toBe(true)
    expect(rolePeut('caissier', '/commandes/12')).toBe(true)
    expect(rolePeut('caissier', '/commandes/nouvelle')).toBe(false)
    expect(rolePeut('caissier', '/plats')).toBe(false)
  })

  it('tout le personnel voit le tableau de bord', () => {
    for (const role of ['admin', 'gerant', 'serveur', 'cuisinier', 'caissier']) {
      expect(rolePeut(role, '/tableau-de-bord')).toBe(true)
    }
  })

  it('un rôle inconnu ne voit que les pages libres', () => {
    expect(rolePeut('pirate', '/plats')).toBe(false)
    expect(rolePeut(undefined, '/carte')).toBe(true)
  })

  it("pas de faux positif sur un préfixe proche", () => {
    expect(rolePeut('serveur', '/tables-privees')).toBe(false)
  })
})

describe('redirectionSure', () => {
  it('garde un chemin interne', () => {
    expect(redirectionSure('/plats/3')).toBe('/plats/3')
  })
  it('refuse une adresse externe ou absente', () => {
    expect(redirectionSure('//pirate.example')).toBe('/tableau-de-bord')
    expect(redirectionSure('https://pirate.example')).toBe('/tableau-de-bord')
    expect(redirectionSure(undefined)).toBe('/tableau-de-bord')
    expect(redirectionSure('/connexion')).toBe('/tableau-de-bord')
  })
})
