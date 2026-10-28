<script setup>
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
  <section class="max-w-3xl">
    <p v-if="chargement">Chargement…</p>
    <template v-else-if="fournisseur">
      <h1 class="text-2xl font-bold mb-4">{{ fournisseur.nom }}</h1>
      <form class="grid sm:grid-cols-2 gap-2 mb-4" @submit.prevent="enregistrer">
        <input v-model="fournisseur.nom" class="px-3 py-2 border rounded" />
        <input v-model="fournisseur.categorie" class="px-3 py-2 border rounded" />
        <input v-model="fournisseur.telephone" class="px-3 py-2 border rounded" />
        <input v-model="fournisseur.email" class="px-3 py-2 border rounded" />
        <button class="px-3 py-2 rounded bg-slate-900 text-white sm:col-span-2">Enregistrer</button>
      </form>

      <h2 class="font-semibold mb-2">Ingrédients fournis</h2>
      <ul class="text-sm mb-4">
        <li v-for="i in ingredients" :key="i.id">{{ i.nom }} — {{ i.stock }} {{ i.unite }}</li>
        <li v-if="ingredients.length === 0" class="text-slate-500">Aucun.</li>
      </ul>

      <h2 class="font-semibold mb-2">Historique approvisionnements</h2>
      <ul class="text-sm mb-4">
        <li v-for="a in appros" :key="a.id">#{{ a.id }} — {{ a.dateCommande }} — <strong>{{ a.statut }}</strong></li>
        <li v-if="appros.length === 0" class="text-slate-500">Aucun.</li>
      </ul>

      <button class="text-red-600 underline" @click="retirer">Supprimer</button>
    </template>
  </section>
</template>
