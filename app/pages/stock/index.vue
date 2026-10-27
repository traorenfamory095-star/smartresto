
<script setup>
import { computed, ref } from 'vue'

useHead({ title: 'Gestion du stock | SmartResto' })

const { lire } = useApi()

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

const recherche = ref('')
const seulementAlertes = ref(false)
const tri = ref('nom')

const nombreAlertes = computed(
  () => (ingredients.value ?? []).filter(
    (ingredient) => Number(ingredient.stock) <= Number(ingredient.seuilAlerte),
  ).length,
)

const ingredientsFiltres = computed(() => {
  const terme = recherche.value.trim().toLocaleLowerCase()

  return [...(ingredients.value ?? [])]
    .filter((ingredient) => {
      const correspondNom = ingredient.nom.toLocaleLowerCase().includes(terme)
      const estEnAlerte = Number(ingredient.stock) <= Number(ingredient.seuilAlerte)

      return correspondNom && (!seulementAlertes.value || estEnAlerte)
    })
    .sort((a, b) => {
      if (tri.value === 'stock') return Number(a.stock) - Number(b.stock)
      return a.nom.localeCompare(b.nom, 'fr')
    })
})
</script>

<template>
  <main class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p class="text-sm font-medium text-orange-600">GESTION DU RESTAURANT</p>
        <h1 class="mt-1 text-3xl font-bold text-gray-900">Gestion du stock</h1>
        <p class="mt-2 text-sm text-gray-500">
          Suivez les ingrédients et anticipez les ruptures de stock.
        </p>
      </div>

      <NuxtLink
        to="/stock/nouveau"
        class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        + Nouvel ingrédient
      </NuxtLink>
    </header>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-sm text-gray-500">Total des ingrédients</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">
          {{ ingredients.length }}
        </p>
        <p class="mt-1 text-sm text-gray-500">Références enregistrées</p>
      </div>

      <div class="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <p class="text-sm font-medium text-red-700">Ingrédients en alerte</p>
        <p class="mt-2 text-3xl font-bold text-red-700">
          {{ nombreAlertes }}
        </p>
        <p class="mt-1 text-sm text-red-600">Stock inférieur ou égal au seuil</p>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div class="flex-1">
          <label for="recherche-stock" class="mb-2 block text-sm font-medium text-gray-700">
            Rechercher un ingrédient
          </label>
          <input
            id="recherche-stock"
            v-model="recherche"
            type="search"
            placeholder="Ex. : Poulet, Riz, Tomates..."
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div>
          <label for="tri-stock" class="mb-2 block text-sm font-medium text-gray-700">
            Trier par
          </label>
          <select
            id="tri-stock"
            v-model="tri"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="nom">Nom (A à Z)</option>
            <option value="stock">Stock le plus faible</option>
          </select>
        </div>

        <label class="flex items-center gap-2 pb-3 text-sm text-gray-700">
          <input
            v-model="seulementAlertes"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 accent-orange-600"
          />
          Alertes uniquement
        </label>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 class="font-semibold text-gray-900">Inventaire des ingrédients</h2>
        <span class="text-sm text-gray-500">
          {{ ingredientsFiltres.length }} résultat(s)
        </span>
      </div>

      <div v-if="pending" class="p-10 text-center text-gray-500" role="status">
        Chargement des ingrédients...
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <p class="font-medium text-red-700">Impossible de charger le stock.</p>
        <p class="mt-2 text-sm text-gray-500">
          Vérifie que le serveur API fonctionne, puis réessaie.
        </p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          @click="refresh()"
        >
          Réessayer
        </button>
      </div>

      <div v-else-if="ingredientsFiltres.length === 0" class="p-10 text-center">
        <p class="font-medium text-gray-800">Aucun ingrédient trouvé.</p>
        <p class="mt-1 text-sm text-gray-500">
          Modifie ta recherche ou désactive le filtre des alertes.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[680px] text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" class="px-5 py-4">Ingrédient</th>
              <th scope="col" class="px-5 py-4">Stock disponible</th>
              <th scope="col" class="px-5 py-4">Seuil d'alerte</th>
              <th scope="col" class="px-5 py-4">Prix unitaire</th>
              <th scope="col" class="px-5 py-4">État</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="ingredient in ingredientsFiltres"
              :key="ingredient.id"
              class="transition hover:bg-gray-50"
            >
              <td class="px-5 py-4 font-medium text-gray-900">
                {{ ingredient.nom }}
                <p class="mt-1 text-xs font-normal text-gray-500">
                  Référence #{{ ingredient.id }}
                </p>
              </td>

              <td class="px-5 py-4">
                <span class="font-semibold text-gray-900">
                  {{ ingredient.stock }} {{ ingredient.unite }}
                </span>
                <div class="mt-2 h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                  <div
                    class="h-full rounded-full"
                    :class="Number(ingredient.stock) <= Number(ingredient.seuilAlerte)
                      ? 'bg-red-500'
                      : 'bg-emerald-500'"
                    :style="{
                      width: `${Math.min(100, Math.max(0, Number(ingredient.stock) / Math.max(Number(ingredient.seuilAlerte) * 2, 1) * 100))}%`,
                    }"
                  />
                </div>
              </td>

              <td class="px-5 py-4 text-gray-600">
                {{ ingredient.seuilAlerte }} {{ ingredient.unite }}
              </td>

              <td class="px-5 py-4 text-gray-600">
                {{ Number(ingredient.prixUnitaire).toFixed(2) }} $
              </td>

              <td class="px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="Number(ingredient.stock) <= Number(ingredient.seuilAlerte)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ Number(ingredient.stock) <= Number(ingredient.seuilAlerte)
                    ? 'Stock bas'
                    : 'Disponible' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

