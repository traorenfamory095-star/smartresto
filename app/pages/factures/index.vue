<script setup>
useHead({
  title: 'Factures',
})

const { listerFactures } = useFactures()

const recherche = ref('')
const statutSelectionne = ref('tous')

const {
  data: factures,
  pending,
  error,
  refresh,
} = await useAsyncData(
  'factures',
  () => listerFactures(),
  {
    default: () => [],
  }
)

const facturesFiltrees = computed(() => {
  const texte = recherche.value.trim().toLowerCase()

  return factures.value.filter((facture) => {
    const correspondNumero =
      facture.numero.toLowerCase().includes(texte)

    const correspondStatut =
      statutSelectionne.value === 'tous' ||
      facture.statut === statutSelectionne.value

    return correspondNumero && correspondStatut
  })
})

function libelleStatut(statut) {
  const libelles = {
    emise: 'Émise',
    payee: 'Payée',
    annulee: 'Annulée',
  }

  return libelles[statut] ?? statut
}

function classeStatut(statut) {
  const classes = {
    emise: 'bg-orange-100 text-orange-700',
    payee: 'bg-green-100 text-green-700',
    annulee: 'bg-red-100 text-red-700',
  }

  return classes[statut] ?? 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <section class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-3xl font-bold">
        Factures
      </h1>

      <p class="mt-2 text-gris">
        Consultez et recherchez les factures du restaurant.
      </p>
    </div>

    <!-- Filtres -->
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label
          for="recherche"
          class="mb-2 block font-medium"
        >
          Rechercher par numéro
        </label>

        <input
          id="recherche"
          v-model="recherche"
          type="search"
          placeholder="Ex. F-2026-0019"
          class="w-full rounded-lg border border-bordure px-3 py-2"
        >
      </div>

      <div>
        <label
          for="statut"
          class="mb-2 block font-medium"
        >
          Statut
        </label>

        <select
          id="statut"
          v-model="statutSelectionne"
          class="w-full rounded-lg border border-bordure px-3 py-2"
        >
          <option value="tous">
            Tous
          </option>

          <option value="emise">
            Émise
          </option>

          <option value="payee">
            Payée
          </option>

          <option value="annulee">
            Annulée
          </option>
        </select>
      </div>
    </div>

    <!-- Chargement -->
    <p
      v-if="pending"
      class="text-gris"
    >
      Chargement des factures...
    </p>

    <!-- Erreur -->
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <p class="font-medium text-red-700">
        Impossible de charger les factures.
      </p>

      <p class="mt-1 text-sm text-red-600">
        {{ error.message }}
      </p>

      <button
        type="button"
        class="mt-3 rounded-lg border px-3 py-2"
        @click="refresh"
      >
        Réessayer
      </button>
    </div>

    <!-- Aucun résultat -->
    <p
      v-else-if="facturesFiltrees.length === 0"
      class="text-gris"
    >
      Aucune facture trouvée.
    </p>

    <!-- Tableau -->
    <div
      v-else
      class="overflow-x-auto rounded-lg border border-bordure"
    >
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              Numéro
            </th>

            <th class="px-4 py-3 text-left">
              Commande
            </th>

            <th class="px-4 py-3 text-left">
              Date
            </th>

            <th class="px-4 py-3 text-left">
              Total
            </th>

            <th class="px-4 py-3 text-left">
              Statut
            </th>

            <th class="px-4 py-3 text-left">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="facture in facturesFiltrees"
            :key="facture.id"
            class="border-t border-bordure"
          >
            <td class="px-4 py-3 font-medium">
              {{ facture.numero }}
            </td>

            <td class="px-4 py-3">
              #{{ facture.commandeId }}
            </td>

            <td class="px-4 py-3">
              {{ formaterDate(facture.creeLe) }}
            </td>

            <td class="px-4 py-3">
              {{ formaterPrix(facture.total) }}
            </td>

            <td class="px-4 py-3">
              <span
                class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                :class="classeStatut(facture.statut)"
              >
                {{ libelleStatut(facture.statut) }}
              </span>
            </td>

            <td class="px-4 py-3">
              <NuxtLink
                :to="`/factures/${facture.id}`"
                class="font-medium text-orange-600 hover:underline"
              >
                Voir
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>