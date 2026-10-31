<script setup>
import { infoStatut } from '~/utils/statuts'

const route = useRoute()
const router = useRouter()
const { lire, modifier, supprimer, listerAppro } = useFournisseurs()
const api = useApi()
const { succes, erreur } = useNotifier()
const fournisseur = ref(null)
const ingredients = ref([])
const appros = ref([])
const chargement = ref(true)

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const [f, i, a] = await Promise.all([
      lire(id),
      api.lire('/ingredients', { fournisseurId: id }),
      listerAppro()
    ])
    fournisseur.value = f
    ingredients.value = i
    appros.value = a.filter(x => x.fournisseurId === id)
  } catch (e) { erreur(e.message) }
  finally { chargement.value = false }
})

async function enregistrer() {
  try { await modifier(fournisseur.value.id, fournisseur.value); succes('Enregistré') }
  catch (e) { erreur(e.message) }
}

async function retirer() {
  if (!confirm('Supprimer ?')) return
  try { await supprimer(fournisseur.value.id); router.push('/fournisseurs') }
  catch (e) { erreur(e.message) }
}
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6">
    <NuxtLink to="/fournisseurs" class="text-sm font-semibold text-orange-700 transition hover:text-orange-800">
      <span aria-hidden="true">←</span> Retour aux fournisseurs
    </NuxtLink>
    <p v-if="chargement" class="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500" role="status">
      Chargement de la fiche fournisseur…
    </p>
    <template v-else-if="fournisseur">
      <header class="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 sm:flex-row sm:items-center">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl font-bold text-orange-700">
          {{ fournisseur.nom.slice(0, 1).toUpperCase() }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold uppercase tracking-wide text-orange-700">Fiche fournisseur</p>
          <h1 class="mt-1 break-words text-2xl font-bold text-gray-900">{{ fournisseur.nom }}</h1>
          <span class="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {{ fournisseur.categorie }}
          </span>
        </div>
        <button type="button" class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" @click="retirer">
          Supprimer
        </button>
      </header>

      <form class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" @submit.prevent="enregistrer">
        <div class="mb-5">
          <h2 class="font-semibold text-gray-900">Coordonnées</h2>
          <p class="mt-1 text-sm text-gray-500">Modifiez les informations utilisées pour contacter ce fournisseur.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-gray-700">Nom</span>
            <input v-model="fournisseur.nom" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-gray-700">Catégorie</span>
            <input v-model="fournisseur.categorie" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-gray-700">Téléphone</span>
            <input v-model="fournisseur.telephone" type="tel" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-gray-700">Adresse e-mail</span>
            <input v-model="fournisseur.email" type="email" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          </label>
        </div>
        <div class="mt-5 flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
            Enregistrer les modifications
          </button>
        </div>
      </form>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-5 py-4">
            <h2 class="font-semibold text-gray-900">Ingrédients fournis</h2>
            <p class="mt-1 text-sm text-gray-500">Produits associés à ce fournisseur.</p>
          </div>
          <ul v-if="ingredients.length" class="divide-y divide-gray-100">
            <li v-for="i in ingredients" :key="i.id" class="flex items-center justify-between gap-3 px-5 py-3">
              <span class="font-medium text-gray-800">{{ i.nom }}</span>
              <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">{{ i.stock }} {{ i.unite }}</span>
            </li>
          </ul>
          <p v-else class="px-5 py-8 text-center text-sm text-gray-500">Aucun ingrédient associé pour le moment.</p>
        </section>

        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-5 py-4">
            <h2 class="font-semibold text-gray-900">Historique des approvisionnements</h2>
            <p class="mt-1 text-sm text-gray-500">Commandes passées auprès de ce fournisseur.</p>
          </div>
          <ul v-if="appros.length" class="divide-y divide-gray-100">
            <li v-for="a in appros" :key="a.id" class="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p class="font-medium text-gray-800">Commande #{{ a.id }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ a.dateCommande || 'Date non renseignée' }}</p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="a.statut === 'recue' ? 'bg-emerald-100 text-emerald-800' : a.statut === 'a_verifier' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'"
              >
                {{ infoStatut('approvisionnement', a.statut).libelle }}
              </span>
            </li>
          </ul>
          <p v-else class="px-5 py-8 text-center text-sm text-gray-500">Aucun approvisionnement enregistré.</p>
        </section>
      </div>
    </template>
  </main>
</template>
