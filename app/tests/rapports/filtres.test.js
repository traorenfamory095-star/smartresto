import { describe, it, expect } from 'vitest'

describe('Rapports - Filtrage des commandes', () => {
  it('filtre les commandes pour la période "aujourd\'hui"', () => {
    const maintenant = new Date()
    const autreJour = new Date()
    autreJour.setDate(maintenant.getDate() - 5) // Il y a 5 jours

    const commandes = [
      { id: 1, creeLe: maintenant.toISOString(), total: 100 },
      { id: 2, creeLe: autreJour.toISOString(), total: 250 }
    ]

    // Simulation du filtre "aujourd'hui"
    const commandesAujourdhui = commandes.filter(cmd => {
      const dateCmd = new Date(cmd.creeLe)
      return dateCmd.toDateString() === maintenant.toDateString()
    })

    expect(commandesAujourdhui.length).toBe(1)
    expect(commandesAujourdhui[0].id).toBe(1)
    expect(commandesAujourdhui[0].total).toBe(100)
  })
})