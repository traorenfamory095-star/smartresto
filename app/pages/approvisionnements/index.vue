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
  <section>
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">Fournisseurs</h1>
      <NuxtLink to="/fournisseurs/nouveau" class="px-4 py-2 rounded bg-slate-900 text-white">+ Nouveau</NuxtLink>
    </div>
    <div class="flex gap-3 mb-4">
      <input v-model="recherche" type="search" placeholder="Rechercher" class="px-3 py-2 border rounded" aria-label="Rechercher" />
      <select v-model="categorie" class="px-3 py-2 border rounded" aria-label="Catégorie">
        <option value="">Toutes catégories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreurMsg" class="text-red-600">{{ erreurMsg }}</p>
    <ul v-else class="space-y-2">
      <li v-for="f in filtres" :key="f.id" class="border rounded p-3 flex justify-between">
        <div><strong>{{ f.nom }}</strong> — {{ f.categorie }}<br /><span class="text-sm text-slate-600">{{ f.telephone }} · {{ f.email }}</span></div>
        <NuxtLink :to="`/fournisseurs/${f.id}`" class="text-sm underline self-center">Détail</NuxtLink>
      </li>
    </ul>
  </section>
</template>

