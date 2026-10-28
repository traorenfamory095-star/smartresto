<script setup>
useHead({ title: 'Personnel — SmartResto' })

const { obtenirPersonnel } = usePersonnel()

const {
  data: employes,
  status,
  error,
  refresh,
} = await useAsyncData(
  'personnel-liste',
  obtenirPersonnel,
  {
    default: () => [],
    lazy: true,
  },
)
</script>

<template>
  <section aria-labelledby="titre-personnel">
    <h1 id="titre-personnel" class="text-3xl font-bold">
      Personnel
    </h1>
    
    <p class="mt-2 text-gris">
      Les employés du restaurant, leurs rôles et leurs statuts.
    </p>
    <NuxtLink
        to="/personnel/nouveau"
        class="mt-4 inline-block rounded-lg border border-bordure px-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-accent"
      >
        Ajouter un employé
      </NuxtLink>
      <th scope="col" class="px-4 py-3">Actions</th>

    <p
      v-if="status === 'pending' || status === 'idle'"
      role="status"
      class="mt-6"
    >
      Chargement du personnel…
    </p>

    <div
      v-else-if="error"
      role="alert"
      class="mt-6 rounded-xl border border-red-500 p-4"
    >
      <p>{{ error.message || 'Impossible de charger le personnel.' }}</p>

      <button
        type="button"
        class="mt-3 rounded-lg border px-4 py-2"
        @click="refresh()"
      >
        Réessayer
      </button>
    </div>

    <p v-else-if="employes.length === 0" class="mt-6">
      Aucun employé enregistré.
    </p>

    <div
      v-else
      role="region"
      aria-label="Liste du personnel"
      tabindex="0"
      class="mt-6 overflow-x-auto rounded-xl border border-bordure focus-visible:outline-2 focus-visible:outline-accent"
    >
      <table class="w-full text-left text-sm">
        <caption class="sr-only">
          Employés, rôles et statuts
        </caption>

        <thead class="border-b border-bordure">
          <tr>
            <th scope="col" class="px-4 py-3">Nom</th>
            <th scope="col" class="px-4 py-3">E-mail</th>
            <th scope="col" class="px-4 py-3">Rôle</th>
            <th scope="col" class="px-4 py-3">Statut</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="employe in employes"
            :key="employe.id"
            class="border-b border-bordure last:border-b-0"
          >
            <th scope="row" class="px-4 py-3 font-medium">
              {{ employe.nom }}
            </th>

            <td class="px-4 py-3">
              {{ employe.email }}
            </td>

            <td class="px-4 py-3">
              {{ libelleRole(employe.role) }}
            </td>

            <td class="px-4 py-3">
              {{ employe.actif ? 'Actif' : 'Inactif' }}
            </td>
            <td class="px-4 py-3">
            <NuxtLink
              :to="`/personnel/${employe.id}`"
              :aria-label="`Modifier ${employe.nom}`"
              class="inline-block rounded-lg border border-bordure px-3 py-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Modifier
            </NuxtLink>
          </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>