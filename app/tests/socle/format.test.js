import { describe, it, expect } from 'vitest'
import { formaterPrix, formaterDate, formaterHeure } from '../../utils/format.js'

const normaliser = (texte) => texte.replace(/\s/g, ' ')

describe('formaterPrix', () => {
  it('formate les montants en dollars', () => {
    expect(normaliser(formaterPrix(0))).toBe('0,00 $')
    expect(normaliser(formaterPrix(11))).toBe('11,00 $')
    expect(normaliser(formaterPrix(1234.5))).toBe('1 234,50 $')
  })

  it('ne renvoie jamais NaN', () => {
    expect(formaterPrix(undefined)).toBe('—')
    expect(formaterPrix(null)).toBe('—')
    expect(formaterPrix('')).toBe('—')
    expect(formaterPrix('abc')).toBe('—')
    expect(formaterPrix(NaN)).toBe('—')
  })
})

describe('formaterDate', () => {
  it('ne décale pas une date seule d’un jour', () => {
    expect(formaterDate('2026-10-21')).toContain('21')
    expect(formaterDate('2026-10-21')).toContain('2026')
  })

  it('accepte une date avec heure', () => {
    expect(formaterDate('2026-10-21T12:05:00')).toContain('21')
  })

  it('renvoie un tiret si la date est absente ou invalide', () => {
    expect(formaterDate('')).toBe('—')
    expect(formaterDate(undefined)).toBe('—')
    expect(formaterDate('pas une date')).toBe('—')
  })
})

describe('formaterHeure', () => {
  it('affiche heures et minutes', () => {
    expect(formaterHeure('2026-10-21T12:05:00')).toBe('12:05')
  })

  it('renvoie un tiret si la date est invalide', () => {
    expect(formaterHeure('')).toBe('—')
  })
})
