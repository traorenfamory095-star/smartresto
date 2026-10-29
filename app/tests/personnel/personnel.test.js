import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from 'vitest'

import { useAuth } from '../../composables/useAuth.js'
import { usePersonnel } from '../../composables/usePersonnel.js'
import { estRoutePublique } from '../../utils/navigation.js'
import { ROLES } from '../../utils/roles.js'

let lire
let modifier

beforeEach(() => {
  lire = vi.fn()
  modifier = vi.fn()

  // Remplace les fonctions Nuxt par des versions de test.
  vi.stubGlobal('useApi', () => ({
    lire,
    creer: vi.fn(),
    modifier,
  }))

  vi.stubGlobal('useCookie', () => ({ value: null }))
  vi.stubGlobal('useState', (_cle, initialiser) => ({
    value: initialiser(),
  }))

  vi.stubGlobal('computed', (calculer) => ({
    get value() {
      return calculer()
    },
  }))

  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('estRoutePublique', estRoutePublique)
  vi.stubGlobal('ROLES', ROLES)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Permissions du personnel', () => {
  it('refuse la cuisine à un serveur', () => {
    const auth = useAuth()
    auth.utilisateur.value = { id: 3, role: 'serveur' }

    expect(auth.peut('/cuisine')).toBe(false)
  })

  it('autorise une sous-page des commandes au serveur', () => {
    const auth = useAuth()
    auth.utilisateur.value = { id: 3, role: 'serveur' }

    expect(auth.peut('/commandes/12')).toBe(true)
  })

  it('refuse le personnel à un serveur', () => {
    const auth = useAuth()
    auth.utilisateur.value = { id: 3, role: 'serveur' }

    expect(auth.peut('/personnel')).toBe(false)
  })

  it('autorise les rapports à un administrateur', () => {
    const auth = useAuth()
    auth.utilisateur.value = { id: 1, role: 'admin' }

    expect(auth.peut('/rapports')).toBe(true)
  })
})

describe('Connexion', () => {
  it('refuse un employé inactif', async () => {
    lire.mockResolvedValue([
      {
        id: 7,
        email: 'test@smartresto.cd',
        motDePasse: 'test123',
        role: 'serveur',
        actif: false,
      },
    ])

    const auth = useAuth()
    const resultat = await auth.seConnecter(
      'test@smartresto.cd',
      'test123',
    )

    expect(resultat.ok).toBe(false)
    expect(resultat.erreur).toMatch(/désactivé/i)
    expect(auth.utilisateur.value).toBeNull()
  })

  it('ne conserve pas le mot de passe dans la session', async () => {
    lire.mockResolvedValue([
      {
        id: 3,
        nom: 'Employé test',
        email: 'test@smartresto.cd',
        motDePasse: 'test123',
        role: 'serveur',
        actif: true,
      },
    ])

    const auth = useAuth()
    const resultat = await auth.seConnecter(
      'test@smartresto.cd',
      'test123',
    )

    expect(resultat.ok).toBe(true)
    expect(auth.utilisateur.value.id).toBe(3)
    expect(auth.utilisateur.value).not.toHaveProperty('motDePasse')
  })
})

describe('Protection du dernier administrateur', () => {
  it('interdit sa désactivation sans envoyer de modification', async () => {
    lire.mockResolvedValue([
      {
        id: 1,
        nom: 'Administrateur',
        email: 'admin@smartresto.cd',
        role: 'admin',
        actif: true,
      },
    ])

    const { modifierEmploye } = usePersonnel()

    await expect(
      modifierEmploye(1, {
        nom: 'Administrateur',
        email: 'admin@smartresto.cd',
        role: 'admin',
        actif: false,
      }),
    ).rejects.toThrow(/dernier administrateur/i)

    expect(modifier).not.toHaveBeenCalled()
  })
})

describe('Désactivation d’un serveur avec commandes', () => {
  it('désactive le serveur et signale les commandes conservées', async () => {
    lire
      .mockResolvedValueOnce([
        {
          id: 3,
          nom: 'Amani Kasereka',
          email: 'amani@smartresto.cd',
          role: 'serveur',
          actif: true,
        },
      ])
      .mockResolvedValueOnce([
        { id: 1, serveurId: 3 },
        { id: 2, serveurId: 3 },
      ])

    modifier.mockResolvedValueOnce({})

    const { modifierEmploye } = usePersonnel()

    const resultat = await modifierEmploye('3', {
      nom: 'Amani Kasereka',
      email: 'amani@smartresto.cd',
      role: 'serveur',
      actif: false,
    })

    expect(lire).toHaveBeenNthCalledWith(
      2,
      '/commandes',
      { serveurId: '3' },
    )

    expect(modifier).toHaveBeenCalledTimes(1)

    expect(modifier).toHaveBeenCalledWith('/employes/3', {
      nom: 'Amani Kasereka',
      email: 'amani@smartresto.cd',
      role: 'serveur',
      actif: false,
    })

    expect(resultat.message).toContain('2 commande(s)')
    expect(resultat.message).toContain('conservées')
  })
})