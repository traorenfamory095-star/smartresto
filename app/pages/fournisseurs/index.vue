<script setup>
const { lister } = useFournisseurs()
const fournisseurs = ref([])
const chargement = ref(true)
const erreurMsg = ref(null)
const recherche = ref('')
const categorie = ref('')

const filtres = computed(() => filtrerFournisseurs(fournisseurs.value, { recherche: recherche.value, categorie: categorie.value }))
const categories = computed(() => [...new Set(fournisseurs.value.map(f => f.categorie))])

onMounted(async () => {
  try { fournisseurs.value = await lister() }
  catch (e) { erreurMsg.value = e.message }
  finally { chargement.value = false }
})
</script>

<template>
  <main class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-orange-600">Gestion des achats</p>
        <h1 class="mt-1 text-3xl font-bold text-gray-900">Fournisseurs</h1>
        <p class="mt-2 text-sm text-gray-500">Retrouvez vos partenaires et les produits qu’ils proposent.</p>
      </div>
      <NuxtLink
        to="/fournisseurs/nouveau"
        class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        <span aria-hidden="true" class="mr-2 text-lg leading-none">+</span>
        Nouveau fournisseur
      </NuxtLink>
    </header>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-sm text-gray-500">Fournisseurs enregistrés</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{{ fournisseurs.length }}</p>
        <p class="mt-1 text-sm text-gray-500">Partenaires de votre restaurant</p>
      </div>
      <div class="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
        <p class="text-sm font-medium text-orange-800">Catégories représentées</p>
        <p class="mt-2 text-3xl font-bold text-orange-800">{{ categories.length }}</p>
        <p class="mt-1 text-sm text-orange-700">Types de produits disponibles</p>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-4">
        <h2 class="font-semibold text-gray-900">Rechercher un partenaire</h2>
        <p class="mt-1 text-sm text-gray-500">Filtrez par nom ou par catégorie.</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Nom du fournisseur</span>
          <input
            v-model="recherche"
            type="search"
            placeholder="Ex. : Maraîchers..."
            aria-label="Rechercher"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Catégorie</span>
          <select
            v-model="categorie"
            aria-label="Catégorie"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          >
            <option value="">Toutes les catégories</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 class="font-semibold text-gray-900">Liste des fournisseurs</h2>
        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {{ filtres.length }} résultat(s)
        </span>
      </div>
      <div v-if="chargement" class="p-10 text-center text-sm text-gray-500" role="status">
        Chargement des fournisseurs…
      </div>
      <div v-else-if="erreurMsg" class="p-8 text-center" role="alert">
        <p class="font-medium text-red-700">Impossible de charger les fournisseurs.</p>
        <p class="mt-1 text-sm text-gray-500">{{ erreurMsg }}</p>
      </div>
      <ul v-else-if="filtres.length" class="divide-y divide-gray-100">
        <li
          v-for="f in filtres"
          :key="f.id"
          class="flex flex-col gap-4 px-5 py-4 transition hover:bg-orange-50/50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
              {{ f.nom.slice(0, 1).toUpperCase() }}
            </span>
            <div class="min-w-0">
              <p class="truncate font-semibold text-gray-900">{{ f.nom }}</p>
              <span class="mt-1 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {{ f.categorie }}
              </span>
              <p class="mt-2 break-all text-sm text-gray-500">{{ f.telephone || 'Téléphone non renseigné' }} · {{ f.email || 'E-mail non renseigné' }}</p>
            </div>
          </div>
          <NuxtLink
            :to="`/fournisseurs/${f.id}`"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:shrink-0"
          >
            Voir la fiche
            <span aria-hidden="true" class="ml-2">→</span>
          </NuxtLink>
        </li>
      </ul>
      <div v-else class="px-5 py-12 text-center">
        <p class="font-semibold text-gray-900">Aucun fournisseur trouvé</p>
        <p class="mt-1 text-sm text-gray-500">Essayez une autre recherche ou ajoutez un fournisseur.</p>
      </div>
    </section>
  </main>
</template>
