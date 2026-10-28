
<script setup>
import { reactive, ref } from 'vue'

const route = useRoute()
const id = String(route.params.id)

useHead({ title: `Détail de l’ingrédient | SmartResto` })

const { lire, modifier } = useApi()
const { succes, erreur } = useNotifier()

const {
  data: ingredient,
  pending,
  error: erreurChargement,
  refresh,
} = await useAsyncData(
  `stock-ingredient-${id}`,
  () => lire(`/ingredients/${encodeURIComponent(id)}`),
)

const { data: fournisseurs } = await useAsyncData(
  'stock-fournisseurs',
  () => lire('/fournisseurs'),
  { default: () => [] },
)

const formulaire = reactive({
  nom: ingredient.value?.nom ?? '',
  unite: ingredient.value?.unite ?? 'kg',
  stock: ingredient.value?.stock ?? 0,
  seuilAlerte: ingredient.value?.seuilAlerte ?? 0,
  prixUnitaire: ingredient.value?.prixUnitaire ?? 0,
  fournisseurId: ingredient.value?.fournisseurId ?? '',
})

const chargement = ref(false)
const messageErreur = ref('')

async function enregistrerModifications() {
  messageErreur.value = ''

  if (!formulaire.nom.trim()) {
    messageErreur.value = 'Le nom de l’ingrédient est obligatoire.'
    return
  }

  const champsNumeriques = [
    ['Stock', formulaire.stock],
    ['Seuil d’alerte', formulaire.seuilAlerte],
    ['Prix unitaire', formulaire.prixUnitaire],
  ]

  for (const [nom, valeur] of champsNumeriques) {
    if (
      valeur === '' ||
      !Number.isFinite(Number(valeur)) ||
      Number(valeur) < 0
    ) {
      messageErreur.value = `${nom} doit être un nombre positif ou nul.`
      return
    }
  }

  chargement.value = true

  try {
    await modifier(`/ingredients/${encodeURIComponent(id)}`, {
      nom: formulaire.nom.trim(),
      unite: formulaire.unite,
      stock: Number(formulaire.stock),
      seuilAlerte: Number(formulaire.seuilAlerte),
      prixUnitaire: Number(formulaire.prixUnitaire),
      fournisseurId: formulaire.fournisseurId || null,
    })

    await refresh()
    succes('Les modifications ont été enregistrées.')
    await navigateTo('/stock')
  } catch (e) {
    messageErreur.value = e?.message || 'Impossible de modifier cet ingrédient.'
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6">
    <NuxtLink
      to="/stock"
      class="text-sm font-medium text-orange-600 hover:text-orange-700"
    >
      ← Retour au stock
    </NuxtLink>

    <div v-if="pending" class="rounded-xl border bg-white p-8 text-gray-500" role="status">
      Chargement de l’ingrédient...
    </div>

    <section
      v-else-if="erreurChargement || !ingredient"
      class="rounded-xl border border-red-200 bg-red-50 p-6"
    >
      <h1 class="text-xl font-bold text-red-800">
        Ingrédient introuvable
      </h1>
      <p class="mt-2 text-sm text-red-700">
        Impossible de charger cet ingrédient. Vérifie son identifiant et le serveur API.
      </p>
      <NuxtLink to="/stock" class="mt-4 inline-block font-medium text-red-800 underline">
        Revenir à la liste
      </NuxtLink>
    </section>

    <template v-else>
      <header>
        <p class="text-sm font-medium text-orange-600">INGRÉDIENT #{{ ingredient.id }}</p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">
          {{ ingredient.nom }}
        </h1>
        <p class="mt-2 text-sm text-gray-500">
          Consulte et modifie les informations de cet ingrédient.
        </p>
      </header>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-500">Stock actuel</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">
            {{ ingredient.stock }} {{ ingredient.unite }}
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-500">Seuil d’alerte</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">
            {{ ingredient.seuilAlerte }} {{ ingredient.unite }}
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-500">État du stock</p>
          <p
            class="mt-2 font-bold"
            :class="Number(ingredient.stock) <= Number(ingredient.seuilAlerte)
              ? 'text-red-600'
              : 'text-emerald-600'"
          >
            {{ Number(ingredient.stock) <= Number(ingredient.seuilAlerte)
              ? 'Stock en alerte'
              : 'Stock disponible' }}
          </p>
        </div>
      </section>

      <form
        class="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        @submit.prevent="enregistrerModifications"
      >
        <h2 class="text-lg font-semibold text-gray-900">
          Modifier les informations
        </h2>

        <div>
          <label for="nom" class="mb-2 block text-sm font-medium text-gray-700">
            Nom *
          </label>
          <input
            id="nom"
            v-model="formulaire.nom"
            required
            maxlength="100"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="unite" class="mb-2 block text-sm font-medium text-gray-700">
              Unité *
            </label>
            <select
              id="unite"
              v-model="formulaire.unite"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
            >
              <option value="kg">Kilogramme (kg)</option>
              <option value="L">Litre (L)</option>
              <option value="pièce">Pièce</option>
              <option value="paquet">Paquet</option>
              <option value="bouteille">Bouteille</option>
            </select>
          </div>

          <div>
            <label for="fournisseur" class="mb-2 block text-sm font-medium text-gray-700">
              Fournisseur
            </label>
            <select
              id="fournisseur"
              v-model="formulaire.fournisseurId"
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
            >
              <option value="">Aucun fournisseur</option>
              <option
                v-for="fournisseur in fournisseurs"
                :key="fournisseur.id"
                :value="fournisseur.id"
              >
                {{ fournisseur.nom }}
              </option>
            </select>
          </div>

          <div>
            <label for="stock" class="mb-2 block text-sm font-medium text-gray-700">
              Stock *
            </label>
            <input
              id="stock"
              v-model.number="formulaire.stock"
              type="number"
              min="0"
              step="any"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label for="seuil" class="mb-2 block text-sm font-medium text-gray-700">
              Seuil d’alerte *
            </label>
            <input
              id="seuil"
              v-model.number="formulaire.seuilAlerte"
              type="number"
              min="0"
              step="any"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div class="sm:col-span-2">
            <label for="prix" class="mb-2 block text-sm font-medium text-gray-700">
              Prix unitaire ($) *
            </label>
            <input
              id="prix"
              v-model.number="formulaire.prixUnitaire"
              type="number"
              min="0"
              step="any"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        </div>

        <p v-if="messageErreur" class="text-sm text-red-600" role="alert">
          {{ messageErreur }}
        </p>

        <div class="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <NuxtLink
            to="/stock"
            class="rounded-lg border border-gray-300 px-5 py-3 text-center font-medium text-gray-700"
          >
            Annuler
          </NuxtLink>

          <button
            type="submit"
            :disabled="chargement"
            class="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {{ chargement ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </div>
      </form>
    </template>
  </main>
</template>
