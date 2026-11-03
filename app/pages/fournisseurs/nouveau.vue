<script setup>
import { calculerTotalAppro, validerLignesAppro } from '~/composables/useFournisseurs'
import { formaterPrix } from '~/utils/format'

const api = useApi()
const router = useRouter()
const { creerAppro } = useFournisseurs()
const { succes, erreur } = useNotifier()

let compteur = 0
const ligneVide = () => ({ uid: ++compteur, ingredientId: null, quantite: 1, prixUnitaire: 0 })

const fournisseurs = ref([])
const ingredients = ref([])
const form = reactive({ fournisseurId: null, dateLivraison: '', lignes: [ligneVide()] })
const chargement = ref(true)
const envoi = ref(false)
const erreurFormulaire = ref('')
const aujourdhui = new Date().toISOString().slice(0, 10)

const champ =
  'h-11 w-full min-w-0 rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
const btnPrimaire =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:cursor-wait disabled:opacity-60'
const btnFantome =
  'inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400'

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
const totalLigne = (l) => Math.round((Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0) * 100) / 100

// Un autre fournisseur : on vide les lignes dont l'ingrédient n'existe plus dans la liste proposée.
watch(() => form.fournisseurId, () => {
  for (const ligne of form.lignes) {
    if (!ingredientsDispo.value.some(i => String(i.id) === String(ligne.ingredientId))) {
      ligne.ingredientId = null
    }
  }
})

// Quand on choisit un ingrédient et que le prix est encore à 0, on propose son prix habituel.
watch(
  () => form.lignes.map(l => l.ingredientId),
  (nouveaux, anciens) => {
    nouveaux.forEach((id, i) => {
      if (id == null || id === anciens?.[i]) return
      const ligne = form.lignes[i]
      const ing = ingredients.value.find(x => String(x.id) === String(id))
      if (ing && !Number(ligne.prixUnitaire)) ligne.prixUnitaire = Number(ing.prixUnitaire) || 0
    })
  }
)

watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

function ajouterLigne() { form.lignes.push(ligneVide()) }
function retirerLigne(idx) {
  if (form.lignes.length > 1) form.lignes.splice(idx, 1)
}

async function soumettre() {
  if (envoi.value) return
  const jour = new Date().toISOString().slice(0, 10)
  erreurFormulaire.value = validerLignesAppro(form.lignes, form.fournisseurId, ingredientsDispo.value) || ''
  if (!erreurFormulaire.value && form.dateLivraison && form.dateLivraison < jour) {
    erreurFormulaire.value = 'La date de livraison ne peut pas être dans le passé.'
  }
  if (erreurFormulaire.value) return

  envoi.value = true
  try {
    await creerAppro({
      fournisseurId: form.fournisseurId,
      dateCommande: jour,
      dateLivraisonPrevue: form.dateLivraison || null,
      dateReception: null,
      statut: 'commande',
      lignes: form.lignes.map(({ ingredientId, quantite, prixUnitaire }) => ({
        ingredientId,
        quantite: Number(quantite),
        prixUnitaire: Number(prixUnitaire)
      }))
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
  <main class="space-y-5">
    <header class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <NuxtLink
        to="/approvisionnements"
        class="rounded-md text-xs text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <span aria-hidden="true">←</span> Retour aux approvisionnements
      </NuxtLink>
      <div class="min-w-0 flex-1 sm:border-l sm:border-white/[0.13] sm:pl-5">
        <h1 class="text-xl font-bold text-white">Nouvel approvisionnement</h1>
        <p class="mt-1 text-xs text-neutral-500">Préparez une commande fournisseur</p>
      </div>
    </header>

    <p v-if="chargement" class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-10 text-center text-sm text-neutral-400" role="status">
      Chargement des fournisseurs et des ingrédients…
    </p>

    <form
      v-else
      class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-6"
      @submit.prevent="soumettre"
    >
      <h2 class="mb-5 text-sm font-semibold text-white">Informations et articles</h2>

      <p v-if="erreurFormulaire" class="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300" role="alert">
        {{ erreurFormulaire }}
      </p>

      <div class="mb-7 grid gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Fournisseur <span class="text-orange-500">*</span></span>
          <select v-model="form.fournisseurId" required :class="champ" class="!h-12">
            <option :value="null">Sélectionnez un fournisseur</option>
            <option v-for="f in fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Date de livraison</span>
          <input v-model="form.dateLivraison" type="date" :min="aujourdhui" :class="champ" class="!h-12" />
        </label>
      </div>

      <div>
        <div class="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_35px] gap-2.5 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:grid">
          <span>Ingrédient</span><span>Quantité</span><span>Prix unitaire</span><span>Total</span><span class="sr-only">Retirer</span>
        </div>

        <div
          v-for="(l, i) in form.lignes"
          :key="l.uid"
          class="grid gap-3 border-t border-white/[0.06] px-1 py-3 md:grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_35px] md:items-center md:gap-2.5"
        >
          <label class="block">
            <span class="mb-1.5 block text-xs text-neutral-400 md:hidden">Ingrédient</span>
            <select v-model="l.ingredientId" required :aria-label="`Ingrédient, ligne ${i + 1}`" :class="champ">
              <option :value="null">{{ form.fournisseurId ? 'Sélectionnez un ingrédient' : "Choisissez d'abord un fournisseur" }}</option>
              <option v-for="ing in ingredientsDispo" :key="ing.id" :value="ing.id">{{ ing.nom }}</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3 md:contents">
            <label class="block">
              <span class="mb-1.5 block text-xs text-neutral-400 md:hidden">Quantité</span>
              <input v-model.number="l.quantite" type="number" min="0" step="any" required :aria-label="`Quantité, ligne ${i + 1}`" :class="champ" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs text-neutral-400 md:hidden">Prix unitaire</span>
              <input v-model.number="l.prixUnitaire" type="number" min="0" step="0.01" required :aria-label="`Prix unitaire, ligne ${i + 1}`" :class="champ" />
            </label>
          </div>
          <div class="flex items-center justify-between gap-3">
            <b class="text-sm text-white">
              <span class="mr-2 text-xs font-normal text-neutral-400 md:hidden">Total</span>{{ formaterPrix(totalLigne(l)) }}
            </b>
            <button
              type="button"
              :disabled="form.lignes.length === 1"
              :aria-label="`Retirer la ligne ${i + 1}`"
              class="h-8 w-8 rounded-[9px] border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-30"
              @click="retirerLigne(i)"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="mt-3 inline-flex h-10 items-center gap-2 rounded-[11px] border border-dashed border-orange-500/40 bg-orange-500/5 px-4 text-xs font-semibold text-orange-500 transition hover:bg-orange-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          @click="ajouterLigne"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Ajouter une ligne
        </button>
      </div>

      <div class="mt-6 flex items-center justify-end gap-6 border-t border-white/[0.13] pt-5 text-sm text-neutral-400">
        <span>Total de l'approvisionnement</span>
        <b class="text-xl text-orange-500">{{ formaterPrix(total) }}</b>
      </div>
      <p class="mt-1 text-right text-xs text-neutral-500">Le stock sera mis à jour lors de la réception de la commande.</p>

      <div class="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <NuxtLink to="/approvisionnements" :class="btnFantome">Annuler</NuxtLink>
        <button type="submit" :disabled="envoi" :class="btnPrimaire">
          {{ envoi ? 'Enregistrement…' : 'Enregistrer la commande' }}
        </button>
      </div>
    </form>
  </main>
</template>