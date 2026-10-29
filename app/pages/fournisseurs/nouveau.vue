<script setup>
const api = useApi()
const router = useRouter()
const { creerAppro } = useFournisseurs()
const { succes, erreur } = useNotifier()
const fournisseurs = ref([])
const ingredients = ref([])
const form = reactive({ fournisseurId: null, lignes: [] })
const chargement = ref(true)

onMounted(async () => {
  try { [fournisseurs.value, ingredients.value] = await Promise.all([api.lire('/fournisseurs'), api.lire('/ingredients')]) }
  catch (e) { erreur(e.message) }
  finally { chargement.value = false }
})

const ingredientsDispo = computed(() =>
  form.fournisseurId ? ingredients.value.filter(i => i.fournisseurId === form.fournisseurId) : []
)
const total = computed(() => calculerTotalAppro(form.lignes))

function ajouterLigne() {
  form.lignes.push({ ingredientId: null, quantite: 1, prixUnitaire: 0 })
}
function retirerLigne(idx) { form.lignes.splice(idx, 1) }

async function soumettre() {
  try {
    if (!form.fournisseurId) throw new Error('Choisissez un fournisseur.')
    if (form.lignes.length === 0) throw new Error('Ajoutez au moins une ligne.')
    await creerAppro({
      fournisseurId: form.fournisseurId,
      dateCommande: new Date().toISOString().slice(0, 10),
      dateReception: null,
      statut: 'commande',
      lignes: form.lignes.map(l => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) }))
    })
    succes('Approvisionnement créé'); router.push('/approvisionnements')
  } catch (e) { erreur(e.message) }
}
</script>

<template>
  <section class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-4">Nouvel approvisionnement</h1>
    <p v-if="chargement">Chargement…</p>
    <template v-else>
      <label class="flex flex-col gap-1 mb-4"><span>Fournisseur</span>
        <select v-model="form.fournisseurId" class="px-3 py-2 border rounded">
          <option :value="null">—</option>
          <option v-for="f in fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
        </select>
      </label>

      <div v-for="(l, i) in form.lignes" :key="i" class="grid sm:grid-cols-4 gap-2 mb-2">
        <select v-model="l.ingredientId" class="px-3 py-2 border rounded">
          <option :value="null">Ingrédient</option>
          <option v-for="ing in ingredientsDispo" :key="ing.id" :value="ing.id">{{ ing.nom }}</option>
        </select>
        <input v-model.number="l.quantite" type="number" min="1" class="px-3 py-2 border rounded" />
        <input v-model.number="l.prixUnitaire" type="number" step="0.01" min="0" class="px-3 py-2 border rounded" />
        <button class="text-red-600 text-sm" @click="retirerLigne(i)">Retirer</button>
      </div>

      <button class="text-sm underline mb-4" @click="ajouterLigne">+ Ajouter une ligne</button>
      <p class="font-bold mb-4">Total : {{ formaterPrix(total) }}</p>
      <button class="px-4 py-2 rounded bg-slate-900 text-white" @click="soumettre">Créer l'approvisionnement</button>
    </template>
  </section>
</template>

//page d'approvisionnement pour créer un nouvel approvisionnement, avec sélection du fournisseur et des ingrédients, calcul du total et soumission du formulaire.//