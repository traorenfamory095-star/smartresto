<script setup>
definePageMeta({ layout: 'public' })
useHead({
  title: 'La carte du Kivu | SmartResto',
  meta: [
    {
      name: 'description',
      content: 'Produits frais, recettes de mémoire et cuisson au feu. Découvrez notre carte.',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    },
  ],
})

const { lire } = useApi()
// Panier du site PUBLIC (et non celui de la prise de commande du personnel) : c'est le même
// panier que sur l'accueil et les spéciaux, et il s'envoie comme une « demande » que l'équipe
// transforme en commande. Un visiteur n'est pas connecté : il ne peut pas créer une commande lui-même.
const panier = usePanierPublic()
const notifier = useNotifier()
const ajouterDepuisCarte = creerAjoutDepuisCarte(panier, notifier)
const ajoutFeedback = ref({ platId: null, numero: 0 })
const {
  categories,
  pending: chargementCategories,
  error: erreurCategories,
  refresh: actualiserCategories,
} = await useCategories()
const {
  data: plats,
  pending: chargementPlats,
  error: erreurPlats,
  refresh: actualiserPlats,
} = await useAsyncData('carte-plats', () => lire('/plats', { disponible: true }))

const categorieIdActive = ref(null)
const recherche = ref('')
const tiroirOuvert = ref(false)
const chargement = computed(() => chargementCategories.value || chargementPlats.value)
const erreur = computed(() => erreurCategories.value || erreurPlats.value)
const nombreArticles = computed(() => panier.nbArticles.value)
const totalPanier = computed(() => panier.total.value)
const pastilles = computed(() => construirePastilles(categories.value ?? [], plats.value ?? []))
const carte = computed(() =>
  construireCarte(
    categories.value ?? [],
    plats.value ?? [],
    recherche.value,
    categorieIdActive.value,
  ),
)
const carteVide = computed(() => pastilles.value.length === 0)
const aucunResultat = computed(() => !carteVide.value && carte.value.length === 0)

watch(pastilles, (categoriesDisponibles) => {
  if (
    categorieIdActive.value !== null
    && !categoriesDisponibles.some((categorie) => String(categorie.id) === String(categorieIdActive.value))
  ) {
    categorieIdActive.value = null
  }
})

function basculerImageSecours(event, plat, categorie) {
  const image = event.currentTarget
  const imageSecours = resoudreImagePlat({ ...plat, imageUrl: '' }, categorie)

  if (image.src !== imageSecours) image.src = imageSecours
}

function addToCart(dish) {
  if (ajouterDepuisCarte(dish)) {
    ajoutFeedback.value = {
      platId: dish.id,
      numero: ajoutFeedback.value.numero + 1,
    }
  }
}

// Classes Tailwind réutilisées (pastilles de catégorie et messages d'état)
const classePastille =
  'min-h-10 cursor-pointer whitespace-nowrap rounded-full border px-[17px] text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#ffa64d]'
const pastilleActive = 'border-[#f97316] bg-[#f97316] text-white'
const pastilleInactive =
  'border-white/[.13] bg-[#151515] text-[#a3a3a3] hover:border-[#f97316] hover:bg-[#f97316] hover:text-white'
const classeEtat =
  'm-0 flex min-h-[180px] items-center justify-center gap-3 rounded-3xl border border-white/[.13] bg-[rgba(20,20,20,.78)] p-8 text-center text-[#a3a3a3]'

function ouvrirPanier() {
  tiroirOuvert.value = true
}

async function actualiserCarte() {
  await Promise.all([actualiserCategories(), actualiserPlats()])
}
</script>

<template>
  <div class="min-h-full bg-[#0a0a0a] font-sans text-sm text-white">
    <main class="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-[62px] sm:pb-[120px] sm:pt-20">
      <header class="mx-auto mb-[54px] text-center">
        <p class="mb-5 text-[11px] font-bold uppercase tracking-[2.2px] text-[#f97316]">
          Notre table, votre voyage
        </p>
        <h1 class="text-[clamp(44px,4.15vw,60px)] font-bold leading-[1.04] tracking-[-2.5px] sm:tracking-[-3.5px]">
          La carte du
          <span
            class="relative whitespace-nowrap text-[#f97316] after:absolute after:inset-x-0 after:bottom-[3px] after:h-[3px] after:-rotate-[1.5deg] after:rounded-full after:bg-[#f97316] after:content-['']"
          >Kivu</span>
        </h1>
        <p class="mx-auto mt-5 max-w-[520px] text-base leading-[1.75] text-[#a3a3a3]">
          Produits frais, recettes de mémoire et cuisson au feu. Découvrez une carte courte,
          préparée chaque jour.
        </p>
      </header>

      <section
        class="mb-[70px] flex flex-col items-stretch gap-6 rounded-[20px] border border-white/[.13] bg-[rgba(20,20,20,.78)] p-[18px] shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-[16px] min-[900px]:flex-row min-[900px]:items-center"
        aria-label="Filtres de la carte"
      >
        <label
          class="flex h-11 w-full items-center gap-[11px] rounded-xl border border-white/[.13] bg-[#111] px-[13px] focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[#ffa64d] min-[900px]:min-w-[260px] min-[900px]:flex-[1_0_260px]"
        >
          <span class="sr-only">Rechercher un plat</span>
          <svg
            class="h-[18px] w-[18px] shrink-0 stroke-[#7a7a7a] [stroke-linecap:round] [stroke-width:1.7]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input
            v-model="recherche"
            type="search"
            placeholder="Rechercher un plat..."
            class="h-full w-full min-w-0 border-0 bg-transparent text-[13px] text-white outline-none placeholder:text-[#7a7a7a]"
          />
        </label>

        <div
          class="flex flex-wrap items-center justify-start gap-2 min-[900px]:flex-[0_1_auto] min-[900px]:justify-end"
          role="group"
          aria-label="Filtrer par catégorie"
        >
          <button
            type="button"
            :class="[classePastille, categorieIdActive === null ? pastilleActive : pastilleInactive]"
            :aria-pressed="categorieIdActive === null"
            @click="categorieIdActive = null"
          >
            Tout
          </button>
          <button
            v-for="categorie in pastilles"
            :key="categorie.id"
            type="button"
            :class="[classePastille, String(categorieIdActive) === String(categorie.id) ? pastilleActive : pastilleInactive]"
            :aria-pressed="String(categorieIdActive) === String(categorie.id)"
            @click="categorieIdActive = categorie.id"
          >
            {{ categorie.nom }}
          </button>
        </div>
      </section>

      <div>
        <div v-if="chargement" role="status" :class="classeEtat">
          <span
            class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent"
            aria-hidden="true"
          />
          Chargement de la carte…
        </div>

        <div v-else-if="erreur" role="alert" :class="[classeEtat, 'flex-col text-[#ffa64d]']">
          <p>{{ erreur.message || 'Impossible de charger la carte. Réessayez.' }}</p>
          <button
            type="button"
            class="min-h-10 cursor-pointer rounded-full border border-[#f97316] bg-[#151515] px-[17px] text-xs text-[#ffa64d] transition-colors hover:bg-[#f15a00] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#ffa64d]"
            @click="actualiserCarte"
          >
            Réessayer
          </button>
        </div>

        <p v-else-if="carteVide" :class="classeEtat">
          Aucun plat n'est disponible sur la carte pour le moment.
        </p>

        <p v-else-if="aucunResultat" :class="classeEtat">
          Aucun résultat pour cette recherche.
        </p>

        <div v-else>
          <CategoriesSectionCarte
            v-for="categorie in carte"
            :key="categorie.id"
            :categorie="categorie"
            :plats="categorie.plats"
            :ajout-feedback="ajoutFeedback"
            @ajouter="addToCart"
            @image-error="basculerImageSecours"
          />
        </div>
      </div>
    </main>

    <CategoriesBoutonPanierFlottant
      v-if="nombreArticles > 0"
      :nombre-articles="nombreArticles"
      :total="totalPanier"
      @ouvrir="ouvrirPanier"
    />

    <PublicPanier v-model="tiroirOuvert" />
  </div>
</template>
