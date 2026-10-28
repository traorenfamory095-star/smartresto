
<script setup>
import { reactive, ref } from 'vue'

useHead({ title: 'Nouvel ingrédient | SmartResto' })

const { creer, lire } = useApi()
const { succes, erreur } = useNotifier()

const fournisseurs = ref([])
const chargement = ref(false)
const chargementFournisseurs = ref(true)

const formulaire = reactive({
  nom: '',
  unite: 'kg',
  stock: 0,
  seuilAlerte: 5,
  prixUnitaire: 0,
  fournisseurId: '',
})

const erreurs = reactive({
  nom: '',
  stock: '',
  seuilAlerte: '',
  prixUnitaire: '',
})

async function chargerFournisseurs() {
  try {
    fournisseurs.value = await lire('/fournisseurs')
  } catch (e) {
    erreur(e)
  } finally {
    chargementFournisseurs.value = false
  }
}

await chargerFournisseurs()

function validerFormulaire() {
  erreurs.nom = ''
  erreurs.stock = ''
  erreurs.seuilAlerte = ''
  erreurs.prixUnitaire = ''

  if (!formulaire.nom.trim()) {
    erreurs.nom = 'Le nom de l’ingrédient est obligatoire.'
  }

  if (formulaire.stock === '' || !Number.isFinite(Number(formulaire.stock)) || Number(formulaire.stock) < 0) {
    erreurs.stock = 'Le stock doit être un nombre positif ou nul.'
  }

  if (formulaire.seuilAlerte === '' || !Number.isFinite(Number(formulaire.seuilAlerte)) || Number(formulaire.seuilAlerte) < 0) {
    erreurs.seuilAlerte = 'Le seuil doit être un nombre positif ou nul.'
  }

  if (formulaire.prixUnitaire === '' || !Number.isFinite(Number(formulaire.prixUnitaire)) || Number(formulaire.prixUnitaire) < 0) {
    erreurs.prixUnitaire = 'Le prix doit être un nombre positif ou nul.'
  }

  return !Object.values(erreurs).some(Boolean)
}

async function enregistrerIngredient() {
  if (!validerFormulaire()) return

  chargement.value = true

  try {
    const donnees = {
      nom: formulaire.nom.trim(),
      unite: formulaire.unite,
      stock: Number(formulaire.stock),
      seuilAlerte: Number(formulaire.seuilAlerte),
      prixUnitaire: Number(formulaire.prixUnitaire),
      fournisseurId: formulaire.fournisseurId || null,
    }

    await creer('/ingredients', donnees)

    succes('Ingrédient ajouté avec succès.')
    await navigateTo('/stock')
  } catch (e) {
    erreur(e)
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6">
    <header>
      <NuxtLink
        to="/stock"
        class="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← Retour au stock
      </NuxtLink>

      <h1 class="mt-3 text-3xl font-bold text-gray-900">
        Nouvel ingrédient
      </h1>

      <p class="mt-2 text-sm text-gray-500">
        Enregistre un ingrédient et définis son seuil d’alerte.
      </p>
    </header>

    <form
      class="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      @submit.prevent="enregistrerIngredient"
    >
      <div>
        <label for="nom" class="mb-2 block text-sm font-medium text-gray-700">
          Nom de l’ingrédient *
        </label>
        <input
          id="nom"
          v-model="formulaire.nom"
          required
          maxlength="100"
          placeholder="Ex. : Haricots"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          :aria-invalid="Boolean(erreurs.nom)"
          aria-describedby="erreur-nom"
        />
        <p v-if="erreurs.nom" id="erreur-nom" class="mt-1 text-sm text-red-600">
          {{ erreurs.nom }}
        </p>
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
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
            :disabled="chargementFournisseurs"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-60"
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
            Stock initial *
          </label>
          <input
            id="stock"
            v-model.number="formulaire.stock"
            type="number"
            min="0"
            step="any"
            required
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            :aria-invalid="Boolean(erreurs.stock)"
            aria-describedby="erreur-stock"
          />
          <p v-if="erreurs.stock" id="erreur-stock" class="mt-1 text-sm text-red-600">
            {{ erreurs.stock }}
          </p>
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
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            :aria-invalid="Boolean(erreurs.seuilAlerte)"
            aria-describedby="erreur-seuil"
          />
          <p v-if="erreurs.seuilAlerte" id="erreur-seuil" class="mt-1 text-sm text-red-600">
            {{ erreurs.seuilAlerte }}
          </p>
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
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            :aria-invalid="Boolean(erreurs.prixUnitaire)"
            aria-describedby="erreur-prix"
          />
          <p v-if="erreurs.prixUnitaire" id="erreur-prix" class="mt-1 text-sm text-red-600">
            {{ erreurs.prixUnitaire }}
          </p>
        </div>
      </div>

      <p class="text-xs text-gray-500">
        Les champs marqués d’un astérisque (*) sont obligatoires.
      </p>

      <div class="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <NuxtLink
          to="/stock"
          class="rounded-lg border border-gray-300 px-5 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </NuxtLink>

        <button
          type="submit"
          :disabled="chargement"
          class="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ chargement ? 'Enregistrement...' : 'Enregistrer l’ingrédient' }}
        </button>
      </div>
    </form>
  </main>
</template>
