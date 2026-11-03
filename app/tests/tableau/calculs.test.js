import { describe, it, expect } from 'vitest'
import {
  jourLocal, ajouterJours, referenceMaintenant, salutation, prenom, dateEnLettres, accorder,
  etiquetteTable, resumeNoms, chiffreAffaires, variationPourcent, libelleVariation, estEnAlerte,
  prochainesReservations, syntheseDuJour,
} from '../../utils/tableau/calculs.js'

// --- Données du 21 octobre 2026 (extraits de db/*.json) ---
const cmd = (id, tableId, statut, creeLe) => ({ id, tableId, serveurId: 3, statut, creeLe, nbCouverts: 2, note: '' })
const commandes = [
  cmd(1, 6, 'payee', '2026-10-12T12:40:00'), cmd(2, 9, 'payee', '2026-10-12T19:35:00'),
  cmd(3, 7, 'payee', '2026-10-13T12:40:00'), cmd(4, 4, 'payee', '2026-10-13T19:35:00'),
  cmd(5, 2, 'payee', '2026-10-14T12:40:00'), cmd(6, 8, 'payee', '2026-10-14T19:35:00'),
  cmd(7, 8, 'payee', '2026-10-15T12:40:00'), cmd(8, 1, 'payee', '2026-10-15T19:35:00'),
  cmd(9, 2, 'payee', '2026-10-16T12:40:00'), cmd(10, 5, 'payee', '2026-10-16T19:35:00'),
  cmd(11, 7, 'payee', '2026-10-17T12:40:00'), cmd(12, 10, 'payee', '2026-10-17T19:35:00'),
  cmd(13, 9, 'payee', '2026-10-18T12:40:00'), cmd(14, 2, 'payee', '2026-10-18T19:35:00'),
  cmd(15, 6, 'payee', '2026-10-19T12:40:00'), cmd(16, 8, 'payee', '2026-10-19T19:35:00'),
  cmd(17, 4, 'payee', '2026-10-20T12:40:00'), cmd(18, 9, 'payee', '2026-10-20T19:35:00'),
  cmd(19, 6, 'annulee', '2026-10-18T20:10:00'),
  cmd(20, 3, 'servie', '2026-10-21T12:05:00'), cmd(21, 7, 'prete', '2026-10-21T12:30:00'),
  cmd(22, 5, 'en_preparation', '2026-10-21T12:42:00'), cmd(23, 9, 'en_attente', '2026-10-21T12:55:00'),
]
// [commandeId, [[quantité, prix], ...]]
const LIGNES = {
  1: [[1, 4.5], [2, 2]], 2: [[1, 1.5], [1, 3]], 3: [[2, 6.5], [1, 4]], 4: [[2, 7], [2, 1.5], [2, 8]],
  5: [[2, 2], [2, 4.5]], 6: [[1, 3], [2, 2.5], [1, 11], [1, 7]], 7: [[1, 4.5], [1, 9.5], [1, 1]],
  8: [[2, 6], [1, 11], [1, 2]], 9: [[1, 7], [1, 3], [1, 11], [1, 3.5]], 10: [[1, 3], [2, 2], [1, 4.5], [2, 10]],
  11: [[1, 8], [2, 4.5], [1, 10]], 12: [[2, 3.5], [2, 8], [1, 1.5]], 13: [[1, 3], [1, 3], [1, 2], [1, 9.5]],
  14: [[2, 9.5], [2, 3.5]], 15: [[1, 3], [1, 8], [1, 7.5]], 16: [[2, 7], [2, 4.5], [1, 8], [2, 9.5]],
  17: [[2, 1], [2, 7]], 18: [[1, 6.5], [2, 2], [1, 1]], 19: [[1, 11], [1, 3.5], [1, 2], [2, 7.5]],
  20: [[1, 9.5], [1, 6.5], [2, 2]], 21: [[2, 4.5], [1, 9.5], [1, 3]], 22: [[1, 3], [1, 4.5], [1, 10], [2, 1]],
  23: [[1, 2], [2, 3], [2, 8]],
}
const lignes = Object.entries(LIGNES).flatMap(([id, ls]) =>
  ls.map(([quantite, prixUnitaire], i) => ({ id: Number(id) * 10 + i, commandeId: Number(id), quantite, prixUnitaire })),
)
const tables = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, numero: i + 1, capacite: 4, zone: 'salle', actif: true }))
const reservations = [
  { id: 4, nomClient: 'M. Patrick Lwanzo', nbPersonnes: 2, date: '2026-10-21', heure: '20:30', statut: 'confirmee' },
  { id: 5, nomClient: 'Mlle Grâce Kahindo', nbPersonnes: 2, date: '2026-10-20', heure: '19:00', statut: 'annulee' },
]
const ingredients = [
  { id: 1, nom: 'Poulet', stock: 25, seuilAlerte: 10 },
  { id: 4, nom: 'Boeuf', stock: 6, seuilAlerte: 8 },
  { id: 7, nom: 'Tilapia', stock: 3, seuilAlerte: 6 },
  { id: 11, nom: 'Tomates', stock: 9, seuilAlerte: 6 },
]
const donnees = { commandes, lignes, tables, reservations, ingredients }
const le21 = (h = 18, m = 0) => new Date(2026, 9, 21, h, m)

describe('dates', () => {
  it('jourLocal et ajouterJours, même autour des changements de mois et d’année', () => {
    expect(jourLocal(le21(23, 59))).toBe('2026-10-21')
    expect(ajouterJours('2026-10-21', -6)).toBe('2026-10-15')
    expect(ajouterJours('2026-11-01', -1)).toBe('2026-10-31')
    expect(ajouterJours('2026-01-02', -5)).toBe('2025-12-28')
    expect(ajouterJours('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('referenceMaintenant : date simulée valide, avec ou sans heure', () => {
    const reel = new Date(2026, 10, 1, 7, 30, 15)
    const a = referenceMaintenant({ date: '2026-10-21' }, reel)
    expect(a.simule).toBe(true)
    expect(jourLocal(a.maintenant)).toBe('2026-10-21')
    expect([a.maintenant.getHours(), a.maintenant.getMinutes()]).toEqual([7, 30]) // heure réelle conservée
    const b = referenceMaintenant({ date: '2026-10-21', heure: '19:45' }, reel)
    expect([b.maintenant.getHours(), b.maintenant.getMinutes()]).toEqual([19, 45])
  })

  it('referenceMaintenant : un paramètre invalide donne l’heure réelle', () => {
    const reel = new Date(2026, 10, 1, 7, 30)
    for (const date of [undefined, '', 'hier', '21/10/2026', '2026-02-31', '2026-13-01', ['2026-10-21']]) {
      const r = referenceMaintenant({ date }, reel)
      expect(r.simule).toBe(false)
      expect(r.maintenant.getTime()).toBe(reel.getTime())
    }
    // une heure invalide est ignorée, la date reste simulée
    const r = referenceMaintenant({ date: '2026-10-21', heure: '25:99' }, reel)
    expect(r.simule).toBe(true)
    expect(r.maintenant.getHours()).toBe(7)
  })
})

describe('textes', () => {
  it('salutation : bonjour le jour, bonsoir à partir de 18 h et la nuit', () => {
    expect(salutation(le21(9))).toBe('Bonjour')
    expect(salutation(le21(17, 59))).toBe('Bonjour')
    expect(salutation(le21(18))).toBe('Bonsoir')
    expect(salutation(le21(3))).toBe('Bonsoir')
    expect(salutation(le21(5))).toBe('Bonjour')
  })
  it('prenom', () => {
    expect(prenom('Patrick Lwanzo')).toBe('Patrick')
    expect(prenom('  Gaël  ')).toBe('Gaël')
    expect(prenom('')).toBe('')
    expect(prenom(null)).toBe('')
  })
  it('dateEnLettres', () => {
    expect(dateEnLettres(le21())).toBe('Mercredi 21 octobre')
  })
  it('accorder, etiquetteTable, resumeNoms', () => {
    expect(accorder(0, 'table', 'tables')).toBe('0 table')
    expect(accorder(1, 'table', 'tables')).toBe('1 table')
    expect(accorder(2, 'table', 'tables')).toBe('2 tables')
    expect(etiquetteTable({ numero: 4 })).toBe('T04')
    expect(etiquetteTable({ numero: 12 })).toBe('T12')
    expect(etiquetteTable(null)).toBe('—')
    expect(resumeNoms(['Boeuf', 'Tilapia'])).toBe('Boeuf, Tilapia')
    expect(resumeNoms(['Boeuf', 'Tilapia', 'Riz', 'Sel'])).toBe('Boeuf, Tilapia +2')
    expect(resumeNoms([])).toBe('')
  })
})

describe('chiffre d’affaires et variation', () => {
  const assemblees = [
    { statut: 'payee', creeLe: '2026-10-20T12:00:00', total: 0.1 },
    { statut: 'payee', creeLe: '2026-10-20T19:00:00', total: 0.2 },
    { statut: 'servie', creeLe: '2026-10-20T19:00:00', total: 100 },
    { statut: 'annulee', creeLe: '2026-10-20T19:00:00', total: 100 },
    { statut: 'payee', creeLe: '2026-10-14T19:00:00', total: 50 },
  ]
  it('ne compte que les commandes payées, exact au centime (0,1 + 0,2 = 0,3)', () => {
    expect(chiffreAffaires(assemblees, '2026-10-15', '2026-10-21')).toBe(0.3)
  })
  it('les bornes sont incluses', () => {
    expect(chiffreAffaires(assemblees, '2026-10-14', '2026-10-14')).toBe(50)
    expect(chiffreAffaires(assemblees, '2026-10-20', '2026-10-20')).toBe(0.3)
  })
  it('période sans vente : 0, jamais NaN', () => {
    expect(chiffreAffaires([], '2026-10-15', '2026-10-21')).toBe(0)
    expect(chiffreAffaires(assemblees, '2030-01-01', '2030-01-07')).toBe(0)
  })
  it('variationPourcent', () => {
    expect(variationPourcent(287, 102)).toBe(181.4)
    expect(variationPourcent(50, 100)).toBe(-50)
    expect(variationPourcent(100, 100)).toBe(0)
    expect(variationPourcent(10, 0)).toBeNull()
    expect(variationPourcent(0, 0)).toBeNull()
    expect(variationPourcent(10, undefined)).toBeNull()
  })
  it('libelleVariation', () => {
    expect(libelleVariation(12.4)).toBe('+12,4 % vs 7 jours précédents')
    expect(libelleVariation(0)).toBe('0,0 % vs 7 jours précédents')
    expect(libelleVariation(-5)).toMatch(/^[-−]5,0 % vs 7 jours précédents$/)
    expect(libelleVariation(null)).toBe('Pas de comparaison possible')
  })
})

describe('stock et réservations', () => {
  it('estEnAlerte : stock <= seuil (l’égalité compte)', () => {
    expect(estEnAlerte({ stock: 6, seuilAlerte: 8 })).toBe(true)
    expect(estEnAlerte({ stock: 8, seuilAlerte: 8 })).toBe(true)
    expect(estEnAlerte({ stock: 9, seuilAlerte: 8 })).toBe(false)
    expect(estEnAlerte({ stock: 0, seuilAlerte: 0 })).toBe(true)
    expect(estEnAlerte({ stock: 'abc', seuilAlerte: 8 })).toBe(false)
    expect(estEnAlerte(undefined)).toBe(false)
  })

  const liste = [
    { id: 3, date: '2026-10-21', heure: '20:00', statut: 'confirmee' },
    { id: 1, date: '2026-10-21', heure: '19:00', statut: 'confirmee' },
    { id: 2, date: '2026-10-21', heure: '19:30', statut: 'confirmee' },
    { id: 4, date: '2026-10-21', heure: '21:00', statut: 'confirmee' },
    { id: 5, date: '2026-10-21', heure: '19:15', statut: 'annulee' },
    { id: 6, date: '2026-10-22', heure: '12:00', statut: 'confirmee' },
  ]
  it('prochainesReservations : triées, confirmées, du jour, 3 au plus', () => {
    expect(prochainesReservations(liste, le21(18)).map((r) => r.id)).toEqual([1, 2, 3])
  })
  it('une réservation de moins de 30 minutes est encore listée, une plus ancienne non', () => {
    expect(prochainesReservations(liste, le21(19, 25)).map((r) => r.id)).toEqual([1, 2, 3]) // 19:00 >= 18:55
    expect(prochainesReservations(liste, le21(19, 31)).map((r) => r.id)).toEqual([2, 3, 4]) // 19:00 < 19:01
  })
  it('plus rien en fin de soirée', () => {
    expect(prochainesReservations(liste, le21(23))).toEqual([])
  })
})

describe('syntheseDuJour (jeu de données du 21 octobre)', () => {
  const s = syntheseDuJour(donnees, le21(18))

  it('chiffre d’affaires : 7 jours contre les 7 jours précédents', () => {
    expect(s.ca.semaine).toBe(287)
    expect(s.ca.precedente).toBe(102)
    expect(s.ca.variation).toBe(181.4)
  })
  it('commandes du jour (hors annulées) et commandes en cours', () => {
    expect(s.commandes).toEqual({ aujourdhui: 4, enCours: 4 })
  })
  it('tables occupées : une par commande ouverte', () => {
    expect(s.tables).toEqual({ occupees: 4, actives: 10 }) // tables 3, 5, 7 et 9
  })
  it('réservations du jour, couverts attendus et prochaines', () => {
    expect(s.reservations.nombre).toBe(1)
    expect(s.reservations.couverts).toBe(2)
    expect(s.reservations.prochaines.map((r) => r.nomClient)).toEqual(['M. Patrick Lwanzo'])
  })
  it('alertes stock : les noms, par ordre alphabétique', () => {
    expect(s.stock).toEqual({ nombre: 2, noms: ['Boeuf', 'Tilapia'] })
  })
  it('dernières commandes : les 4 plus récentes d’abord, avec table et total', () => {
    expect(s.dernieres.map((c) => c.id)).toEqual([23, 22, 21, 20])
    expect(s.dernieres[0].total).toBe(24) // 2 + 2 x 3 + 2 x 8
    expect(s.dernieres[0].table.numero).toBe(9)
  })

  it('une commande annulée du jour n’est pas comptée', () => {
    const avec = { ...donnees, commandes: [...commandes, cmd(24, 1, 'annulee', '2026-10-21T13:00:00')] }
    expect(syntheseDuJour(avec, le21(18)).commandes.aujourdhui).toBe(4)
  })
  it('une table inactive n’est pas comptée', () => {
    const inactive = tables.map((t) => (t.id === 3 ? { ...t, actif: false } : t))
    expect(syntheseDuJour({ ...donnees, tables: inactive }, le21(18)).tables).toEqual({ occupees: 3, actives: 9 })
  })
  it('une commande payée libère sa table', () => {
    const payee = commandes.map((c) => (c.id === 20 ? { ...c, statut: 'payee' } : c))
    const r = syntheseDuJour({ ...donnees, commandes: payee }, le21(18))
    expect(r.tables.occupees).toBe(3)
    expect(r.ca.semaine).toBe(307) // 287 + la commande 20 (9,5 + 6,5 + 2 x 2 = 20)
  })
})

describe('syntheseDuJour : cas limites', () => {
  it('une période sans aucune vente : des zéros et pas de pourcentage, jamais NaN', () => {
    const s = syntheseDuJour(donnees, new Date(2026, 11, 15, 12))
    expect(s.ca).toEqual({ semaine: 0, precedente: 0, variation: null })
    expect(s.commandes.aujourdhui).toBe(0)
    expect(s.reservations).toMatchObject({ nombre: 0, couverts: 0, prochaines: [] })
    expect(JSON.stringify(s)).not.toMatch(/NaN|Infinity/)
  })
  it('la semaine écoulée sans vente, après une bonne semaine : -100 %', () => {
    const s = syntheseDuJour(donnees, new Date(2026, 10, 1, 12)) // les ventes du 19 et 20 octobre sont dans la semaine d’avant
    expect(s.ca).toEqual({ semaine: 0, precedente: 96, variation: -100 })
  })
  it('ne plante pas sans données', () => {
    expect(() => syntheseDuJour(undefined, le21())).not.toThrow()
    const s = syntheseDuJour({}, le21())
    expect(s.dernieres).toEqual([])
    expect(s.tables).toEqual({ occupees: 0, actives: 0 })
    expect(s.stock).toEqual({ nombre: 0, noms: [] })
  })
})