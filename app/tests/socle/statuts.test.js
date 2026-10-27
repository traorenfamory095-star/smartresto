import { describe, it, expect } from 'vitest'
import { infoStatut, transitionCommandeValide, STATUTS, ORDRE_COMMANDE } from '../../utils/statuts.js'

describe('infoStatut', () => {
  it('donne le libellé et le ton d’un statut connu', () => {
    expect(infoStatut('commande', 'prete')).toEqual({ libelle: 'Prête', ton: 'succes' })
    expect(infoStatut('facture', 'emise').libelle).toBe('Émise')
  })

  it('ne plante pas sur un statut ou un type inconnu', () => {
    expect(infoStatut('commande', 'bizarre')).toEqual({ libelle: 'bizarre', ton: 'neutre' })
    expect(infoStatut('inconnu', 'x').ton).toBe('neutre')
    expect(infoStatut('commande', undefined).libelle).toBe('—')
  })

  it('couvre tous les statuts du cycle de vie d’une commande', () => {
    for (const statut of [...ORDRE_COMMANDE, 'annulee']) {
      expect(STATUTS.commande[statut]).toBeDefined()
    }
  })
})

describe('transitionCommandeValide', () => {
  it('autorise chaque étape du cycle, dans l’ordre', () => {
    expect(transitionCommandeValide('en_attente', 'en_preparation')).toBe(true)
    expect(transitionCommandeValide('en_preparation', 'prete')).toBe(true)
    expect(transitionCommandeValide('prete', 'servie')).toBe(true)
    expect(transitionCommandeValide('servie', 'payee')).toBe(true)
  })

  it('refuse de sauter une étape ou de reculer', () => {
    expect(transitionCommandeValide('en_attente', 'prete')).toBe(false)
    expect(transitionCommandeValide('prete', 'en_attente')).toBe(false)
    expect(transitionCommandeValide('en_attente', 'payee')).toBe(false)
  })

  it('autorise l’annulation avant « payee » seulement', () => {
    expect(transitionCommandeValide('en_attente', 'annulee')).toBe(true)
    expect(transitionCommandeValide('servie', 'annulee')).toBe(true)
    expect(transitionCommandeValide('payee', 'annulee')).toBe(false)
    expect(transitionCommandeValide('annulee', 'annulee')).toBe(false)
  })

  it('refuse les statuts inconnus', () => {
    expect(transitionCommandeValide('bizarre', 'prete')).toBe(false)
    expect(transitionCommandeValide('prete', 'bizarre')).toBe(false)
  })
})
