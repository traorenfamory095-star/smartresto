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
  <main class="mx-auto max-w-5xl space-y-6">
    <header>
      <NuxtLink to="/approvisionnements" class="text-sm font-semibold text-orange-700 transition hover:text-orange-800">
        <span aria-hidden="true">←</span> Retour aux approvisionnements
      </NuxtLink>
      <p class="mt-5 text-sm font-semibold uppercase tracking-wide text-orange-600">Gestion des achats</p>
      <h1 class="mt-1 text-3xl font-bold text-gray-900">Nouvel approvisionnement</h1>
      <p class="mt-2 text-sm text-gray-500">Choisissez un fournisseur et détaillez les produits à commander.</p>
    </header>

    <p v-if="chargement" class="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500" role="status">
      Chargement des fournisseurs et des ingrédients…
    </p>
    <template v-else>
      <p v-if="erreurFormulaire" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
        {{ erreurFormulaire }}
      </p>
      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form id="approvisionnement-form" class="space-y-6" @submit.prevent="soumettre">
          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="mb-5">
              <span class="text-xs font-bold uppercase tracking-wider text-orange-600">Étape 1</span>
              <h2 class="mt-1 text-lg font-semibold text-gray-900">Choisir un fournisseur</h2>
              <p class="mt-1 text-sm text-gray-500">Les ingrédients disponibles dépendront de votre choix.</p>
            </div>
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium text-gray-700">Fournisseur <span class="text-orange-600">*</span></span>
              <select v-model="form.fournisseurId" required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200">
                <option :value="null">Sélectionnez un fournisseur</option>
                <option v-for="f in fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
              </select>
            </label>
          </section>

          <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-orange-600">Étape 2</span>
                <h2 class="mt-1 text-lg font-semibold text-gray-900">Produits à commander</h2>
                <p class="mt-1 text-sm text-gray-500">Ajoutez une ligne par ingrédient.</p>
              </div>
              <button type="button" class="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500" @click="ajouterLigne">
                <span aria-hidden="true" class="mr-2 text-lg leading-none">+</span>
                Ajouter une ligne
              </button>
            </div>

            <div v-if="form.lignes.length" class="space-y-4 p-5 sm:p-6">
              <article v-for="(l, i) in form.lignes" :key="i" class="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-gray-800">Article {{ String(i + 1).padStart(2, '0') }}</h3>
                  <button type="button" class="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" @click="retirerLigne(i)">
                    Retirer
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="block sm:col-span-2">
                    <span class="mb-1.5 block text-sm font-medium text-gray-700">Ingrédient</span>
                    <select v-model="l.ingredientId" required :aria-label="`Ingrédient, ligne ${i + 1}`" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200">
                      <option :value="null">Sélectionnez un ingrédient</option>
                      <option v-for="ing in ingredientsDispo" :key="ing.id" :value="ing.id">{{ ing.nom }}</option>
                    </select>
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-sm font-medium text-gray-700">Quantité</span>
                    <input v-model.number="l.quantite" type="number" min="0" step="any" required :aria-label="`Quantité, ligne ${i + 1}`" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-sm font-medium text-gray-700">Prix unitaire</span>
                    <input v-model.number="l.prixUnitaire" type="number" step="0.01" min="0" required :aria-label="`Prix unitaire, ligne ${i + 1}`" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
                  </label>
                </div>
              </article>
            </div>
            <div v-else class="px-5 py-10 text-center sm:px-6">
              <p class="font-medium text-gray-800">Aucun produit ajouté</p>
              <p class="mt-1 text-sm text-gray-500">Ajoutez une ligne pour détailler votre commande.</p>
            </div>
          </section>
          <button type="submit" :disabled="envoi" class="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 lg:hidden">
            {{ envoi ? 'Création en cours…' : "Créer l'approvisionnement" }}
          </button>
        </form>

        <aside class="space-y-4 lg:sticky lg:top-6">
          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 class="font-semibold text-gray-900">Récapitulatif</h2>
            <div class="mt-4 flex items-center justify-between border-b border-gray-100 pb-4 text-sm">
              <span class="text-gray-500">Nombre d’articles</span>
              <span class="font-semibold text-gray-900">{{ form.lignes.length }}</span>
            </div>
            <div class="mt-4 flex items-end justify-between gap-3">
              <span class="text-sm text-gray-500">Total estimé</span>
              <span class="text-2xl font-bold text-gray-900">{{ formaterPrix(total) }}</span>
            </div>
            <p class="mt-2 text-xs leading-5 text-gray-500">Le stock sera mis à jour lors de la réception de la commande.</p>
            <button form="approvisionnement-form" type="submit" :disabled="envoi" class="mt-5 hidden w-full items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 lg:inline-flex">
              {{ envoi ? 'Création en cours…' : "Créer l'approvisionnement" }}
            </button>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>
