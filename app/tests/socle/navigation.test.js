import { describe, it, expect } from 'vitest'
import { MENU_ADMIN, MENU_PUBLIC, ROUTES_PUBLIQUES, estRoutePublique, trouverLien } from '../../utils/navigation.js'

describe('MENU_ADMIN', () => {
  it('contient 14 liens sans doublon', () => {
    const chemins = MENU_ADMIN.map((lien) => lien.chemin)
    expect(chemins).toHaveLength(14)
    expect(new Set(chemins).size).toBe(14)
  })

  it('donne à chaque lien un libellé, une icône et une description', () => {
    for (const lien of MENU_ADMIN) {
      expect(lien.libelle).toBeTruthy()
      expect(lien.icone).toBeTruthy()
      expect(lien.description).toBeTruthy()
    }
  })

  it('ne contient aucune page publique, sauf la carte', () => {
    const publiquesDansAdmin = MENU_ADMIN.filter((lien) => ROUTES_PUBLIQUES.includes(lien.chemin))
    expect(publiquesDansAdmin.map((lien) => lien.chemin)).toEqual(['/carte'])
  })
})

describe('MENU_PUBLIC', () => {
  it('ne pointe que vers des pages publiques', () => {
    for (const lien of MENU_PUBLIC) {
      expect(ROUTES_PUBLIQUES).toContain(lien.chemin)
    }
  })
})

describe('estRoutePublique', () => {
  it('reconnaît les pages publiques', () => {
    expect(estRoutePublique('/')).toBe(true)
    expect(estRoutePublique('/carte')).toBe(true)
    expect(estRoutePublique('/connexion')).toBe(true)
  })

  it('ignore la barre finale et la requête', () => {
    expect(estRoutePublique('/carte/')).toBe(true)
    expect(estRoutePublique('/connexion?espace=administration')).toBe(true)
  })

  it('refuse les pages d’administration, sous-pages comprises', () => {
    expect(estRoutePublique('/plats')).toBe(false)
    expect(estRoutePublique('/carte/secret')).toBe(false)
    expect(estRoutePublique('/rapports')).toBe(false)
  })
})

describe('trouverLien', () => {
  it('trouve le lien d’une page principale', () => {
    expect(trouverLien('/plats')?.libelle).toBe('Plats')
  })

  it('rattache les sous-pages à leur module', () => {
    expect(trouverLien('/plats/nouveau')?.chemin).toBe('/plats')
    expect(trouverLien('/commandes/12')?.chemin).toBe('/commandes')
    expect(trouverLien('/stock/mouvements')?.chemin).toBe('/stock')
  })

  it('ne confond pas deux modules au début identique', () => {
    expect(trouverLien('/tables')?.chemin).toBe('/tables')
    expect(trouverLien('/reservations')?.chemin).toBe('/reservations')
  })

  it('renvoie undefined pour une page inconnue', () => {
    expect(trouverLien('/inconnue')).toBeUndefined()
  })
})
