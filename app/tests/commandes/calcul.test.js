import { describe, it, expect } from 'vitest'
import {
  enCentimes, calculerTotal, estOuverte, assemblerCommandes, filtrerCommandes,
} from '../../composables/useCommandes.js'

describe('calculerTotal', () => {
  it('additionne quantité × prix unitaire', () => {
    expect(calculerTotal([{ quantite: 2, prixUnitaire: 4.5 }, { quantite: 1, prixUnitaire: 3 }])).toBe(12)
  })
  it("n'accumule pas d'erreur d'arrondi (0.1 + 0.2)", () => {
    expect(calculerTotal([{ quantite: 1, prixUnitaire: 0.1 }, { quantite: 1, prixUnitaire: 0.2 }])).toBe(0.3)
    expect(calculerTotal(Array(3).fill({ quantite: 1, prixUnitaire: 0.1 }))).toBe(0.3)
  })
  it('renvoie 0 pour un panier vide, jamais NaN', () => {
    expect(calculerTotal([])).toBe(0)
    expect(calculerTotal()).toBe(0)
    expect(calculerTotal([{ quantite: 'x', prixUnitaire: undefined }])).toBe(0)
  })
  it('enCentimes arrondit', () => {
    expect(enCentimes(0.29)).toBe(29)
    expect(enCentimes(19.99)).toBe(1999)
  })
})

describe('estOuverte', () => {
  it('une commande payée ou annulée est fermée', () => {
    expect(estOuverte({ statut: 'payee' })).toBe(false)
    expect(estOuverte({ statut: 'annulee' })).toBe(false)
    expect(estOuverte({ statut: 'prete' })).toBe(true)
  })
})

const donnees = {
  commandes: [
    { id: 1, tableId: 6, serveurId: 3, statut: 'payee', creeLe: '2026-10-12T12:40:00', note: '' },
    { id: 2, tableId: 9, serveurId: 4, statut: 'en_attente', creeLe: '2026-10-21T12:55:00', note: 'Allergie aux arachides' },
    { id: 3, tableId: 6, serveurId: 3, statut: 'annulee', creeLe: '2026-10-18T20:10:00', note: '' },
  ],
  lignes: [
    { id: 1, commandeId: 1, quantite: 1, prixUnitaire: 4.5 },
    { id: 2, commandeId: 1, quantite: 2, prixUnitaire: 2 },
    { id: 3, commandeId: 2, quantite: 2, prixUnitaire: 3 },
  ],
  tables: [{ id: 6, numero: 6 }, { id: 9, numero: 9 }],
  employes: [{ id: 3, nom: 'Amani Kasereka' }, { id: 4, nom: 'Zawadi Mukeni' }],
}

describe('assemblerCommandes', () => {
  const liste = assemblerCommandes(donnees)
  it('rattache lignes, table, serveur, total et nombre d’articles', () => {
    expect(liste[0]).toMatchObject({ total: 8.5, nbArticles: 3 })
    expect(liste[0].table.numero).toBe(6)
    expect(liste[0].serveur.nom).toBe('Amani Kasereka')
  })
  it('gère une commande sans ligne et une table inconnue', () => {
    const [c] = assemblerCommandes({ ...donnees, commandes: [{ id: 9, tableId: 99, serveurId: 99, statut: 'en_attente', creeLe: '2026-10-21T10:00:00' }] })
    expect(c).toMatchObject({ total: 0, nbArticles: 0, table: null, serveur: null })
  })
})

describe('filtrerCommandes', () => {
  const liste = assemblerCommandes(donnees)
  const ids = (l) => l.map((c) => c.id)
  it('trie les plus récentes d’abord', () => {
    expect(ids(filtrerCommandes(liste))).toEqual([2, 3, 1])
  })
  it('filtre par statut, table et date', () => {
    expect(ids(filtrerCommandes(liste, { statut: 'annulee' }))).toEqual([3])
    expect(ids(filtrerCommandes(liste, { tableId: '6' }))).toEqual([3, 1])
    expect(ids(filtrerCommandes(liste, { date: '2026-10-21' }))).toEqual([2])
  })
  it('combine les filtres', () => {
    expect(ids(filtrerCommandes(liste, { tableId: 6, statut: 'payee' }))).toEqual([1])
    expect(filtrerCommandes(liste, { tableId: 9, statut: 'payee' })).toEqual([])
  })
  it('recherche sans tenir compte des accents ni de la casse', () => {
    expect(ids(filtrerCommandes(liste, { recherche: 'ZAWADI' }))).toEqual([2])
    expect(ids(filtrerCommandes(liste, { recherche: 'allergie' }))).toEqual([2])
    expect(ids(filtrerCommandes(liste, { recherche: 'table 6' }))).toEqual([3, 1])
  })
})