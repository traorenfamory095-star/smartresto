<script setup>
// Page « Spéciaux » : les plats disponibles aux prix les plus doux, lus dans l'API.
// Propriétaire : Traoré (site public). Aucune offre ni réduction n'est inventée.
definePageMeta({ layout: 'public' })
useHead({
  title: 'Spéciaux | SmartResto',
  meta: [{ name: 'description', content: 'Les plats les plus doux pour le portefeuille, à savourer sur place.' }],
})

const { lire } = useApi()
const panier = usePanierPublic()
const panierOuvert = ref(false)

const { data, pending, error, refresh } = await useAsyncData('speciaux', async () => {
  // Deux lectures en parallèle ; le tri et le choix se font en JavaScript (utils/speciaux.js).
  const [plats, categories] = await Promise.all([lire('/plats', { disponible: true }), lire('/categories')])
  return { speciaux: choisirSpeciaux(plats, categories, 6), categories }
})

const speciaux = computed(() => data.value?.speciaux ?? [])
const vedette = computed(() => speciaux.value[0] ?? null)
const nomCategorie = (plat) => data.value?.categories?.find((c) => c.id === plat.categorieId)?.nom ?? ''

// Confirmation visible (et annoncée aux lecteurs d'écran), effacée au bout de 3 s.
const message = ref('')
let minuteur
function commander(plat) {
  panier.ajouter(plat)
  message.value = `${plat.nom} ajouté à votre commande.`
  clearTimeout(minuteur)
  minuteur = setTimeout(() => { message.value = '' }, 3000)
}
onUnmounted(() => clearTimeout(minuteur))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <div
      v-if="message"
      role="status"
      aria-live="polite"
      class="fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-line bg-card px-5 py-4 font-semibold text-ink shadow-2xl"
    >
      {{ message }}
    </div>

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.2em] text-acc">Les bons moments ont meilleur goût</p>
        <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Nos <span class="text-acc">spéciaux</span></h1>
        <p class="mt-4 max-w-xl text-mut">
          Des assiettes généreuses aux prix les plus doux de la carte, à savourer sur place.
        </p>
      </div>
      <UiBouton variante="secondaire" @click="panierOuvert = true">
        Ma commande ({{ panier.nbArticles.value }})
      </UiBouton>
    </header>

    <div class="mt-10">
      <UiEtat
        :chargement="pending"
        :erreur="error"
        :vide="!speciaux.length"
        message-vide="Aucun plat à afficher pour le moment."
        @reessayer="refresh"
      >
        <!-- Bandeau : le plat le moins cher du moment, avec son vrai prix -->
        <section
          v-if="vedette"
          class="grid items-center gap-6 rounded-carte-lg border border-dashed border-line bg-card p-6 sm:p-10 md:grid-cols-[1fr_auto]"
          aria-labelledby="titre-vedette"
        >
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-acc">Le plus doux du moment</p>
            <h2 id="titre-vedette" class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{{ vedette.nom }}</h2>
            <p class="mt-3 max-w-lg text-mut">{{ vedette.description }}</p>
            <UiBouton class="mt-6" @click="commander(vedette)">Commander</UiBouton>
          </div>
          <div class="rounded-2xl bg-degrade px-8 py-6 text-center text-on-pri">
            <p class="text-xs font-bold uppercase tracking-wider">À partir de</p>
            <p class="mt-1 text-4xl font-extrabold">{{ formaterPrix(vedette.prix) }}</p>
          </div>
        </section>

        <section class="mt-14" aria-labelledby="titre-offres">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-acc">Une raison de se faire plaisir</p>
          <h2 id="titre-offres" class="mt-3 text-3xl font-extrabold tracking-tight">
            Les plats les plus <span class="text-acc">doux</span>
          </h2>

          <ul class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="plat in speciaux" :key="plat.id">
              <PublicPlatOffre :plat="plat" :categorie="nomCategorie(plat)" @commander="commander" />
            </li>
          </ul>
        </section>
      </UiEtat>
    </div>

    <div class="mt-12 text-center">
      <UiBouton to="/carte" variante="secondaire" taille="lg">Voir toute la carte</UiBouton>
    </div>

    <PublicPanier v-model="panierOuvert" />
  </div>
</template>