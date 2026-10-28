import { describe, it, expect } from 'vitest'
import {
  ajouterAuPanier, changerQuantite, retirerDuPanier, changerRemarque,
  nombreArticles, tablesOccupees, problemesCommande, QUANTITE_MAX,
} from '../../composables/usePanier.js'
import { calculerTotal } from '../../composables/useCommandes.js'

const tilapia = { id: 13, nom: 'Tilapia entier', prix: 11 }
const cafe = { id: 17, nom: 'Café du Kivu', prix: 2 }

describe('ajouterAuPanier', () => {
  it('crée une ligne avec le prix copié du plat', () => {
    const [l] = ajouterAuPanier([], tilapia)
    expect(l).toEqual({ platId: 13, nom: 'Tilapia entier', prixUnitaire: 11, quantite: 1, remarque: '' })
  })
  it('augmente la quantité si le plat y est déjà, sans doublon', () => {
    const lignes = ajouterAuPanier(ajouterAuPanier([], tilapia), tilapia)
    expect(lignes).toHaveLength(1)
    expect(lignes[0].quantite).toBe(2)
  })
  it('ne modifie pas le tableau d’origine', () => {
    const avant = []
    ajouterAuPanier(avant, tilapia)
    expect(avant).toEqual([])
  })
})

describe('changerQuantite', () => {
  const base = ajouterAuPanier(ajouterAuPanier([], tilapia), cafe)
  it('met à jour la quantité', () => {
    expect(changerQuantite(base, 13, 3).find((l) => l.platId === 13).quantite).toBe(3)
  })
  it('retire la ligne à 0 ou en dessous', () => {
    expect(changerQuantite(base, 13, 0).map((l) => l.platId)).toEqual([17])
    expect(changerQuantite(base, 13, -2).map((l) => l.platId)).toEqual([17])
  })
  it('plafonne à la quantité maximale', () => {
    expect(changerQuantite(base, 13, 999).find((l) => l.platId === 13).quantite).toBe(QUANTITE_MAX)
  })
  it('ignore une valeur non numérique (retire la ligne)', () => {
    expect(changerQuantite(base, 13, 'abc').some((l) => l.platId === 13)).toBe(false)
  })
})

describe('retirer, remarque, total', () => {
  const lignes = changerQuantite(ajouterAuPanier(ajouterAuPanier([], tilapia), cafe), 17, 2)
  it('retire une ligne', () => {
    expect(retirerDuPanier(lignes, 13).map((l) => l.platId)).toEqual([17])
  })
  it('change la remarque d’une seule ligne', () => {
    const r = changerRemarque(lignes, 13, 'Grillé')
    expect(r.find((l) => l.platId === 13).remarque).toBe('Grillé')
    expect(r.find((l) => l.platId === 17).remarque).toBe('')
  })
  it('calcule le total et le nombre d’articles', () => {
    expect(calculerTotal(lignes)).toBe(15)
    expect(nombreArticles(lignes)).toBe(3)
  })
  it('un panier vide vaut 0, jamais NaN', () => {
    expect(calculerTotal([])).toBe(0)
    expect(nombreArticles([])).toBe(0)
  })
})

describe('tablesOccupees', () => {
  it('compte les commandes ni payées ni annulées', () => {
    const occ = tablesOccupees([
      { tableId: 1, statut: 'payee' },
      { tableId: 2, statut: 'annulee' },
      { tableId: 3, statut: 'prete' },
      { tableId: 4, statut: 'en_attente' },
      { tableId: 5, statut: 'servie' },
    ])
    expect([...occ].sort()).toEqual([3, 4, 5])
  })
})

describe('problemesCommande', () => {
  const lignes = ajouterAuPanier([], tilapia)
  it('accepte une commande complète', () => {
    expect(problemesCommande({ tableId: '7', lignes, nbCouverts: 2 }, new Set([3]))).toEqual([])
  })
  it('refuse sans table, sans plat ou sans couvert', () => {
    expect(problemesCommande({ tableId: '', lignes: [], nbCouverts: 0 })).toHaveLength(3)
  })
  it('refuse une table déjà occupée', () => {
    expect(problemesCommande({ tableId: '3', lignes, nbCouverts: 2 }, new Set([3]))).toEqual([
      'Cette table a déjà une commande en cours.',
    ])
  })
})