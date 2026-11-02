```vue
<script setup>
import { computed, reactive, ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const { lire, modifier, supprimer } = useApi()
const { succes, erreur } = useNotifier()

const id = computed(() => String(route.params.id))

useHead(() => ({
  title: `Détail de l’ingrédient | SmartResto`,
}))

const {
  data: ingredient,
  pending,
  error: erreurChargement,
  refresh,
} = await useAsyncData(
  () => `stock-ingredient-${id.value}`,
  () => lire(`/ingredients/${id.value}`),
)

const formulaire = reactive({
  nom: '',
  unite: 'kg',
  stock: 0,
  seuilAlerte: 0,
  prixUnitaire: 0,
  fournisseurId: '',
})

const enregistrement = ref(false)
const suppression = ref(false)
const erreurFormulaire = ref('')
const confirmationSuppression = ref(false)

const {
  data: fournisseurs,
  error: erreurFournisseurs,
} = await useAsyncData(
  'stock-detail-fournisseurs',
  () => lire('/fournisseurs'),
  { default: () => [] },
)

watch(
  ingredient,
  (valeur) => {
    if (!valeur) return

    formulaire.nom = valeur.nom ?? ''
    formulaire.unite = valeur.unite ?? 'kg'
    formulaire.stock = Number(valeur.stock ?? 0)
    formulaire.seuilAlerte = Number(valeur.seuilAlerte ?? 0)
    formulaire.prixUnitaire = Number(valeur.prixUnitaire ?? 0)
    formulaire.fournisseurId = valeur.fournisseurId != null
      ? String(valeur.fournisseurId)
      : ''
  },
  { immediate: true },
)

const estEnAlerte = computed(() =>
  Number(formulaire.stock) <= Number(formulaire.seuilAlerte),
)

const fournisseurSelectionne = computed(() =>
  (fournisseurs.value ?? []).find(
    (fournisseur) =>
      String(fournisseur.id) === String(formulaire.fournisseurId),
  ),
)

const formulaireValide = computed(() =>
  formulaire.nom.trim().length > 0 &&
  Number.isFinite(Number(formulaire.stock)) &&
  Number(formulaire.stock) >= 0 &&
  Number.isFinite(Number(formulaire.seuilAlerte)) &&
  Number(formulaire.seuilAlerte) >= 0 &&
  Number.isFinite(Number(formulaire.prixUnitaire)) &&
  Number(formulaire.prixUnitaire) >= 0,
)

function formaterNombre(valeur) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(Number(valeur) || 0)
}

function valider() {
  if (!formulaire.nom.trim()) {
    return 'Le nom de l’ingrédient est obligatoire.'
  }

  if (!formulaire.unite) {
    return 'Sélectionne une unité.'
  }

  if (
    !Number.isFinite(Number(formulaire.stock)) ||
    Number(formulaire.stock) < 0
  ) {
    return 'Le stock doit être positif ou nul.'
  }

  if (
    !Number.isFinite(Number(formulaire.seuilAlerte)) ||
    Number(formulaire.seuilAlerte) < 0
  ) {
    return 'Le seuil d’alerte doit être positif ou nul.'
  }

  if (
    !Number.isFinite(Number(formulaire.prixUnitaire)) ||
    Number(formulaire.prixUnitaire) < 0
  ) {
    return 'Le prix unitaire doit être positif ou nul.'
  }

  return ''
}

async function enregistrer() {
  erreurFormulaire.value = valider()

  if (erreurFormulaire.value || enregistrement.value) return

  enregistrement.value = true

  try {
    await modifier(`/ingredients/${id.value}`, {
      nom: formulaire.nom.trim(),
      unite: formulaire.unite,
      stock: Number(formulaire.stock),
      seuilAlerte: Number(formulaire.seuilAlerte),
      prixUnitaire: Number(formulaire.prixUnitaire),
      fournisseurId: formulaire.fournisseurId
        ? Number(formulaire.fournisseurId)
        : null,
    })

    succes('Ingrédient mis à jour avec succès.')
    await refresh()
  } catch (e) {
    erreur(e)
  } finally {
    enregistrement.value = false
  }
}

async function supprimerIngredient() {
  if (suppression.value) return

  suppression.value = true

  try {
    const mouvements = await lire('/mouvementsStock', {
      ingredientId: id.value,
    })

    if (mouvements.length > 0) {
      erreur(
        'Impossible de supprimer cet ingrédient : il possède déjà un historique de mouvements.',
      )
      return
    }

    await supprimer(`/ingredients/${id.value}`)

    succes('Ingrédient supprimé avec succès.')
    await router.push('/stock')
  } catch (e) {
    erreur(e)
  } finally {
    suppression.value = false
    confirmationSuppression.value = false
  }
}
</script>

<template>
  <main class="min-h-screen space-y-6 bg-bg p-4 text-ink sm:p-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-head sm:text-3xl">
          Détail de l’ingrédient
        </h1>
        <p class="mt-2 text-sm text-mut">
          Consultez et modifiez les informations de votre inventaire.
        </p>
      </div>

      <NuxtLink
        to="/stock"
        class="inline-flex items-center justify-center rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-pri hover:text-pri"
      >
        ← Retour au stock
      </NuxtLink>
    </header>

    <section
      v-if="pending"
      class="rounded-carte border border-line bg-card p-8 text-center text-mut"
    >
      Chargement de l’ingrédient...
    </section>

    <section
      v-else-if="erreurChargement || !ingredient"
      class="rounded-carte border border-err/30 bg-card p-6"
    >
      <h2 class="font-semibold text-err">
        Ingrédient introuvable
      </h2>
      <p class="mt-2 text-sm text-mut">
        Vérifiez l’identifiant ou réessayez le chargement.
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
      <!-- Résumé -->
      <section class="rounded-carte border border-line bg-card p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm text-mut">Ingrédient</p>
            <h2 class="mt-1 text-2xl font-bold text-head">
              {{ ingredient.nom }}
            </h2>
            <p class="mt-2 text-sm text-mut">
              {{ fournisseurSelectionne?.nom ?? 'Aucun fournisseur associé' }}
            </p>
          </div>

          <span
            class="rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="estEnAlerte
              ? 'bg-err/10 text-err'
              : 'bg-ok/10 text-ok'"
          >
            {{ estEnAlerte ? 'Stock faible' : 'Stock normal' }}
          </span>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-xl bg-soft p-4">
            <p class="text-sm text-mut">Stock disponible</p>
            <p class="mt-2 text-xl font-bold text-head">
              {{ formaterNombre(formulaire.stock) }}
              <span class="text-sm font-medium text-mut">
                {{ formulaire.unite }}
              </span>
            </p>
          </div>

          <div class="rounded-xl bg-soft p-4">
            <p class="text-sm text-mut">Seuil d’alerte</p>
            <p class="mt-2 text-xl font-bold text-head">
              {{ formaterNombre(formulaire.seuilAlerte) }}
              <span class="text-sm font-medium text-mut">
                {{ formulaire.unite }}
              </span>
            </p>
          </div>

          <div class="rounded-xl bg-soft p-4">
            <p class="text-sm text-mut">Prix unitaire</p>
            <p class="mt-2 text-xl font-bold text-head">
              {{ formaterNombre(formulaire.prixUnitaire) }}
            </p>
          </div>
        </div>
      </section>

      <!-- Modification -->
      <section class="rounded-carte border border-line bg-card p-5 sm:p-7">
        <div class="mb-6 border-b border-line pb-5">
          <h2 class="text-lg font-bold text-head">
            Modifier l’ingrédient
          </h2>
          <p class="mt-1 text-sm text-mut">
            Les changements seront enregistrés dans l’inventaire.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="enregistrer">
          <div>
            <label for="nom" class="mb-2 block text-sm font-medium text-ink">
              Nom *
            </label>
            <input
              id="nom"
              v-model="formulaire.nom"
              required
              maxlength="100"
              class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
            />
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="unite" class="mb-2 block text-sm font-medium text-ink">
                Unité *
              </label>
              <select
                id="unite"
                v-model="formulaire.unite"
                required
                class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
              >
                <option value="kg">Kilogramme (kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="L">Litre (L)</option>
                <option value="mL">Millilitre (mL)</option>
                <option value="pièce">Pièce</option>
                <option value="sachet">Sachet</option>
                <option value="paquet">Paquet</option>
                <option value="bouteille">Bouteille</option>
              </select>
            </div>

            <div>
              <label for="fournisseur" class="mb-2 block text-sm font-medium text-ink">
                Fournisseur
              </label>
              <select
                id="fournisseur"
                v-model="formulaire.fournisseurId"
                class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
              >
                <option value="">Aucun fournisseur</option>
                <option
                  v-for="fournisseur in fournisseurs"
                  :key="fournisseur.id"
                  :value="String(fournisseur.id)"
                >
                  {{ fournisseur.nom }}
                </option>
              </select>
              <p v-if="erreurFournisseurs" class="mt-1 text-xs text-err">
                Les fournisseurs n’ont pas pu être chargés.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label for="stock" class="mb-2 block text-sm font-medium text-ink">
                Stock *
              </label>
              <input
                id="stock"
                v-model.number="formulaire.stock"
                type="number"
                min="0"
                step="any"
                required
                class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
              />
              <p class="mt-1 text-xs text-mut">
                Pour une traçabilité complète, privilégie la page Mouvement de stock pour changer la quantité.
              </p>
            </div>

            <div>
              <label for="seuil" class="mb-2 block text-sm font-medium text-ink">
                Seuil d’alerte *
              </label>
              <input
                id="seuil"
                v-model.number="formulaire.seuilAlerte"
                type="number"
                min="0"
                step="any"
                required
                class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
              />
            </div>

            <div>
              <label for="prix" class="mb-2 block text-sm font-medium text-ink">
                Prix unitaire *
              </label>
              <input
                id="prix"
                v-model.number="formulaire.prixUnitaire"
                type="number"
                min="0"
                step="any"
                required
                class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none focus:border-pri focus:ring-2 focus:ring-pri/20"
              />
            </div>
          </div>

          <div
            v-if="erreurFormulaire"
            class="rounded-xl border border-err/30 bg-err/5 px-4 py-3 text-sm text-err"
            role="alert"
          >
            {{ erreurFormulaire }}
          </div>

          <div class="flex flex-col-reverse justify-between gap-3 border-t border-line pt-5 sm:flex-row">
            <button
              type="button"
              class="rounded-xl border border-err/30 px-5 py-3 font-semibold text-err transition-colors hover:bg-err/5"
              @click="confirmationSuppression = true"
            >
              Supprimer l’ingrédient
            </button>

            <button
              type="submit"
              :disabled="enregistrement || !formulaireValide"
              class="rounded-xl bg-degrade px-5 py-3 font-semibold text-on-pri transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ enregistrement ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Confirmation de suppression -->
      <div
        v-if="confirmationSuppression"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="confirmationSuppression = false"
      >
        <section
          class="w-full max-w-md rounded-carte border border-line bg-card p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-suppression"
        >
          <h2 id="titre-suppression" class="text-lg font-bold text-head">
            Supprimer cet ingrédient ?
          </h2>
          <p class="mt-2 text-sm leading-6 text-mut">
            Cette action est définitive. Un ingrédient ayant des mouvements enregistrés ne pourra pas être supprimé.
          </p>

          <div class="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              :disabled="suppression"
              class="rounded-xl border border-line px-4 py-2.5 font-semibold text-ink"
              @click="confirmationSuppression = false"
            >
              Annuler
            </button>
            <button
              type="button"
              :disabled="suppression"
              class="rounded-xl bg-err px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              @click="supprimerIngredient"
            >
              {{ suppression ? 'Suppression...' : 'Confirmer la suppression' }}
            </button>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
```