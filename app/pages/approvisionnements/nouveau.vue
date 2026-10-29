<script setup>
import { calculerTotalAppro, validerLignesAppro } from '~/composables/useFournisseurs'

const api = useApi()
const router = useRouter()
const { creerAppro } = useFournisseurs()
const { succes, erreur } = useNotifier()
const fournisseurs = ref([])
const ingredients = ref([])
const form = reactive({ fournisseurId: null, lignes: [] })
const chargement = ref(true)
const envoi = ref(false)
const erreurFormulaire = ref('')

onMounted(async () => {
  try {
    const [listeFournisseurs, listeIngredients] = await Promise.all([api.lire('/fournisseurs'), api.lire('/ingredients')])
    fournisseurs.value = Array.isArray(listeFournisseurs) ? listeFournisseurs : []
    ingredients.value = Array.isArray(listeIngredients) ? listeIngredients : []
  } catch (e) {
    erreur(e.message)
  } finally {
    chargement.value = false
  }
})

const ingredientsDispo = computed(() =>
  form.fournisseurId ? ingredients.value.filter(i => String(i.fournisseurId) === String(form.fournisseurId)) : []
)
const total = computed(() => calculerTotalAppro(form.lignes))

watch(() => form.fournisseurId, () => {
  for (const ligne of form.lignes) {
    if (!ingredientsDispo.value.some(ingredient => String(ingredient.id) === String(ligne.ingredientId))) {
      ligne.ingredientId = null
    }
  }
})
watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

function ajouterLigne() {
  form.lignes.push({ ingredientId: null, quantite: 1, prixUnitaire: 0 })
}
function retirerLigne(idx) { form.lignes.splice(idx, 1) }

async function soumettre() {
  if (envoi.value) return
  erreurFormulaire.value = validerLignesAppro(form.lignes, form.fournisseurId, ingredientsDispo.value) || ''
  if (erreurFormulaire.value) return

  envoi.value = true
  try {
    await creerAppro({
      fournisseurId: form.fournisseurId,
      dateCommande: new Date().toISOString().slice(0, 10),
      dateReception: null,
      statut: 'commande',
      lignes: form.lignes.map(l => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) }))
    })
    succes('Approvisionnement créé')
    router.push('/approvisionnements')
  } catch (e) {
    erreur(e.message)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <section class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-4">Nouvel approvisionnement</h1>
    <p v-if="chargement">Chargement…</p>
    <template v-else>
      <p v-if="erreurFormulaire" class="mb-3 text-red-600" role="alert">{{ erreurFormulaire }}</p>
      <form @submit.prevent="soumettre">
        <label class="flex flex-col gap-1 mb-4"><span>Fournisseur</span>
          <select v-model="form.fournisseurId" required class="px-3 py-2 border rounded">
            <option :value="null">—</option>
            <option v-for="f in fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
          </select>
        </label>

        <div v-for="(l, i) in form.lignes" :key="i" class="grid sm:grid-cols-4 gap-2 mb-2">
          <select v-model="l.ingredientId" required class="px-3 py-2 border rounded" :aria-label="`Ingrédient, ligne ${i + 1}`">
            <option :value="null">Ingrédient</option>
            <option v-for="ing in ingredientsDispo" :key="ing.id" :value="ing.id">{{ ing.nom }}</option>
          </select>
          <input v-model.number="l.quantite" type="number" min="0" step="any" required :aria-label="`Quantité, ligne ${i + 1}`" class="px-3 py-2 border rounded" />
          <input v-model.number="l.prixUnitaire" type="number" step="0.01" min="0" required :aria-label="`Prix unitaire, ligne ${i + 1}`" class="px-3 py-2 border rounded" />
          <button type="button" class="text-red-600 text-sm" @click="retirerLigne(i)">Retirer</button>
        </div>

        <button type="button" class="text-sm underline mb-4" @click="ajouterLigne">+ Ajouter une ligne</button>
        <p class="font-bold mb-4">Total : {{ formaterPrix(total) }}</p>
        <button type="submit" :disabled="envoi" class="px-4 py-2 rounded bg-slate-900 text-white disabled:opacity-50">
          {{ envoi ? 'Création…' : "Créer l'approvisionnement" }}
        </button>
      </form>
    </template>
  </section>
</template>
