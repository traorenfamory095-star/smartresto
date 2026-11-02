import { describe, it, expect } from 'vitest'

describe('Rapports - Calculs financiers', () => {
  it('calcule correctement le chiffre d\'affaires total à partir d\'une liste de factures/commandes', () => {
    const commandesFiltrees = [
      { id: 1, total: 150 },
      { id: 2, total: 200 },
      { id: 3, total: 50 }
    ]

    const caTotal = commandesFiltrees.reduce((acc, cmd) => acc + cmd.total, 0)

    expect(caTotal).toBe(400)
  })

  it('calcule correctement le ticket moyen', () => {
    const chiffreAffaires = 400
    const nombreCommandes = 4

    const ticketMoyen = nombreCommandes > 0 ? chiffreAffaires / nombreCommandes : 0

    expect(ticketMoyen).toBe(100)
  })

  it('gère correctement un nombre de commandes égal à zéro pour éviter une division par zéro', () => {
    const chiffreAffaires = 0
    const nombreCommandes = 0

    const ticketMoyen = nombreCommandes > 0 ? chiffreAffaires / nombreCommandes : 0

    expect(ticketMoyen).toBe(0)
  })
})