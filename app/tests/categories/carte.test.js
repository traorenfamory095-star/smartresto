import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  construireCarte,
  construirePastilles,
  creerAjoutDepuisCarte,
  IMAGES_SECOURS,
  resoudreImagePlat,
} from '../../composables/useCategories.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

const categories = [
  { id: 2, nom: 'Grillades', ordre: 2 },
  { id: 1, nom: 'Entrées', ordre: 1 },
  { id: 3, nom: 'Desserts', ordre: 3 },
]

const plats = [
  { id: 1, categorieId: 1, nom: 'Salade fraîche', description: 'Tomates et concombre', disponible: true },
  { id: 2, categorieId: 2, nom: 'Poulet braisé', description: 'Cuit au feu de bois', disponible: true },
  { id: 3, categorieId: 2, nom: 'Poisson grillé', description: 'Pêche du jour', disponible: true },
  { id: 4, categorieId: 3, nom: 'Gâteau', description: 'Dessert maison', disponible: false },
]

describe('carte : construireCarte', () => {
  it('filtre par catégorie tout en gardant les catégories dans l’ordre défini', () => {
    const carte = construireCarte(categories, plats, '', 2)

    expect(carte).toHaveLength(1)
    expect(carte[0].nom).toBe('Grillades')
    expect(carte[0].plats.map((plat) => plat.nom)).toEqual(['Poulet braisé', 'Poisson grillé'])
  })

  it('combine le filtre de catégorie et la recherche sans tenir compte de la casse', () => {
    const carte = construireCarte(categories, plats, 'BRAISÉ', 2)

    expect(carte).toHaveLength(1)
    expect(carte[0].plats.map((plat) => plat.nom)).toEqual(['Poulet braisé'])
  })

  it('ne garde que les plats disponibles', () => {
    const carte = construireCarte(categories, plats)

    expect(carte.flatMap((categorie) => categorie.plats).map((plat) => plat.disponible))
      .toEqual([true, true, true])
  })
})

describe('carte : construirePastilles', () => {
  it('ne retourne que les catégories qui ont un plat disponible, dans l’ordre défini', () => {
    expect(construirePastilles(categories, plats).map((categorie) => categorie.nom))
      .toEqual(['Entrées', 'Grillades'])
  })
})

describe('carte : resoudreImagePlat', () => {
  it('privilégie une imageUrl renseignée', () => {
    expect(resoudreImagePlat(
      { id: 1, imageUrl: 'https://example.com/plat.jpg' },
      { nom: 'Grillades' },
    )).toBe('https://example.com/plat.jpg')
  })

  it('choisit une image de secours adaptée aux grillades', () => {
    expect(resoudreImagePlat(
      { id: 1, imageUrl: '' },
      { nom: 'Grillades' },
    )).toBe(IMAGES_SECOURS.brochettes)
  })

  it('renvoie toujours la même image de secours pour un même plat', () => {
    const plat = { id: 7, imageUrl: '' }
    const categorie = { nom: 'Poissons du lac' }

    expect(resoudreImagePlat(plat, categorie)).toBe(resoudreImagePlat(plat, categorie))
  })

  it('choisit une image parmi les quatre secours pour une catégorie inconnue', () => {
    const images = Object.values(IMAGES_SECOURS)
    const image = resoudreImagePlat(
      { id: 4, imageUrl: '' },
      { nom: 'Nouvelle catégorie' },
    )

    expect(images).toContain(image)
  })
})

describe('carte : ajout au panier', () => {
  it('ajoute le plat transmis et affiche une notification de succès', () => {
    const plat = { id: 8, nom: 'Poulet braisé', prix: 9.5 }
    const panier = { ajouter: vi.fn() }
    const notifier = { succes: vi.fn(), erreur: vi.fn() }
    vi.stubGlobal('usePanier', () => panier)
    vi.stubGlobal('useNotifier', () => notifier)

    const ajouter = creerAjoutDepuisCarte(usePanier(), useNotifier())
    const resultat = ajouter(plat)

    expect(resultat).toBe(true)
    expect(panier.ajouter).toHaveBeenCalledExactlyOnceWith(plat)
    expect(notifier.succes).toHaveBeenCalledExactlyOnceWith('Poulet braisé ajouté au panier.')
    expect(notifier.erreur).not.toHaveBeenCalled()
  })

  it('signale une erreur sans la laisser remonter', () => {
    const erreur = new Error('Panier indisponible')
    const panier = { ajouter: vi.fn(() => { throw erreur }) }
    const notifier = { succes: vi.fn(), erreur: vi.fn() }
    vi.stubGlobal('usePanier', () => panier)
    vi.stubGlobal('useNotifier', () => notifier)

    const ajouter = creerAjoutDepuisCarte(usePanier(), useNotifier())
    const resultat = ajouter({ id: 8, nom: 'Poulet braisé' })

    expect(resultat).toBe(false)
    expect(notifier.erreur).toHaveBeenCalledExactlyOnceWith(erreur)
    expect(notifier.succes).not.toHaveBeenCalled()
  })
})
