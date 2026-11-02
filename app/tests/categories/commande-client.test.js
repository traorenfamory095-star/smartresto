import { describe, expect, it, vi } from 'vitest'
import {
  creerServiceCommandeClient,
  validerConfirmation,
  verifierDisponibilite,
} from '../../composables/useCategories.js'

const lignesInitiales = [
  { platId: 7, nom: 'Poulet braisé', prixUnitaire: 9.5, quantite: 2, remarque: '' },
]

function creerPanier() {
  const lignes = { value: lignesInitiales.map((ligne) => ({ ...ligne })) }
  return {
    lignes,
    total: { value: 19 },
    nbArticles: { value: 2 },
    vider: vi.fn(() => {
      lignes.value = []
    }),
  }
}

describe('commande client : disponibilités et validation', () => {
  it('signale les plats absents ou indisponibles au dernier contrôle', () => {
    const lignes = [
      { platId: 1, nom: 'Poisson' },
      { platId: 2, nom: 'Poulet' },
    ]

    expect(verifierDisponibilite(lignes, [
      { id: 1, disponible: false },
      { id: 3, disponible: true },
    ])).toEqual(lignes)
  })

  it('valide une table active, la capacité et les couverts', () => {
    expect(validerConfirmation(
      { tableId: 4, nbCouverts: 3, note: '' },
      [{ id: 4, actif: true, capacite: 4 }],
    )).toEqual({})
  })

  it('refuse une table inactive et un nombre de couverts supérieur à sa capacité', () => {
    expect(validerConfirmation(
      { tableId: 4, nbCouverts: 3, note: '' },
      [{ id: 4, actif: false, capacite: 2 }],
    )).toEqual({
      tableId: "Cette table n'est pas disponible.",
      nbCouverts: 'Cette table accueille au maximum 2 personnes.',
    })
  })
})

describe('commande client : création', () => {
  it('crée la commande avec le panier, vide le panier après succès et notifie', async () => {
    const panier = creerPanier()
    const creerCommande = vi.fn(async () => ({ id: 31 }))
    const notifier = { succes: vi.fn(), erreur: vi.fn() }
    const service = creerServiceCommandeClient({
      panier,
      creerCommande,
      notifier,
      lirePlats: vi.fn(async () => [{ id: 7, disponible: true }]),
      lireServeurId: () => 12,
    })

    const resultat = await service.confirmer({
      tableId: '4',
      nbCouverts: '2',
      note: 'Sans piment',
    })

    expect(creerCommande).toHaveBeenCalledExactlyOnceWith({
      tableId: 4,
      serveurId: 12,
      nbCouverts: 2,
      note: 'Sans piment',
      lignes: lignesInitiales,
    })
    expect(panier.vider).toHaveBeenCalledOnce()
    expect(notifier.succes).toHaveBeenCalledExactlyOnceWith('Commande #31 enregistrée.')
    expect(notifier.erreur).not.toHaveBeenCalled()
    expect(resultat).toMatchObject({
      commande: { id: 31 },
      resume: { total: 19, nbArticles: 2, tableId: 4 },
    })
  })

  it('conserve le panier et notifie quand la création échoue', async () => {
    const panier = creerPanier()
    const erreur = new Error('Échec réseau')
    const notifier = { succes: vi.fn(), erreur: vi.fn() }
    const service = creerServiceCommandeClient({
      panier,
      creerCommande: vi.fn(async () => { throw erreur }),
      notifier,
      lirePlats: vi.fn(async () => [{ id: 7, disponible: true }]),
      lireServeurId: () => 12,
    })

    const resultat = await service.confirmer({ tableId: 4, nbCouverts: 2 })

    expect(resultat.erreur).toBe(erreur)
    expect(panier.vider).not.toHaveBeenCalled()
    expect(panier.lignes.value).toEqual(lignesInitiales)
    expect(notifier.erreur).toHaveBeenCalledExactlyOnceWith(erreur)
    expect(notifier.succes).not.toHaveBeenCalled()
  })

  it('ne crée pas la commande si un plat est devenu indisponible', async () => {
    const panier = creerPanier()
    const creerCommande = vi.fn()
    const notifier = { succes: vi.fn(), erreur: vi.fn() }
    const service = creerServiceCommandeClient({
      panier,
      creerCommande,
      notifier,
      lirePlats: vi.fn(async () => [{ id: 7, disponible: false }]),
      lireServeurId: () => 12,
    })

    const resultat = await service.confirmer({ tableId: 4, nbCouverts: 2 })

    expect(resultat.indisponibles).toEqual(lignesInitiales)
    expect(creerCommande).not.toHaveBeenCalled()
    expect(panier.vider).not.toHaveBeenCalled()
  })
})
