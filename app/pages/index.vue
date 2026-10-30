<script setup>
// Accueil du site public SmartResto.
// Cette page utilise exclusivement le layout public.
// Les plats et catégories sont récupérés depuis l'API.

definePageMeta({
  layout: 'public',
})

useHead({
  title: 'Accueil | SmartResto',
  meta: [
    {
      name: 'description',
      content:
        'Une cuisine généreuse inspirée des rives du lac Kivu, cuisinée au feu et servie avec le cœur.',
    },
  ],
})

const { lire } = useApi()
const panier = usePanier()
const nbArticles = panier.nbArticles
const messagePanier = ref('')

let minuteurConfirmation

const {
  data,
  pending,
  error,
  refresh,
} = await useAsyncData('accueil', async () => {
  const [plats, categories] = await Promise.all([
    lire('/plats', {
      disponible: true,
      _limit: 6,
    }),
    lire('/categories', {
      _sort: 'ordre',
      _order: 'asc',
    }),
  ])

  return {
    plats,
    categories,
  }
})

const commander = (plat) => {
  panier.ajouter(plat)
  messagePanier.value = `${plat.nom} ajouté au panier. ${nbArticles.value} article(s) dans le panier.`

  if (minuteurConfirmation) clearTimeout(minuteurConfirmation)
  minuteurConfirmation = setTimeout(() => {
    messagePanier.value = ''
  }, 3000)
}

// Les photos servent de solution de repli visuelle.
// Si un plat possède déjà une image dans l'API, celle-ci est prioritaire.
const photosPlats = [
  {
    mots: ['poulet'],
    image:
      'https://images.unsplash.com/photo-1722282470007-893a5607eeb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1000',
  },
  {
    mots: ['brochette', 'chèvre'],
    image:
      'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
  },
  {
    mots: ['tilapia', 'poisson'],
    image:
      'https://images.unsplash.com/photo-1737138472956-79f272bf288c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
  },
  {
    mots: ['sambaza'],
    image:
      'https://images.unsplash.com/photo-1737140789642-9788a3388494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1000',
  },
]

function photoDuPlat(plat, index = 0) {
  if (plat?.image) return plat.image
  if (plat?.imageUrl) return plat.imageUrl
  if (plat?.photo) return plat.photo

  const nom = String(plat?.nom ?? plat?.titre ?? '').toLocaleLowerCase('fr')
  const correspondance = photosPlats.find((item) =>
    item.mots.some((mot) => nom.includes(mot)),
  )

  return correspondance?.image ?? photosPlats[index % photosPlats.length].image
}

const avisClients = [
  {
    initiales: 'AM',
    nom: 'Aline M.',
    texte:
      "Une vraie découverte. Le tilapia est fondant, les épices sont justes et l'accueil exceptionnel.",
    numero: '01',
  },
  {
    initiales: 'JN',
    nom: 'Jean-Paul N.',
    texte:
      'Des saveurs de chez nous présentées avec beaucoup d’élégance. Ma nouvelle adresse à Goma.',
    numero: '02',
  },
  {
    initiales: 'MK',
    nom: 'Merveille K.',
    texte:
      'Le sombé me rappelle les repas en famille. Service rapide, cadre magnifique et chaleureux.',
    numero: '03',
  },
]
</script>

<template>
  <div class="overflow-hidden bg-bg text-ink">
    <div
      v-if="messagePanier"
      role="status"
      aria-live="polite"
      class="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-line bg-card px-5 py-4 font-semibold text-ink shadow-2xl"
    >
      {{ messagePanier }}
    </div>

    <!-- HERO : cuisine authentique à Goma -->
    <section class="relative">
      <div
        class="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20"
      >
        <div class="relative z-10">
          <p
            class="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-mut"
          >
            <span class="h-2 w-2 rounded-full bg-pri"></span>
            Cuisine authentique • Goma
          </p>

          <h1 class="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Goûtez les
            <span class="text-pri">saveurs</span>
            du Kivu
          </h1>

          <p class="mt-6 max-w-xl text-base leading-8 text-mut sm:text-lg">
            Une cuisine généreuse inspirée des rives du lac Kivu, cuisinée au
            feu et servie avec le cœur.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <UiBouton to="/carte" taille="lg">Voir la carte</UiBouton>
            <UiBouton to="/reserver" variante="secondaire" taille="lg">
              Réserver une table
            </UiBouton>
          </div>

          <div class="mt-10 flex flex-wrap gap-x-8 gap-y-5 border-t border-line pt-6">
            <div>
              <p class="font-bold">
                4,9 <span class="text-pri">★★★★★</span>
              </p>
              <p class="mt-1 text-sm text-mut">+300 clients heureux</p>
            </div>

            <div>
              <p class="font-bold text-pri">100%</p>
              <p class="mt-1 text-sm text-mut">Frais du lac</p>
            </div>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-xl">
          <div
            class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-pri/15 blur-3xl"
            aria-hidden="true"
          ></div>

          <div class="relative rounded-[2rem] border border-line bg-card p-2 shadow-2xl sm:rounded-[2.5rem]">
            <img
              src="https://images.unsplash.com/photo-1737138472956-79f272bf288c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200"
              alt="Tilapia grillé aux épices du Kivu"
              class="h-[340px] w-full rounded-[1.5rem] object-cover sm:h-[430px] sm:rounded-[2rem] lg:h-[500px]"
              fetchpriority="high"
            />

            <div class="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur sm:bottom-7 sm:left-7 sm:right-7 sm:p-5">
              <p class="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">
                Spécialité du Kivu
              </p>
              <p class="mt-1 text-lg font-bold text-neutral-950 sm:text-xl">
                Tilapia grillé aux épices du Kivu
              </p>
            </div>
          </div>

          <div
            class="absolute -bottom-5 -left-5 -z-10 h-28 w-28 rounded-full border border-pri/30 sm:-bottom-7 sm:-left-7 sm:h-36 sm:w-36"
            aria-hidden="true"
          ></div>
        </div>
      </div>
    </section>

    <!-- OFFRE : bonne cuisine, petits prix -->
    <section class="border-y border-line bg-soft/70 py-16 sm:py-20">
      <div class="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-pri">
            L'offre qui rassemble
          </p>

          <h2 class="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Bonne cuisine,
            <span class="text-pri">petits prix.</span>
          </h2>

          <p class="mt-5 max-w-lg leading-7 text-mut">
            Retrouvez le plaisir de partager de bons plats inspirés des
            saveurs du Kivu.
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-5">
            <div>
              <p class="text-2xl font-extrabold">40+ personnes</p>
              <p class="mt-1 text-sm text-mut">en ont déjà profité</p>
            </div>

            <div class="rounded-xl bg-pri px-4 py-3 text-on-pri">
              <p class="text-xs font-bold uppercase tracking-wider">Offre du jour</p>
              <p class="text-3xl font-extrabold">50%</p>
            </div>
          </div>

          <p class="mt-4 max-w-lg text-xs leading-5 text-mut">
            Promotion et chiffres affichés selon la maquette de référence ;
            vérifiez les conditions et la disponibilité de l'offre auprès du restaurant.
          </p>
        </div>

        <div class="relative">
          <img
            src="https://images.unsplash.com/photo-1529563021893-cc83c992d75d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200"
            alt="Brochettes grillées"
            class="h-80 w-full rounded-3xl object-cover shadow-xl sm:h-[420px]"
            loading="lazy"
          />

          <div class="absolute bottom-4 left-4 rounded-xl border border-line bg-card/95 px-5 py-3 shadow-lg backdrop-blur">
            <p class="text-sm text-mut">Sélection du chef</p>
            <p class="font-bold">Brochettes grillées</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PLATS DU JOUR : données issues de l'API -->
    <section class="py-16 sm:py-20 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-pri">
              Sélection du chef
            </p>
            <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span class="text-pri">⌜</span>Nos plats du jour<span class="text-pri">⌟</span>
            </h2>
            <p class="mt-3 inline-flex rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-mut">
              Panier : <span class="ml-1 text-pri">{{ nbArticles }}</span>
              <span class="ml-1">{{ nbArticles === 1 ? 'article' : 'articles' }}</span>
            </p>
          </div>

          <NuxtLink
            to="/carte"
            class="inline-flex w-fit items-center gap-2 font-semibold text-pri transition hover:text-acc"
          >
            Voir toute la carte <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>

        <UiEtat
          :chargement="pending"
          :erreur="error"
          :vide="!data?.plats?.length"
          message-vide="Nos plats seront bientôt disponibles. Revenez nous voir !"
          @reessayer="refresh"
        >
          <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="(plat, index) in (data?.plats ?? []).slice(0, 3)"
              :key="plat.id"
              class="min-w-0 overflow-hidden rounded-2xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div class="group block">
                <div class="overflow-hidden">
                  <img
                    :src="photoDuPlat(plat, index)"
                    :alt="plat.nom"
                    class="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div class="p-5">
                  <p class="text-sm font-semibold text-pri">
                    {{ plat.categorieNom || plat.categorie || 'Sélection du chef' }}
                  </p>

                  <h3 class="mt-2 text-xl font-bold">
                    {{ plat.nom }}
                  </h3>

                  <p class="mt-2 line-clamp-3 text-sm leading-6 text-mut">
                    {{ plat.description }}
                  </p>

                  <div class="mt-5 flex items-center justify-between gap-3">
                    <p class="font-extrabold">
                      {{ plat.prix != null ? `${plat.prix} $` : '' }}
                    </p>
                    <button
                      type="button"
                      class="rounded-full bg-pri px-4 py-2 text-sm font-semibold text-on-pri transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-pri focus:ring-offset-2"
                      @click="commander(plat)"
                    >
                      Commander →
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </UiEtat>
      </div>
    </section>

    <!-- NOTRE CARTE -->
    <section class="border-y border-line bg-soft/50 py-16 sm:py-20 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-pri">
              Saveurs de chez nous
            </p>
            <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span class="text-pri">⌜</span>Notre carte<span class="text-pri">⌟</span>
            </h2>
            <p class="mt-3 inline-flex rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-mut">
              Panier : <span class="ml-1 text-pri">{{ nbArticles }}</span>
              <span class="ml-1">{{ nbArticles === 1 ? 'article' : 'articles' }}</span>
            </p>
          </div>

          <NuxtLink
            to="/carte"
            class="inline-flex w-fit items-center gap-2 font-semibold text-pri transition hover:text-acc"
          >
            Voir toute la carte <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>

        <!-- Les catégories sont dynamiques ; le filtrage complet appartient à /carte. -->
        <div v-if="data?.categories?.length" class="mt-7 flex flex-wrap gap-2">
          <NuxtLink
            to="/carte"
            class="rounded-full bg-pri px-4 py-2 text-sm font-semibold text-on-pri"
          >
            Tout
          </NuxtLink>

          <NuxtLink
            v-for="categorie in data.categories"
            :key="categorie.id"
            to="/carte"
            class="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition hover:border-pri hover:text-pri"
          >
            {{ categorie.nom }}
          </NuxtLink>
        </div>

        <div class="mt-8">
          <UiEtat
            :chargement="pending"
            :erreur="error"
            :vide="!data?.plats?.length"
            message-vide="La carte est en cours de préparation."
            @reessayer="refresh"
          >
            <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <li
                v-for="(plat, index) in (data?.plats ?? []).slice(0, 6)"
                :key="plat.id"
                class="min-w-0 overflow-hidden rounded-2xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div class="group block">
                  <div class="overflow-hidden">
                    <img
                      :src="photoDuPlat(plat, index)"
                      :alt="plat.nom"
                      class="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div class="p-5">
                    <p class="text-sm font-semibold text-pri">
                      {{ plat.categorieNom || plat.categorie || 'Saveurs de chez nous' }}
                    </p>

                    <h3 class="mt-2 text-xl font-bold">
                      {{ plat.nom }}
                    </h3>

                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-mut">
                      {{ plat.description }}
                    </p>

                    <div class="mt-4 flex items-center justify-between gap-3">
                      <p v-if="plat.prix != null" class="font-extrabold">
                        {{ plat.prix }} $
                      </p>
                      <button
                        type="button"
                        class="rounded-full bg-pri px-4 py-2 text-sm font-semibold text-on-pri transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-pri focus:ring-offset-2"
                        @click="commander(plat)"
                      >
                        Commander →
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </UiEtat>
        </div>
      </div>
    </section>

    <!-- TÉMOIGNAGES -->
    <section class="py-16 sm:py-20 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-pri">
            Paroles gourmandes
          </p>
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span class="text-pri">⌜</span>Ce que disent nos clients<span class="text-pri">⌟</span>
          </h2>
        </div>

        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <article
            v-for="avis in avisClients"
            :key="avis.numero"
            class="flex h-full flex-col rounded-2xl border border-line bg-card p-6 shadow-sm"
          >
            <span class="text-5xl leading-none text-pri" aria-hidden="true">“</span>

            <p class="mt-3 flex-1 leading-7 text-mut">
              {{ avis.texte }}
            </p>

            <p class="mt-5 font-semibold tracking-wider text-pri" aria-label="5 étoiles sur 5">
              ★★★★★
            </p>

            <div class="mt-5 flex items-center gap-3 border-t border-line pt-5">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-pri/10 font-bold text-pri">
                {{ avis.initiales }}
              </div>

              <div>
                <p class="font-bold">{{ avis.nom }}</p>
                <p class="mt-1 text-xs text-mut">Cliente vérifiée</p>
              </div>

              <span class="ml-auto text-sm font-bold text-pri">{{ avis.numero }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- LE CHEF / NOTRE HISTOIRE -->
    <section class="border-y border-line bg-soft/60 py-16 sm:py-20 lg:py-24">
      <div class="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div class="relative">
          <img
            src="https://images.unsplash.com/photo-1668270973870-bb22ba5d1381?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1000"
            alt="Chef de SmartResto en cuisine"
            class="h-[360px] w-full rounded-3xl object-cover shadow-xl sm:h-[460px]"
            loading="lazy"
          />

          <div class="absolute -bottom-5 -right-3 rounded-2xl border border-line bg-card px-5 py-4 shadow-lg sm:-right-5">
            <p class="text-sm text-mut">Cuisine de racines</p>
            <p class="font-bold">Tournée vers demain</p>
          </div>
        </div>

        <div class="pt-4 lg:pt-0">
          <p class="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-pri">
            La main derrière les saveurs
          </p>

          <h2 class="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Une cuisine de racines,
            <span class="text-pri">tournée vers demain.</span>
          </h2>

          <p class="mt-6 leading-8 text-mut">
            Le chef Patrick Murhula compose une cuisine vivante, guidée par
            les produits du lac, les récoltes locales et les gestes transmis
            par sa famille.
          </p>

          <blockquote class="mt-6 border-l-4 border-pri pl-5 text-lg italic leading-8">
            « Notre plus bel ingrédient, c'est la mémoire du Kivu. »
          </blockquote>

          <div class="mt-8">
            <UiBouton to="/a-propos">
              Découvrir l'équipe
            </UiBouton>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA RÉSERVATION -->
    <section class="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div class="mx-auto max-w-7xl">
        <div class="relative isolate overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-12 sm:px-10 sm:py-16 lg:rounded-[2.5rem] lg:px-16 lg:py-20">
          <div
            class="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-pri/20 blur-3xl sm:h-96 sm:w-96"
            aria-hidden="true"
          ></div>

          <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-pri">
              La chaleur du Kivu dans chaque assiette
            </p>

            <h2 class="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Une table vous attend.
            </h2>

            <p class="mt-5 max-w-xl leading-7 text-neutral-300 sm:text-lg">
              Réservez votre table et partagez un moment gourmand autour des
              saveurs du Kivu.
            </p>

            <div class="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <UiBouton to="/reserver" taille="lg">
                Réserver une table
              </UiBouton>

              <UiBouton to="/carte" variante="secondaire" taille="lg">
                Voir la carte
              </UiBouton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
