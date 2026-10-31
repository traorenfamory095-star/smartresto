```vue
<script setup>
import { computed, reactive, ref } from 'vue'

useHead({ title: 'Nouvel ingrédient | SmartResto' })

const router = useRouter()
const { lire, creer } = useApi()
const { succes, erreur } = useNotifier()

const formulaire = reactive({
  nom: '',
  unite: 'kg',
  stock: 0,
  seuilAlerte: 5,
  prixUnitaire: 0,
  fournisseurId: '',
})

const enregistrement = ref(false)
const erreurFormulaire = ref('')

const {
  data: fournisseurs,
  pending: chargementFournisseurs,
  error: erreurFournisseurs,
  refresh: rechargerFournisseurs,
} = await useAsyncData(
  'stock-nouveau-fournisseurs',
  () => lire('/fournisseurs'),
  { default: () => [] },
)

const formulaireValide = computed(() =>
  formulaire.nom.trim().length > 0 &&
  Number(formulaire.stock) >= 0 &&
  Number(formulaire.seuilAlerte) >= 0 &&
  Number(formulaire.prixUnitaire) >= 0,
)

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
    return 'Le stock initial doit être positif ou nul.'
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
    const donnees = {
      nom: formulaire.nom.trim(),
      unite: formulaire.unite,
      stock: Number(formulaire.stock),
      seuilAlerte: Number(formulaire.seuilAlerte),
      prixUnitaire: Number(formulaire.prixUnitaire),
      fournisseurId: formulaire.fournisseurId
        ? Number(formulaire.fournisseurId)
        : null,
    }

    await creer('/ingredients', donnees)

    succes('Ingrédient créé avec succès.')
    await router.push('/stock')
  } catch (e) {
    erreur(e)
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <main class="min-h-screen space-y-6 bg-bg p-4 text-ink sm:p-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-head sm:text-3xl">
          Nouvel ingrédient
        </h1>
        <p class="mt-2 text-sm text-mut">
          Ajoutez un ingrédient à l’inventaire de votre restaurant.
        </p>
      </div>

      <NuxtLink
        to="/stock"
        class="inline-flex items-center justify-center rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-pri hover:text-pri"
      >
        ← Retour au stock
      </NuxtLink>
    </header>

    <section class="mx-auto max-w-3xl rounded-carte border border-line bg-card p-5 sm:p-7">
      <div class="mb-6 border-b border-line pb-5">
        <h2 class="text-lg font-bold text-head">
          Informations de l’ingrédient
        </h2>
        <p class="mt-1 text-sm text-mut">
          Renseignez les informations nécessaires à la gestion du stock.
        </p>
      </div>

      <div
        v-if="chargementFournisseurs"
        class="mb-5 rounded-xl bg-soft p-3 text-sm text-mut"
      >
        Chargement des fournisseurs...
      </div>

      <div
        v-else-if="erreurFournisseurs"
        class="mb-5 rounded-xl border border-err/30 bg-err/5 p-4"
      >
        <p class="text-sm text-err">
          Impossible de charger les fournisseurs. Vous pouvez réessayer.
        </p>
        <button
          type="button"
          class="mt-2 text-sm font-semibold text-pri underline underline-offset-4"
          @click="rechargerFournisseurs()"
        >
          Réessayer
        </button>
      </div>

      <form class="space-y-5" @submit.prevent="enregistrer">
        <div>
          <label for="nom" class="mb-2 block text-sm font-medium text-ink">
            Nom de l’ingrédient *
          </label>
          <input
            id="nom"
            v-model="formulaire.nom"
            type="text"
            required
            maxlength="100"
            placeholder="Ex. : Riz, tomates, farine..."
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/20"
          />
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label for="unite" class="mb-2 block text-sm font-medium text-ink">
              Unité de mesure *
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
          </div>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label for="stock" class="mb-2 block text-sm font-medium text-ink">
              Stock initial *
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
            <p class="mt-1 text-xs text-mut">
              Une alerte apparaît lorsque le stock atteint ce seuil.
            </p>
          </div>
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
          <p class="mt-1 text-xs text-mut">
            Devise selon la convention utilisée dans votre projet.
          </p>
        </div>

        <div
          v-if="erreurFormulaire"
          class="rounded-xl border border-err/30 bg-err/5 px-4 py-3 text-sm text-err"
          role="alert"
        >
          {{ erreurFormulaire }}
        </div>

        <div class="flex flex-col-reverse justify-end gap-3 border-t border-line pt-5 sm:flex-row">
          <NuxtLink
            to="/stock"
            class="rounded-xl border border-line bg-card px-5 py-3 text-center font-semibold text-ink transition-colors hover:border-pri hover:text-pri"
          >
            Annuler
          </NuxtLink>

          <button
            type="submit"
            :disabled="enregistrement || !formulaireValide"
            class="rounded-xl bg-degrade px-5 py-3 font-semibold text-on-pri transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ enregistrement ? 'Enregistrement...' : 'Créer l’ingrédient' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
```