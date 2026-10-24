// Exemple de structure d'un test : décrire (describe), cas (it), vérification (expect).
// Chaque module met ses tests dans tests/<module>/ ; lancer avec : npm test
import { describe, it, expect } from 'vitest'
import { formaterPrix } from '../utils/format.js'

describe('exemple : formaterPrix', () => {
  it('affiche un prix en dollars avec deux décimales', () => {
    // replace : l'espace avant « $ » est insécable, on le normalise pour comparer.
    expect(formaterPrix(9.5).replace(/\s/g, ' ')).toBe('9,50 $')
  })
})
