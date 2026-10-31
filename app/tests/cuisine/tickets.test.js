import { describe, expect, it } from 'vitest'
import {
  assemblerTicketsCuisine,
  toutesLignesCuisinePretes,
  transitionLigneCuisineValide,
} from '../../composables/useCuisine.js'

const donnees = {
  commandes: [
    { id: 1, tableId: 7, statut: 'en_preparation', creeLe: '2026-10-28T12:00:00', note: '' },
    { id: 2, tableId: 9, statut: 'en_attente', creeLe: '2026-10-28T12:30:00', note: 'Allergie' },
    { id: 3, tableId: 1, statut: 'prete', creeLe: '2026-10-28T11:00:00', note: '' },
    { id: 4, tableId: 2, statut: 'payee', creeLe: '2026-10-28T10:00:00', note: '' },
  ],
  lignes: [
    { id: 10, commandeId: 1, platId: 5, quantite: 2, statutCuisine: 'en_preparation', remarque: 'Sans piment' },
    { id: 11, commandeId: 1, platId: 14, quantite: 1, statutCuisine: 'prete', remarque: '' },
    { id: 12, commandeId: 2, platId: 99, quantite: 1, statutCuisine: 'en_attente', remarque: '' },
  ],
  plats: [{ id: 5, nom: 'Brochettes de chèvre' }, { id: 14, nom: 'Primus' }],
  tables: [{ id: 7, numero: 7 }, { id: 9, numero: 9 }],
}

describe('assemblerTicketsCuisine', () => {
  it('assemble tickets, lignes, plats et tables et exclut les commandes terminées', () => {
    const tickets = assemblerTicketsCuisine(donnees)

    expect(tickets.map((ticket) => ticket.id)).toEqual([3, 1, 2])
    expect(tickets[1]).toMatchObject({
      table: { numero: 7 },
      lignesPretes: 1,
      lignes: [
        { plat: { nom: 'Brochettes de chèvre' }, remarque: 'Sans piment' },
        { plat: { nom: 'Primus' } },
      ],
    })
  })

  it('garde visibles les plats introuvables et accepte des collections absentes', () => {
    expect(assemblerTicketsCuisine({ commandes: donnees.commandes.slice(1, 2), lignes: donnees.lignes.slice(2) })[0].lignes[0].plat)
      .toBeNull()
    expect(assemblerTicketsCuisine()).toEqual([])
  })

  it('ne modifie pas les données reçues', () => {
    const original = JSON.stringify(donnees)
    assemblerTicketsCuisine(donnees)
    expect(JSON.stringify(donnees)).toBe(original)
  })
})

describe('transitions des lignes de cuisine', () => {
  it('autorise uniquement les transitions suivantes, sans retour arrière', () => {
    expect(transitionLigneCuisineValide('en_attente', 'en_preparation')).toBe(true)
    expect(transitionLigneCuisineValide('en_preparation', 'prete')).toBe(true)
    expect(transitionLigneCuisineValide('en_attente', 'prete')).toBe(false)
    expect(transitionLigneCuisineValide('prete', 'en_preparation')).toBe(false)
    expect(transitionLigneCuisineValide('inconnu', 'prete')).toBe(false)
  })

  it('ne marque le ticket prêt que si au moins une ligne existe et si toutes sont prêtes', () => {
    expect(toutesLignesCuisinePretes([{ statutCuisine: 'prete' }, { statutCuisine: 'prete' }])).toBe(true)
    expect(toutesLignesCuisinePretes([{ statutCuisine: 'prete' }, { statutCuisine: 'en_attente' }])).toBe(false)
    expect(toutesLignesCuisinePretes([])).toBe(false)
    expect(toutesLignesCuisinePretes(null)).toBe(false)
  })
})