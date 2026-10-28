<script setup>
const route = useRoute()

const {
  obtenirFacture,
  listerPaiements,
  creerPaiement,
  modifierFacture,
  marquerCommandePayee,
  totalPaiements,
  resteAPayer,
} = useFactures()


const factureId = Number(route.params.id)

const {
  data,
  pending,
  error,
  refresh,
} = await useAsyncData(
  `facture-${factureId}`,
  async () => {
    const [facture, paiements] = await Promise.all([
      obtenirFacture(factureId),
      listerPaiements(factureId),
    ])

    return {
      facture,
      paiements,
    }
  }
)

const facture = computed(() => data.value?.facture ?? null)

const paiements = computed(() => data.value?.paiements ?? [])

const montantPaye = computed(() => {
  return facture.value
    ? totalPaiements(paiements.value)
    : 0
})

const reste = computed(() => {
  return facture.value
    ? resteAPayer(facture.value.total, paiements.value)
    : 0
})

const montantPaiement = ref('')
const modePaiement = ref('especes')

const enregistrementEnCours = ref(false)
const erreurPaiement = ref('')

function dateLocaleIso() {
  const maintenant = new Date()

  const deuxChiffres = (valeur) =>
    String(valeur).padStart(2, '0')

  return [
    maintenant.getFullYear(),
    deuxChiffres(maintenant.getMonth() + 1),
    deuxChiffres(maintenant.getDate()),
  ].join('-') +
    'T' +
    [
      deuxChiffres(maintenant.getHours()),
      deuxChiffres(maintenant.getMinutes()),
      deuxChiffres(maintenant.getSeconds()),
    ].join(':')
}

async function enregistrerPaiement() {
  erreurPaiement.value = ''

  const montant = Math.round(
    Number(montantPaiement.value) * 100
  ) / 100

  if (!Number.isFinite(montant) || montant <= 0) {
    erreurPaiement.value =
      'Le montant doit être supérieur à 0.'

    return
  }

  if (montant > reste.value) {
    erreurPaiement.value =
      'Le paiement ne peut pas dépasser le reste à payer.'

    return
  }

  enregistrementEnCours.value = true

  try {
    await creerPaiement({
      factureId: facture.value.id,
      montant,
      mode: modePaiement.value,
      date: dateLocaleIso(),
    })

    const nouveauTotalPaye = Math.round(
      (montantPaye.value + montant) * 100
    ) / 100

    const factureSoldee =
      nouveauTotalPaye >= Number(facture.value.total)

    if (factureSoldee) {
      await modifierFacture(facture.value.id, {
        statut: 'payee',
      })

      await marquerCommandePayee(
        facture.value.commandeId
      )
    }

    montantPaiement.value = ''

    await refresh()
  } catch (erreur) {
    erreurPaiement.value = erreur.message
  } finally {
    enregistrementEnCours.value = false
  }
}

function libelleStatut(statut) {
  const libelles = {
    emise: 'Émise',
    payee: 'Payée',
    annulee: 'Annulée',
  }

  return libelles[statut] ?? statut
}

function libelleModePaiement(mode) {
  const modes = {
    especes: 'Espèces',
    mobile_money: 'Mobile Money',
    carte: 'Carte',
  }

  return modes[mode] ?? mode
}

function imprimerFacture() {
  window.print()
}

useHead(() => ({
  title: facture.value
    ? `Facture ${facture.value.numero}`
    : 'Détail facture',
}))
</script>

<template>
  <section class="space-y-6">
    <!-- Navigation -->
    <NuxtLink
      to="/factures"
      class="inline-flex font-medium text-orange-600 hover:underline print:hidden"
    >
      ← Retour aux factures
    </NuxtLink>

    <!-- Chargement -->
    <p
      v-if="pending"
      class="text-gris"
    >
      Chargement de la facture...
    </p>

    <!-- Erreur -->
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <p class="font-medium text-red-700">
        Impossible de charger cette facture.
      </p>

      <p class="mt-1 text-sm text-red-600">
        {{ error.message }}
      </p>

      <button
        type="button"
        class="mt-3 rounded-lg border px-4 py-2"
        @click="refresh"
      >
        Réessayer
      </button>
    </div>

    <!-- Facture -->
    <template v-else-if="facture">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <p class="text-sm text-gris">
            Facture
          </p>

          <h1 class="text-3xl font-bold">
            {{ facture.numero }}
          </h1>

          <p class="mt-2 text-gris">
            Commande #{{ facture.commandeId }}
          </p>
        </div>

        <div class="flex items-center gap-3 print:hidden">
          <span
            class="rounded-full px-3 py-1 text-sm font-medium"
            :class="{
              'bg-green-100 text-green-700': facture.statut === 'payee',
              'bg-orange-100 text-orange-700': facture.statut === 'emise',
              'bg-red-100 text-red-700': facture.statut === 'annulee',
            }"
          >
            {{ libelleStatut(facture.statut) }}
          </span>

          <button
            type="button"
            class="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600"
            @click="imprimerFacture"
          >
            Imprimer
          </button>
        </div>
      </div>

      <!-- Informations financières -->
      <div
        class="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Sous-total
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(facture.sousTotal) }}
          </p>
        </div>

        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Remise
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(facture.remise) }}
          </p>
        </div>

        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Taxe
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(facture.taxe) }}
          </p>
        </div>

        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Total
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(facture.total) }}
          </p>
        </div>
      </div>

      <!-- Synthèse paiement -->
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Total facture
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(facture.total) }}
          </p>
        </div>

        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Montant payé
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(montantPaye) }}
          </p>
        </div>

        <div class="rounded-lg border border-bordure p-4">
          <p class="text-sm text-gris">
            Reste à payer
          </p>

          <p class="mt-1 text-xl font-bold">
            {{ formaterPrix(reste) }}
          </p>
        </div>
      </div>

      <div
        v-if="facture.statut === 'emise' && reste > 0"
        class="rounded-lg border border-bordure p-5 print:hidden"
        >
        <h2 class="text-xl font-bold">
            Enregistrer un paiement
        </h2>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
            <label
                for="montant"
                class="mb-2 block font-medium"
            >
                Montant
            </label>

            <input
                id="montant"
                v-model="montantPaiement"
                type="number"
                min="0.01"
                :max="reste"
                step="0.01"
                class="w-full rounded-lg border border-bordure px-3 py-2"
                placeholder="0.00"
            >
            </div>

            <div>
            <label
                for="mode"
                class="mb-2 block font-medium"
            >
                Mode de paiement
            </label>

            <select
                id="mode"
                v-model="modePaiement"
                class="w-full rounded-lg border border-bordure px-3 py-2"
            >
                <option value="especes">
                Espèces
                </option>

                <option value="mobile_money">
                Mobile Money
                </option>

                <option value="carte">
                Carte
                </option>
            </select>
            </div>
        </div>

        <p
            v-if="erreurPaiement"
            class="mt-3 text-sm text-red-600"
        >
            {{ erreurPaiement }}
        </p>

        <button
            type="button"
            class="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="enregistrementEnCours"
            @click="enregistrerPaiement"
        >
            {{
            enregistrementEnCours
                ? 'Enregistrement...'
                : 'Enregistrer le paiement'
            }}
        </button>
        </div>

      <!-- Paiements -->
      <div>
        <h2 class="text-xl font-bold">
          Paiements
        </h2>

        <p
          v-if="paiements.length === 0"
          class="mt-4 text-gris"
        >
          Aucun paiement enregistré pour cette facture.
        </p>

        <div
          v-else
          class="mt-4 overflow-x-auto rounded-lg border border-bordure"
        >
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">
                  Date
                </th>

                <th class="px-4 py-3 text-left">
                  Mode
                </th>

                <th class="px-4 py-3 text-left">
                  Montant
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="paiement in paiements"
                :key="paiement.id"
                class="border-t border-bordure"
              >
                <td class="px-4 py-3">
                  {{ formaterDate(paiement.date) }}
                </td>

                <td class="px-4 py-3">
                  {{ libelleModePaiement(paiement.mode) }}
                </td>

                <td class="px-4 py-3 font-medium">
                  {{ formaterPrix(paiement.montant) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>