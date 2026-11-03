// ======================================================
// Fonctions métier pures
// Elles ne dépendent ni de Vue, ni de Nuxt, ni de l'API.
// Elles peuvent donc être testées directement avec Vitest.
// ======================================================

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculerMontants,
  genererNumeroFacture,
  resteAPayer,
  totalPaiements,
} from '../../composables/useFactures.js'

describe('Module Factures', () => {
  describe('calculerMontants', () => {
    it('calcule correctement un total sans remise', () => {
      const lignes = [
        {
          prixUnitaire: 5,
          quantite: 2,
        },
        {
          prixUnitaire: 10,
          quantite: 1,
        },
      ]

      const resultat =
        calculerMontants(lignes, 0, 16)

      expect(resultat).toEqual({
        sousTotal: 20,
        remise: 0,
        taxe: 3.2,
        total: 23.2,
      })
    })

    it('calcule correctement une remise de 10 %', () => {
      const lignes = [
        {
          prixUnitaire: 15,
          quantite: 1,
        },
      ]

      const resultat =
        calculerMontants(lignes, 10, 16)

      expect(resultat).toEqual({
        sousTotal: 15,
        remise: 1.5,
        taxe: 2.16,
        total: 15.66,
      })
    })
  })

  describe('paiements', () => {
    it('additionne plusieurs paiements', () => {
      const paiements = [
        {
          montant: 19.14,
        },
        {
          montant: 19.14,
        },
      ]

      expect(
        totalPaiements(paiements)
      ).toBe(38.28)
    })

    it('calcule le reste à payer', () => {
      const paiements = [
        {
          montant: 10,
        },
      ]

      expect(
        resteAPayer(23.2, paiements)
      ).toBe(13.2)
    })
  })

  describe('genererNumeroFacture', () => {
    it('génère le numéro suivant', () => {
      const factures = [
        {
          numero: 'F-2026-0001',
        },
        {
          numero: 'F-2026-0019',
        },
      ]

      expect(
        genererNumeroFacture(
          factures,
          2026
        )
      ).toBe('F-2026-0020')
    })

    it('utilise le plus grand numéro même avec des trous', () => {
      const factures = [
        {
          numero: 'F-2026-0001',
        },
        {
          numero: 'F-2026-0004',
        },
      ]

      expect(
        genererNumeroFacture(
          factures,
          2026
        )
      ).toBe('F-2026-0005')
    })
  })
})