```vue
<script setup>
import { computed, ref } from 'vue'

useHead({ title: 'Gestion du stock | SmartResto' })

const { lire } = useApi()

const recherche = ref('')
const filtre = ref('tous')
const tri = ref('nom')

const {
  data: ingredients,
  pending,
  error,
  refresh,
} = await useAsyncData(
  'stock-ingredients',
  () => lire('/ingredients'),
  { default: () => [] },
)

const listeIngredients = computed(() => ingredients.value ?? [])

const estEnAlerte = (ingredient) =>
  Number(ingredient.stock) <= Number(ingredient.seuilAlerte)

const nombreAlertes = computed(
  () => listeIngredients.value.filter(estEnAlerte).length,
)

const ingredientsFiltres = computed(() => {
  const terme = recherche.value.trim().toLowerCase()

  let resultat = listeIngredients.value.filter((ingredient) => {
    const correspondRecherche = ingredient.nom
      ?.toLowerCase()
      .includes(terme)

    const correspondFiltre =
      filtre.value === 'tous' ||
      (filtre.value === 'alerte' && estEnAlerte(ingredient)) ||
      (filtre.value === 'normal' && !estEnAlerte(ingredient))

    return correspondRecherche && correspondFiltre
  })

  resultat = [...resultat]

  if (tri.value === 'nom') {
    resultat.sort((a, b) => a.nom.localeCompare(b.nom))
  } else if (tri.value === 'stock-croissant') {
    resultat.sort((a, b) => Number(a.stock) - Number(b.stock))
  } else if (tri.value === 'stock-decroissant') {
    resultat.sort((a, b) => Number(b.stock) - Number(a.stock))
  }

  return resultat
})

const niveauStock = (ingredient) => {
  const seuil = Number(ingredient.seuilAlerte)
  const stock = Number(ingredient.stock)

  if (seuil <= 0) return stock > 0 ? 100 : 0

  return Math.min(100, Math.max(0, (stock / (seuil * 2)) * 100))
}

const classeJauge = (ingredient) =>
  estEnAlerte(ingredient) ? 'bg-err' : 'bg-pri'

const libelleEtat = (ingredient) =>
  estEnAlerte(ingredient) ? 'Stock faible' : 'Normal'

const formaterNombre = (valeur) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(Number(valeur) || 0)
</script>

<template>
  <main class="min-h-screen space-y-6 bg-bg p-4 text-ink sm:p-6">
    <!-- En-tête -->
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p class="mt-2 text-sm text-mut">
          Administration / Stock
        </p>
        <h1 class="text-2xl font-bold tracking-tight text-head sm:text-3xl">
          Stock
        </h1>
        <p class="mt-2 text-sm text-mut">
          Gardez un oeil sur vos ingrédients.
        </p>
      </div>

      <NuxtLink
        to="/stock/nouveau"
        class="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-degrade px-4 py-3 font-semibold text-on-pri transition-opacity hover:opacity-90"
      >
        <span class="text-lg">+</span>
        Nouvel ingrédient
      </NuxtLink>
    </header>

    <!-- Alerte -->
    <section
      v-if="nombreAlertes > 0"
      class="flex flex-col gap-3 rounded-carte border border-err/30 bg-err/5 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div class="flex items-start gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-err/10 text-xl text-err">
          !
        </span>

        <div>
          <h2 class="font-semibold text-err">
            Attention : stock faible
          </h2>
          <p class="mt-1 text-sm text-mut">
            {{ nombreAlertes }}
            ingrédient{{ nombreAlertes > 1 ? 's sont' : ' est' }}
            au seuil d’alerte ou en dessous.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="self-start text-sm font-semibold text-err underline underline-offset-4 sm:self-center"
        @click="filtre = 'alerte'"
      >
        Voir les alertes
      </button>
    </section>

    <!-- Indicateurs -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <article class="rounded-carte border border-line bg-card p-5">
        <p class="text-sm font-medium text-mut">
          Total des ingrédients
        </p>

        <div class="mt-3 flex items-end justify-between gap-3">
          <p class="text-3xl font-bold text-head">
            {{ listeIngredients.length }}
          </p>
          <span class="rounded-xl bg-soft px-3 py-2 text-sm text-mut">
            Références
          </span>
        </div>
      </article>

      <article class="rounded-carte border border-line bg-card p-5">
        <p class="text-sm font-medium text-mut">
          Ingrédients en alerte
        </p>

        <div class="mt-3 flex items-end justify-between gap-3">
          <p
            class="text-3xl font-bold"
            :class="nombreAlertes > 0 ? 'text-err' : 'text-ok'"
          >
            {{ nombreAlertes }}
          </p>
          <span
            class="rounded-xl px-3 py-2 text-sm"
            :class="nombreAlertes > 0
              ? 'bg-err/10 text-err'
              : 'bg-ok/10 text-ok'"
          >
            {{ nombreAlertes > 0 ? 'À surveiller' : 'Tout va bien' }}
          </span>
        </div>
      </article>
    </section>

    <!-- Navigation du stock -->
    <nav class="flex flex-wrap gap-2 border-b border-line pb-3">
      <NuxtLink
        to="/stock"
        class="rounded-xl bg-degrade px-4 py-2 text-sm font-semibold text-on-pri"
      >
        État du stock
      </NuxtLink>

      <NuxtLink
        to="/stock/mouvements"
        class="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-mut transition-colors hover:text-pri"
      >
        Historique des mouvements
      </NuxtLink>
    </nav>

    <!-- Recherche et filtres -->
    <section class="space-y-4 rounded-carte border border-line bg-card p-4 sm:p-5">
      <div>
        <h2 class="font-semibold text-head">
          Liste des ingrédients
        </h2>
        <p class="mt-1 text-sm text-mut">
          {{ ingredientsFiltres.length }} résultat{{ ingredientsFiltres.length > 1 ? 's' : '' }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px_220px]">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-mut">
            Rechercher
          </span>
          <input
            v-model="recherche"
            type="search"
            placeholder="Nom d’un ingrédient..."
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition focus:border-pri focus:ring-2 focus:ring-pri/20"
          />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-mut">
            État du stock
          </span>
          <select
            v-model="filtre"
            class="w-full rounded-xl border border-line bg-bg px-3 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
          >
            <option value="tous">Tous les ingrédients</option>
            <option value="alerte">Stock faible</option>
            <option value="normal">Stock normal</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-mut">
            Trier par
          </span>
          <select
            v-model="tri"
            class="w-full rounded-xl border border-line bg-bg px-3 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
          >
            <option value="nom">Nom (A–Z)</option>
            <option value="stock-croissant">Stock croissant</option>
            <option value="stock-decroissant">Stock décroissant</option>
          </select>
        </label>
      </div>
    </section>

    <!-- Chargement -->
    <section
      v-if="pending"
      class="rounded-carte border border-line bg-card p-10 text-center"
    >
      <p class="text-mut">Chargement des ingrédients...</p>
    </section>

    <!-- Erreur -->
    <section
      v-else-if="error"
      class="rounded-carte border border-err/30 bg-card p-6 text-center"
    >
      <p class="font-semibold text-err">
        Impossible de charger les ingrédients.
      </p>
      <p class="mt-2 text-sm text-mut">
        Vérifiez que l’API est démarrée, puis réessayez.
      </p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-degrade px-4 py-2.5 font-semibold text-on-pri"
        @click="refresh()"
      >
        Réessayer
      </button>
    </section>

    <!-- Tableau -->
    <section
      v-else
      class="overflow-hidden rounded-carte border border-line bg-card"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="border-b border-line bg-soft">
            <tr>
              <th class="px-5 py-4 font-semibold text-mut">Ingrédient</th>
              <th class="px-5 py-4 font-semibold text-mut">Stock actuel</th>
              <th class="px-5 py-4 font-semibold text-mut">Seuil d’alerte</th>
              <th class="px-5 py-4 font-semibold text-mut">Niveau du stock</th>
              <th class="px-5 py-4 font-semibold text-mut">État</th>
              <th class="px-5 py-4 text-right font-semibold text-mut">Action</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-line">
            <tr
              v-for="ingredient in ingredientsFiltres"
              :key="ingredient.id"
              class="transition-colors hover:bg-soft/60"
            >
              <td class="px-5 py-4">
                <NuxtLink
                  :to="`/stock/${ingredient.id}`"
                  class="font-semibold text-head transition-colors hover:text-pri"
                >
                  {{ ingredient.nom }}
                </NuxtLink>
                <p class="mt-1 text-xs text-mut">
                  Unité : {{ ingredient.unite }}
                </p>
              </td>

              <td class="px-5 py-4">
                <span
                  class="font-semibold"
                  :class="estEnAlerte(ingredient) ? 'text-err' : 'text-ink'"
                >
                  {{ formaterNombre(ingredient.stock) }}
                </span>
                <span class="ml-1 text-mut">{{ ingredient.unite }}</span>
              </td>

              <td class="px-5 py-4 text-mut">
                {{ formaterNombre(ingredient.seuilAlerte) }}
                {{ ingredient.unite }}
              </td>

              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-2 w-28 overflow-hidden rounded-full bg-soft">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="classeJauge(ingredient)"
                      :style="{ width: `${niveauStock(ingredient)}%` }"
                    />
                  </div>
                  <span class="text-xs text-mut">
                    {{ Math.round(niveauStock(ingredient)) }}%
                  </span>
                </div>
              </td>

              <td class="px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="estEnAlerte(ingredient)
                    ? 'bg-err/10 text-err'
                    : 'bg-ok/10 text-ok'"
                >
                  {{ libelleEtat(ingredient) }}
                </span>
              </td>

              <td class="px-5 py-4 text-right">
                <NuxtLink
                  :to="`/stock/mouvement?ingredientId=${ingredient.id}`"
                  class="inline-flex items-center justify-center rounded-lg border border-line px-3 py-2 text-xs font-semibold text-pri transition-colors hover:bg-pri/10"
                >
                  Mouvement
                </NuxtLink>
              </td>
            </tr>

            <tr v-if="ingredientsFiltres.length === 0">
              <td colspan="6" class="px-5 py-12 text-center">
                <p class="font-semibold text-head">
                  Aucun ingrédient trouvé
                </p>
                <p class="mt-2 text-sm text-mut">
                  Modifiez la recherche ou les filtres pour voir les résultats.
                </p>
                <button
                  type="button"
                  class="mt-4 text-sm font-semibold text-pri underline underline-offset-4"
                  @click="recherche = ''; filtre = 'tous'; tri = 'nom'"
                >
                  Réinitialiser les filtres
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
```