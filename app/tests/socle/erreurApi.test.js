import { describe, it, expect } from 'vitest'
import { creerErreurApi } from '../../utils/erreurApi.js'

describe('creerErreurApi', () => {
  it('signale un serveur injoignable (aucun code HTTP)', () => {
    const erreur = creerErreurApi(new Error('fetch failed'))
    expect(erreur.statut).toBeNull()
    expect(erreur.message).toContain('npm run api')
  })

  it('traduit un 404', () => {
    const erreur = creerErreurApi({ statusCode: 404 })
    expect(erreur.statut).toBe(404)
    expect(erreur.message).toBe('Élément introuvable.')
  })

  it('traduit une erreur du serveur', () => {
    expect(creerErreurApi({ statusCode: 500 }).message).toContain('serveur')
  })

  it('mentionne le code des autres refus', () => {
    expect(creerErreurApi({ statusCode: 400 }).message).toContain('400')
  })

  it('renvoie toujours une Error qui garde la cause', () => {
    const origine = { statusCode: 404 }
    const erreur = creerErreurApi(origine)
    expect(erreur).toBeInstanceOf(Error)
    expect(erreur.cause).toBe(origine)
  })
})
