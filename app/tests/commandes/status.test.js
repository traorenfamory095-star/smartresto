import { describe, it, expect } from 'vitest'
import { changerStatutCommande } from '../../composables/useCommandes.js'

const fauxApi = (statut) => {
  const ecritures = []
  return {
    ecritures,
    lire: async () => ({ id: 5, statut }),
    modifier: async (chemin, champs) => { ecritures.push([chemin, champs]); return champs },
  }
}

describe('marquer servie', () => {
  it('passe de « prete » à « servie »', async () => {
    const api = fauxApi('prete')
    await changerStatutCommande(api, 5, 'servie')
    expect(api.ecritures).toEqual([['/commandes/5', { statut: 'servie' }]])
  })
  for (const statut of ['en_attente', 'en_preparation', 'servie', 'payee', 'annulee']) {
    it(`est refusé depuis « ${statut} »`, async () => {
      const api = fauxApi(statut)
      await expect(changerStatutCommande(api, 5, 'servie')).rejects.toThrow('Impossible de passer')
      expect(api.ecritures).toEqual([])
    })
  }
})

describe('annuler', () => {
  for (const statut of ['en_attente', 'en_preparation', 'prete', 'servie']) {
    it(`est possible depuis « ${statut} »`, async () => {
      const api = fauxApi(statut)
      await changerStatutCommande(api, 5, 'annulee')
      expect(api.ecritures).toEqual([['/commandes/5', { statut: 'annulee' }]])
    })
  }
  it('est refusé pour une commande payée, avec un message clair', async () => {
    const api = fauxApi('payee')
    await expect(changerStatutCommande(api, 5, 'annulee')).rejects.toThrow('payée ne peut pas être annulée')
    expect(api.ecritures).toEqual([])
  })
  it('est refusé pour une commande déjà annulée', async () => {
    await expect(changerStatutCommande(fauxApi('annulee'), 5, 'annulee')).rejects.toThrow()
  })
})