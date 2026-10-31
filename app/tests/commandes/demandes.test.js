import { describe, it, expect } from 'vitest'
import {
  problemesDemande, construireDemande, envoyerDemande,
  prendreEnChargeDemande, refuserDemande, tablesLibres,
} from '../../composables/useDemandes.js'

const saisie = {
  nomClient: '  Aline  ', telephone: '+243 990 123 456', nbCouverts: 2, note: 'Près de la fenêtre',
  lignes: [{ platId: 13, quantite: 2, prixUnitaire: 11, remarque: '' }],
}

describe('problemesDemande', () => {
  it('accepte une demande complète', () => {
    expect(problemesDemande(saisie)).toEqual([])
  })
  it('refuse nom trop court, téléphone invalide, personnes absentes, panier vide', () => {
    expect(problemesDemande({ nomClient: 'A', telephone: '12', nbCouverts: 0, lignes: [] })).toHaveLength(4)
  })
  it('accepte un téléphone avec espaces et +, refuse un téléphone trop long', () => {
    expect(problemesDemande({ ...saisie, telephone: '099 123 45 67' })).toEqual([])
    expect(problemesDemande({ ...saisie, telephone: '1'.repeat(16) })).toHaveLength(1)
  })
})

describe('construireDemande', () => {
  it('nettoie les champs et démarre « en_attente »', () => {
    const d = construireDemande(saisie, '2026-10-30T12:00:00')
    expect(d).toMatchObject({ nomClient: 'Aline', statut: 'en_attente', nbCouverts: 2, creeLe: '2026-10-30T12:00:00' })
    expect(d.lignes).toEqual([{ platId: 13, quantite: 2, prixUnitaire: 11, remarque: '' }])
  })
  it('coupe un message trop long', () => {
    expect(construireDemande({ ...saisie, note: 'x'.repeat(500) }).note).toHaveLength(200)
  })
})

// Faux serveur en mémoire.
function fauxApi({ demande, plats, commandesTable = [], echecMarquage = false } = {}) {
  const etat = {
    demande: demande ?? { id: 1, statut: 'en_attente', nomClient: 'Aline', telephone: '0991234567', nbCouverts: 2, note: '',
      lignes: [{ platId: 13, quantite: 2, prixUnitaire: 11, remarque: 'Grillé' }] },
    plats: plats ?? [{ id: 13, nom: 'Tilapia entier', disponible: true }],
    ecritures: [],
  }
  return {
    etat,
    async lire(chemin) {
      if (chemin.startsWith('/demandes/')) return etat.demande
      if (chemin === '/plats') return etat.plats
      if (chemin === '/commandes') return commandesTable
    },
    async creer(chemin, corps) {
      etat.ecritures.push(['POST', chemin, corps])
      return { id: chemin === '/commandes' ? 50 : 60 + etat.ecritures.length, ...corps }
    },
    async modifier(chemin, champs) {
      if (echecMarquage && chemin.startsWith('/demandes/')) throw new Error('500')
      etat.ecritures.push(['PATCH', chemin, champs]); return champs
    },
    async supprimer(chemin) { etat.ecritures.push(['DELETE', chemin]) },
  }
}

describe('envoyerDemande', () => {
  it('enregistre la demande', async () => {
    const api = fauxApi()
    await envoyerDemande(api, saisie)
    expect(api.etat.ecritures[0][1]).toBe('/demandes')
    expect(api.etat.ecritures[0][2].statut).toBe('en_attente')
  })
  it('refuse une saisie invalide sans rien envoyer', async () => {
    const api = fauxApi()
    await expect(envoyerDemande(api, { ...saisie, lignes: [] })).rejects.toThrow('au moins un plat')
    expect(api.etat.ecritures).toEqual([])
  })
})

describe('prendreEnChargeDemande', () => {
  const options = { tableId: 4, serveurId: 3 }

  it('crée la commande avec ses lignes, puis marque la demande traitée et liée', async () => {
    const api = fauxApi()
    const commande = await prendreEnChargeDemande(api, { id: 1 }, options)
    expect(commande.id).toBe(50)
    const [creations] = [api.etat.ecritures.filter((e) => e[0] === 'POST')]
    expect(creations[0][2]).toMatchObject({ tableId: 4, serveurId: 3, nbCouverts: 2, statut: 'en_attente' })
    expect(creations[0][2].note).toContain('Aline')
    expect(creations[1][2]).toMatchObject({ commandeId: 50, platId: 13, quantite: 2, prixUnitaire: 11, remarque: 'Grillé' })
    expect(api.etat.ecritures.at(-1)).toEqual(['PATCH', '/demandes/1', { statut: 'traitee', commandeId: 50 }])
  })

  it('refuse une demande déjà traitée (double clic, collègue) sans rien créer', async () => {
    const api = fauxApi({ demande: { id: 1, statut: 'traitee', lignes: [] } })
    await expect(prendreEnChargeDemande(api, { id: 1 }, options)).rejects.toThrow('déjà été traitée')
    expect(api.etat.ecritures).toEqual([])
  })

  it('refuse si un plat n’est plus disponible, sans rien créer', async () => {
    const api = fauxApi({ plats: [{ id: 13, nom: 'Tilapia entier', disponible: false }] })
    await expect(prendreEnChargeDemande(api, { id: 1 }, options)).rejects.toThrow('Tilapia entier')
    expect(api.etat.ecritures).toEqual([])
  })

  it('refuse si un plat a été supprimé', async () => {
    const api = fauxApi({ plats: [] })
    await expect(prendreEnChargeDemande(api, { id: 1 }, options)).rejects.toThrow('plus disponible')
  })

  it('refuse une table qui a déjà une commande ouverte', async () => {
    const api = fauxApi({ commandesTable: [{ id: 9, statut: 'en_preparation' }] })
    await expect(prendreEnChargeDemande(api, { id: 1 }, options)).rejects.toThrow('déjà une commande')
    expect(api.etat.ecritures).toEqual([])
  })

  it('si le marquage échoue après la création, prévient avec le numéro de la commande', async () => {
    const api = fauxApi({ echecMarquage: true })
    const erreur = await prendreEnChargeDemande(api, { id: 1 }, options).catch((e) => e)
    expect(erreur.message).toContain('n°50')
    expect(erreur.commandeId).toBe(50)
  })
})

describe('refuserDemande', () => {
  it('marque la demande « refusee »', async () => {
    const api = fauxApi()
    await refuserDemande(api, 1)
    expect(api.etat.ecritures).toEqual([['PATCH', '/demandes/1', { statut: 'refusee' }]])
  })
  it('refuse de refuser une demande déjà traitée', async () => {
    const api = fauxApi({ demande: { id: 1, statut: 'traitee', lignes: [] } })
    await expect(refuserDemande(api, 1)).rejects.toThrow('déjà été traitée')
  })
})

describe('tablesLibres', () => {
  it('exclut les tables inactives et celles qui ont une commande ouverte', () => {
    const tables = [{ id: 1, actif: true }, { id: 2, actif: true }, { id: 3, actif: false }, { id: 4, actif: true }]
    const commandes = [{ tableId: 2, statut: 'prete' }, { tableId: 4, statut: 'payee' }]
    expect(tablesLibres(tables, commandes).map((t) => t.id)).toEqual([1, 4])
  })
})