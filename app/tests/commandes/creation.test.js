import { describe, it, expect } from 'vitest'
import { creerCommandeAvecLignes, maintenantLocal } from '../../composables/useCommandes.js'

const donnees = {
  tableId: '4',
  serveurId: 3,
  nbCouverts: 2,
  note: 'Allergie',
  lignes: [
    { platId: 13, quantite: 2, prixUnitaire: 11, remarque: 'Grillé' },
    { platId: 17, quantite: 1, prixUnitaire: 2, remarque: '' },
    { platId: 5, quantite: 1, prixUnitaire: 8, remarque: '' },
  ],
}

// Faux serveur en mémoire : on peut lui dire de refuser la N-ième création de ligne.
function fauxApi({ echecLigne = null, echecSuppression = false, commandesDeLaTable = [] } = {}) {
  const journal = { crees: [], supprimes: [] }
  let compteLignes = 0
  return {
    journal,
    async lire() { return commandesDeLaTable },
    async creer(chemin, corps) {
      if (chemin === '/lignesCommande') {
        compteLignes += 1
        if (compteLignes === echecLigne) throw new Error('500')
      }
      const cree = { id: 100 + journal.crees.length, ...corps }
      journal.crees.push({ chemin, ...cree })
      return cree
    },
    async supprimer(chemin) {
      if (echecSuppression) throw new Error('500')
      journal.supprimes.push(chemin)
    },
  }
}

describe('creerCommandeAvecLignes : succès', () => {
  it('crée la commande puis toutes ses lignes, en attente', async () => {
    const api = fauxApi()
    const c = await creerCommandeAvecLignes(api, donnees)
    const crees = api.journal.crees
    expect(crees[0]).toMatchObject({ chemin: '/commandes', statut: 'en_attente', tableId: 4, serveurId: 3, nbCouverts: 2 })
    expect(crees.filter((x) => x.chemin === '/lignesCommande')).toHaveLength(3)
    expect(crees[1]).toMatchObject({ commandeId: c.id, platId: 13, quantite: 2, prixUnitaire: 11, statutCuisine: 'en_attente', remarque: 'Grillé' })
    expect(c.lignes).toHaveLength(3)
    expect(api.journal.supprimes).toEqual([])
  })
})

describe('creerCommandeAvecLignes : aucune commande orpheline', () => {
  it('si la 3e ligne échoue, supprime les 2 lignes créées ET la commande', async () => {
    const api = fauxApi({ echecLigne: 3 })
    await expect(creerCommandeAvecLignes(api, donnees)).rejects.toThrow('Rien n\'a été créé')
    const idCommande = api.journal.crees[0].id
    expect(api.journal.supprimes).toHaveLength(3)
    expect(api.journal.supprimes).toContain(`/commandes/${idCommande}`)
    const lignesCreees = api.journal.crees.filter((x) => x.chemin === '/lignesCommande')
    expect(lignesCreees).toHaveLength(2)
    for (const l of lignesCreees) expect(api.journal.supprimes).toContain(`/lignesCommande/${l.id}`)
  })
  it('si la 1re ligne échoue, supprime la commande', async () => {
    const api = fauxApi({ echecLigne: 1 })
    await expect(creerCommandeAvecLignes(api, donnees)).rejects.toThrow()
    expect(api.journal.supprimes).toContain(`/commandes/${api.journal.crees[0].id}`)
  })
  it('si la commande elle-même échoue, il n’y a rien à défaire', async () => {
    const api = fauxApi()
    api.creer = async () => { throw new Error('500') }
    await expect(creerCommandeAvecLignes(api, donnees)).rejects.toThrow('500')
    expect(api.journal.supprimes).toEqual([])
  })
  it('signale un nettoyage impossible, avec le numéro de la commande à vérifier', async () => {
    const api = fauxApi({ echecLigne: 2, echecSuppression: true })
    const erreur = await creerCommandeAvecLignes(api, donnees).catch((e) => e)
    expect(erreur.nettoyageIncomplet).toBe(true)
    expect(erreur.message).toContain(`n°${api.journal.crees[0].id}`)
  })
})

describe('creerCommandeAvecLignes : règles', () => {
  it('refuse une table qui a déjà une commande ouverte, sans rien créer', async () => {
    const api = fauxApi({ commandesDeLaTable: [{ id: 9, statut: 'prete' }] })
    await expect(creerCommandeAvecLignes(api, donnees)).rejects.toThrow('déjà une commande')
    expect(api.journal.crees).toEqual([])
  })
  it('accepte une table dont les commandes sont payées ou annulées', async () => {
    const api = fauxApi({ commandesDeLaTable: [{ statut: 'payee' }, { statut: 'annulee' }] })
    await expect(creerCommandeAvecLignes(api, donnees)).resolves.toBeTruthy()
  })
  it('refuse un panier vide', async () => {
    await expect(creerCommandeAvecLignes(fauxApi(), { ...donnees, lignes: [] })).rejects.toThrow('au moins un plat')
  })
})

describe('maintenantLocal', () => {
  it('formate comme les données du projet', () => {
    expect(maintenantLocal(new Date(2026, 9, 21, 9, 5, 7))).toBe('2026-10-21T09:05:07')
  })
})