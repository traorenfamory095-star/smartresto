import { describe, it, expect } from 'vitest'
import { validerContact, contactValide, SUJETS_CONTACT, MESSAGE_MIN, MESSAGE_MAX } from '../../utils/contact.js'
import { lienTelephone, RESTAURANT } from '../../utils/restaurant.js'

const correct = {
  nom: 'Aline Mbuyi',
  email: 'aline@exemple.com',
  sujet: 'reservation',
  message: 'Bonjour, avez-vous une table pour six personnes samedi ?',
}

describe('validerContact', () => {
  it('accepte un formulaire correct', () => {
    expect(contactValide(validerContact(correct))).toBe(true)
  })
  it('refuse un formulaire vide, avec une erreur par champ', () => {
    const erreurs = validerContact({})
    expect(Object.values(erreurs).every(Boolean)).toBe(true)
  })
  it('refuse un nom d’un seul caractère ou fait d’espaces', () => {
    expect(validerContact({ ...correct, nom: 'A' }).nom).not.toBe('')
    expect(validerContact({ ...correct, nom: '    ' }).nom).not.toBe('')
  })
  it('vérifie l’e-mail', () => {
    for (const mauvais of ['aline', 'aline@', 'aline@exemple', '@exemple.com', 'a l@exemple.com']) {
      expect(validerContact({ ...correct, email: mauvais }).email).not.toBe('')
    }
    expect(validerContact({ ...correct, email: '  aline@exemple.com ' }).email).toBe('')
  })
  it('refuse un sujet qui n’est pas dans la liste', () => {
    expect(validerContact({ ...correct, sujet: 'piratage' }).sujet).not.toBe('')
    for (const s of SUJETS_CONTACT) expect(validerContact({ ...correct, sujet: s.valeur }).sujet).toBe('')
  })
  it('impose la longueur du message, espaces de début et de fin ignorés', () => {
    expect(validerContact({ ...correct, message: 'x'.repeat(MESSAGE_MIN - 1) }).message).not.toBe('')
    expect(validerContact({ ...correct, message: `   ${'x'.repeat(MESSAGE_MIN - 1)}   ` }).message).not.toBe('')
    expect(validerContact({ ...correct, message: 'x'.repeat(MESSAGE_MIN) }).message).toBe('')
    expect(validerContact({ ...correct, message: 'x'.repeat(MESSAGE_MAX) }).message).toBe('')
    expect(validerContact({ ...correct, message: 'x'.repeat(MESSAGE_MAX + 1) }).message).not.toBe('')
  })
  it('ne plante pas sans argument', () => {
    expect(() => validerContact()).not.toThrow()
  })
})

describe('lienTelephone', () => {
  it('retire les espaces et garde le « + »', () => {
    expect(lienTelephone('+243 995 221 410')).toBe('tel:+243995221410')
  })
  it('gère un numéro sans « + »', () => {
    expect(lienTelephone('0995 221 410')).toBe('tel:0995221410')
  })
  it('renvoie une chaîne vide si le numéro est vide ou sans chiffre', () => {
    expect(lienTelephone('')).toBe('')
    expect(lienTelephone()).toBe('')
    expect(lienTelephone('abc')).toBe('')
  })
  it('le téléphone du restaurant donne un lien valide', () => {
    expect(lienTelephone(RESTAURANT.telephone)).toMatch(/^tel:\+?\d+$/)
  })
})