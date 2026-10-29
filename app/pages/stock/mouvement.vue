```vue
<script setup>
import { computed, reactive, ref, watch } from 'vue'

useHead({ title: 'Mouvement de stock | SmartResto' })

const route = useRoute()
const router = useRouter()

const { lire, creer, modifier, supprimer } = useApi()
const { succes, erreur } = useNotifier()

const {
  data: ingredients,
  pending,
  error: erreurChargement,
  refresh,
} = await useAsyncData(
  'stock-mouvement-ingredients',
  () => lire('/ingredients'),
  { default: () => [] },
)

const formulaire = reactive({
  ingredientId: '',
  type: 'entree',
  quantite: '',
  motif: '',
})

const enregistrement = ref(false)
const erreurFormulaire = ref('')

const ingredientSelectionne = computed(() =>
  (ingredients.value ?? []).find(
    (ingredient) =>
      String(ingredient.id) === String(formulaire.ingredientId),
  ),
)

const stockActuel = computed(() =>
  Number(ingredientSelectionne.value?.stock ?? 0),
)

const quantiteSaisie = computed(() => Number(formulaire.quantite))

const stockApres = computed(() => {
  if (!ingredientSelectionne.value || formulaire.quantite === '') {
    return stockActuel.value
  }

  if (formulaire.type === 'entree') {
    return stockActuel.value + quantiteSaisie.value
  }

  if (formulaire.type === 'sortie') {
    return stockActuel.value - quantiteSaisie.value
  }

  // Pour un ajustement, la quantité saisie représente
  // le nouveau stock réellement compté.
  return quantiteSaisie.value
})

const differenceStock = computed(() => stockApres.value - stockActuel.value)

const variationLibelle = computed(() => {
  if (differenceStock.value > 0) {
    return `+${formaterNombre(differenceStock.value)}`
  }

  return formaterNombre(differenceStock.value)
})

watch(
  () => route.query.ingredientId,
  (ingredientId) => {
    if (ingredientId !== undefined && ingredientId !== null) {
      formulaire.ingredientId = String(ingredientId)
    }
  },
  { immediate: true },
)

function formaterNombre(valeur) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(Number(valeur) || 0)
}

function formaterType(type) {
  return {
    entree: 'Entrée',
    sortie: 'Sortie',
    ajustement: 'Ajustement',
  }[type] ?? type
}

function reinitialiser() {
  formulaire.type = 'entree'
  formulaire.quantite = ''
  formulaire.motif = ''
  erreurFormulaire.value = ''
}

function validerFormulaire() {
  if (!ingredientSelectionne.value) {
    return 'Sélectionne un ingrédient.'
  }

  if (
    formulaire.quantite === '' ||
    !Number.isFinite(quantiteSaisie.value) ||
    quantiteSaisie.value < 0
  ) {
    return 'Saisis une quantité valide et positive ou nulle pour un ajustement.'
  }

  if (formulaire.type !== 'ajustement' && quantiteSaisie.value <= 0) {
    return 'La quantité doit être supérieure à zéro.'
  }

  if (stockApres.value < 0) {
    return 'Stock insuffisant : la sortie dépasse la quantité disponible.'
  }

  if (
    formulaire.type === 'ajustement' &&
    differenceStock.value === 0
  ) {
    return 'Le stock compté est identique au stock actuel.'
  }

  if (!formulaire.motif.trim()) {
    return 'Indique le motif du mouvement.'
  }

  return ''
}

async function enregistrerMouvement() {
  erreurFormulaire.value = validerFormulaire()

  if (erreurFormulaire.value || enregistrement.value) return

  const ingredient = ingredientSelectionne.value
  const ancienStock = Number(ingredient.stock)
  const nouveauStock = stockApres.value

  const quantiteMouvement =
    formulaire.type === 'ajustement'
      ? Math.abs(nouveauStock - ancienStock)
      : quantiteSaisie.value

  const mouvement = {
    ingredientId: ingredient.id,
    type: formulaire.type,
    quantite: quantiteMouvement,
    date: new Date().toISOString(),
    motif: formulaire.motif.trim(),
  }

  enregistrement.value = true

  let mouvementCree = null

  try {
    mouvementCree = await creer('/mouvementsStock', mouvement)

    try {
      await modifier(`/ingredients/${ingredient.id}`, {
        stock: nouveauStock,
      })
    } catch (e) {
      if (mouvementCree?.id !== undefined) {
        try {
          await supprimer(`/mouvementsStock/${mouvementCree.id}`)
        } catch {
          erreur(
            "La mise à jour du stock a échoué et l'annulation du mouvement aussi. Vérifie les données avant de réessayer.",
          )
          return
        }
      }

      throw e
    }

    succes('Mouvement de stock enregistré avec succès.')
    await router.push('/stock/mouvements')
  } catch (e) {
    erreur(e)
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <main class="min-h-screen space-y-6 bg-bg p-4 text-ink sm:p-6">
    <!-- En-tête -->
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-head sm:text-3xl">
          Mouvement de stock
        </h1>
        <p class="mt-2 text-sm text-mut">
          Enregistrez les entrées, sorties et ajustements des ingrédients.
        </p>
      </div>

      <NuxtLink
        to="/stock"
        class="inline-flex items-center justify-center rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-pri hover:text-pri"
      >
        ← Retour au stock
      </NuxtLink>
    </header>

    <!-- Chargement -->
    <section
      v-if="pending"
      class="rounded-carte border border-line bg-card p-8 text-center text-mut"
    >
      Chargement des ingrédients...
    </section>

    <!-- Erreur API -->
    <section
      v-else-if="erreurChargement"
      class="rounded-carte border border-err/30 bg-card p-6"
    >
      <p class="font-semibold text-err">
        Impossible de charger les ingrédients.
      </p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-degrade px-4 py-2.5 font-semibold text-on-pri"
        @click="refresh()"
      >
        Réessayer
      </button>
    </section>

    <template v-else>
      <!-- Résumé de l'ingrédient -->
      <section class="rounded-carte border border-line bg-card p-5 sm:p-6">
        <p class="text-sm font-medium text-mut">
          Ingrédient sélectionné
        </p>

        <template v-if="ingredientSelectionne">
          <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-head">
                {{ ingredientSelectionne.nom }}
              </h2>
              <p class="mt-1 text-sm text-mut">
                Seuil d’alerte :
                {{ formaterNombre(ingredientSelectionne.seuilAlerte) }}
                {{ ingredientSelectionne.unite }}
              </p>
            </div>

            <span
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="stockActuel <= Number(ingredientSelectionne.seuilAlerte)
                ? 'bg-err/10 text-err'
                : 'bg-ok/10 text-ok'"
            >
              {{ stockActuel <= Number(ingredientSelectionne.seuilAlerte)
                ? 'Stock faible'
                : 'Stock normal' }}
            </span>
          </div>

          <div class="mt-5 rounded-xl bg-soft p-4">
            <p class="text-sm text-mut">Stock disponible</p>
            <p class="mt-1 text-2xl font-bold text-head">
              {{ formaterNombre(stockActuel) }}
              <span class="text-sm font-medium text-mut">
                {{ ingredientSelectionne.unite }}
              </span>
            </p>
          </div>
        </template>

        <p v-else class="mt-3 text-sm text-mut">
          Choisis un ingrédient dans le formulaire pour afficher son stock.
        </p>
      </section>

      <!-- Formulaire -->
      <form
        class="space-y-6 rounded-carte border border-line bg-card p-5 sm:p-6"
        @submit.prevent="enregistrerMouvement"
      >
        <div>
          <h2 class="text-lg font-bold text-head">
            Informations du mouvement
          </h2>
          <p class="mt-1 text-sm text-mut">
            Les champs marqués sont nécessaires à l’enregistrement.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-ink">
              Ingrédient *
            </span>
            <select
              v-model="formulaire.ingredientId"
              required
              class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
            >
              <option value="" disabled>
                Choisir un ingrédient
              </option>
              <option
                v-for="ingredient in ingredients"
                :key="ingredient.id"
                :value="String(ingredient.id)"
              >
                {{ ingredient.nom }} — {{ formaterNombre(ingredient.stock) }}
                {{ ingredient.unite }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-ink">
              Type de mouvement *
            </span>
            <select
              v-model="formulaire.type"
              required
              class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
            >
              <option value="entree">Entrée — approvisionnement</option>
              <option value="sortie">Sortie — consommation ou perte</option>
              <option value="ajustement">Ajustement — stock compté</option>
            </select>
          </label>

          <label class="block md:col-span-2">
            <span class="mb-2 block text-sm font-medium text-ink">
              {{ formulaire.type === 'ajustement'
                ? 'Quantité réellement comptée *'
                : `Quantité (${ingredientSelectionne?.unite ?? 'unité'}) *` }}
            </span>
            <input
              v-model="formulaire.quantite"
              type="number"
              min="0"
              :step="1"
              required
              inputmode="decimal"
              :placeholder="formulaire.type === 'ajustement'
                ? 'Saisir le nouveau stock compté'
                : 'Saisir la quantité du mouvement'"
              class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/20"
            />
            <p class="mt-2 text-xs text-mut">
              <template v-if="formulaire.type === 'ajustement'">
                Saisis le stock total constaté après comptage, et non la différence.
              </template>
              <template v-else>
                La quantité doit être supérieure à zéro.
              </template>
            </p>
          </label>

          <label class="block md:col-span-2">
            <span class="mb-2 block text-sm font-medium text-ink">
              Motif du mouvement *
            </span>
            <textarea
              v-model="formulaire.motif"
              required
              rows="3"
              maxlength="500"
              placeholder="Ex. : livraison fournisseur, préparation des repas, perte constatée..."
              class="w-full resize-y rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/20"
            />
          </label>
        </div>

        <!-- Prévisualisation -->
        <section class="rounded-carte border border-line bg-soft p-4 sm:p-5">
          <h3 class="font-semibold text-head">
            Aperçu du stock après mouvement
          </h3>

          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p class="text-xs text-mut">Stock actuel</p>
              <p class="mt-1 text-lg font-bold text-head">
                {{ formaterNombre(stockActuel) }}
              </p>
            </div>

            <div>
              <p class="text-xs text-mut">
                {{ formulaire.type === 'ajustement' ? 'Variation' : 'Mouvement' }}
              </p>
              <p
                class="mt-1 text-lg font-bold"
                :class="differenceStock > 0
                  ? 'text-ok'
                  : differenceStock < 0
                    ? 'text-err'
                    : 'text-mut'"
              >
                {{ formulaire.quantite === '' ? '—' : variationLibelle }}
              </p>
            </div>

            <div>
              <p class="text-xs text-mut">Stock après</p>
              <p
                class="mt-1 text-lg font-bold"
                :class="stockApres < 0 ? 'text-err' : 'text-head'"
              >
                {{ formulaire.quantite === ''
                  ? '—'
                  : formaterNombre(stockApres) }}
              </p>
            </div>
          </div>

          <p
            v-if="formulaire.quantite !== '' && stockApres < 0"
            class="mt-4 text-sm font-medium text-err"
          >
            La quantité demandée dépasse le stock disponible.
          </p>
        </section>

        <!-- Erreur de validation -->
        <div
          v-if="erreurFormulaire"
          class="rounded-xl border border-err/30 bg-err/5 px-4 py-3 text-sm text-err"
          role="alert"
        >
          {{ erreurFormulaire }}
        </div>

        <!-- Actions -->
        <div class="flex flex-col-reverse justify-end gap-3 border-t border-line pt-5 sm:flex-row">
          <button
            type="button"
            :disabled="enregistrement"
            class="rounded-xl border border-line bg-card px-5 py-3 font-semibold text-ink transition-colors hover:border-pri hover:text-pri disabled:opacity-50"
            @click="reinitialiser"
          >
            Réinitialiser
          </button>

          <button
            type="submit"
            :disabled="enregistrement || !ingredientSelectionne"
            class="rounded-xl bg-degrade px-5 py-3 font-semibold text-on-pri transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ enregistrement ? 'Enregistrement...' : 'Enregistrer le mouvement' }}
          </button>
        </div>
      </form>
    </template>
  </main>
</template>
```