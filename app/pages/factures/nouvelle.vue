<script setup>
useHead({
  title: 'Nouvelle facture',
})

const router = useRouter()

const {
  listerFactures,
  listerCommandes,
  listerLignesCommande,
  creerFacture,
  calculerMontants,
  genererNumeroFacture,
} = useFactures()

const commandeId = ref('')
const lignes = ref([])

const remisePourcentage = ref(0)

const chargementLignes = ref(false)
const enregistrement = ref(false)

const erreur = ref('')

const TAUX_TAXE = 16

const {
  data: donneesInitiales,
  pending,
  error: erreurChargement,
} = await useAsyncData(
  'creation-facture',
  async () => {
    const [commandes, factures] = await Promise.all([
      listerCommandes({
        statut: 'servie',
      }),
      listerFactures(),
    ])

    return {
      commandes,
      factures,
    }
  },
  {
    default: () => ({
      commandes: [],
      factures: [],
    }),
  }
)

const commandesDisponibles = computed(() => {
  const commandesFacturees = new Set(
    donneesInitiales.value.factures.map(
      (facture) => Number(facture.commandeId)
    )
  )

  return donneesInitiales.value.commandes.filter(
    (commande) =>
      !commandesFacturees.has(Number(commande.id))
  )
})

const montants = computed(() => {
  return calculerMontants(
    lignes.value,
    remisePourcentage.value,
    TAUX_TAXE
  )
})

const numeroFacture = computed(() => {
  return genererNumeroFacture(
    donneesInitiales.value.factures
  )
})

watch(commandeId, async (nouvelId) => {
  lignes.value = []
  erreur.value = ''

  if (!nouvelId) {
    return
  }

  chargementLignes.value = true

  try {
    lignes.value = await listerLignesCommande(
      Number(nouvelId)
    )
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargementLignes.value = false
  }
})

function dateLocaleIso() {
  const maintenant = new Date()

  const deuxChiffres = (valeur) =>
    String(valeur).padStart(2, '0')

  return (
    [
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
  )
}

async function genererFacture() {
  erreur.value = ''

  if (!commandeId.value) {
    erreur.value =
      'Veuillez sélectionner une commande.'

    return
  }

  if (lignes.value.length === 0) {
    erreur.value =
      'Cette commande ne contient aucune ligne.'

    return
  }

  const remise = Number(remisePourcentage.value)

  if (
    !Number.isFinite(remise) ||
    remise < 0 ||
    remise > 100
  ) {
    erreur.value =
      'La remise doit être comprise entre 0 et 100 %.'

    return
  }

  enregistrement.value = true

  try {
    // 1. Relire les factures pour avoir les données les plus récentes
    const facturesActuelles =
      await listerFactures()

    // 2. Vérifier si cette commande possède déjà une facture
    const commandeDejaFacturee =
      facturesActuelles.some(
        (facture) =>
          Number(facture.commandeId) ===
          Number(commandeId.value)
      )

    if (commandeDejaFacturee) {
      erreur.value =
        'Cette commande possède déjà une facture.'

      return
    }

    // 3. Générer le numéro à partir des factures fraîches
    const nouveauNumero =
      genererNumeroFacture(facturesActuelles)

    // 4. Créer la facture
    const facture = await creerFacture({
      commandeId: Number(commandeId.value),
      numero: nouveauNumero,
      sousTotal: montants.value.sousTotal,
      remise: montants.value.remise,
      taxe: montants.value.taxe,
      total: montants.value.total,
      statut: 'emise',
      creeLe: dateLocaleIso(),
    })

    // 5. Aller vers la facture créée
    await router.push(`/factures/${facture.id}`)
  } catch (e) {
    erreur.value =
      e.message ||
      'Impossible de générer la facture.'
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <NuxtLink
      to="/factures"
      class="inline-flex font-medium text-orange-600 hover:underline"
    >
      ← Retour aux factures
    </NuxtLink>

    <div>
      <h1 class="text-3xl font-bold">
        Nouvelle facture
      </h1>

      <p class="mt-2 text-gris">
        Générez une facture à partir d'une commande servie.
      </p>
    </div>

    <p
      v-if="pending"
      class="text-gris"
    >
      Chargement des commandes...
    </p>

    <div
      v-else-if="erreurChargement"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ erreurChargement.message }}
    </div>

    <template v-else>
      <div class="rounded-lg border border-bordure p-5">
        <div>
          <label
            for="commande"
            class="mb-2 block font-medium"
          >
            Commande servie
          </label>

          <select
            id="commande"
            v-model="commandeId"
            class="w-full rounded-lg border border-bordure px-3 py-2"
          >
            <option value="">
              Sélectionner une commande
            </option>

            <option
              v-for="commande in commandesDisponibles"
              :key="commande.id"
              :value="commande.id"
            >
              Commande #{{ commande.id }}
              — Table {{ commande.tableId }}
            </option>
          </select>
        </div>

        <p
          v-if="commandesDisponibles.length === 0"
          class="mt-3 text-sm text-gris"
        >
          Aucune commande servie disponible pour facturation.
        </p>
      </div>

      <p
        v-if="chargementLignes"
        class="text-gris"
      >
        Chargement des lignes de la commande...
      </p>

      <template v-if="commandeId && !chargementLignes">
        <div class="rounded-lg border border-bordure p-5">
          <h2 class="text-xl font-bold">
            Paramètres de facturation
          </h2>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                for="numero"
                class="mb-2 block font-medium"
              >
                Numéro
              </label>

              <input
                id="numero"
                :value="numeroFacture"
                type="text"
                disabled
                class="w-full rounded-lg border border-bordure bg-gray-50 px-3 py-2"
              >
            </div>

            <div>
              <label
                for="remise"
                class="mb-2 block font-medium"
              >
                Remise (%)
              </label>

              <input
                id="remise"
                v-model.number="remisePourcentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="w-full rounded-lg border border-bordure px-3 py-2"
              >
            </div>
          </div>
        </div>

        <!-- Lignes de commande -->
        <div>
          <h2 class="text-xl font-bold">
            Lignes de commande
          </h2>

          <div
            v-if="lignes.length > 0"
            class="mt-4 overflow-x-auto rounded-lg border border-bordure"
          >
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left">
                    Plat
                  </th>

                  <th class="px-4 py-3 text-left">
                    Quantité
                  </th>

                  <th class="px-4 py-3 text-left">
                    Prix unitaire
                  </th>

                  <th class="px-4 py-3 text-left">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="ligne in lignes"
                  :key="ligne.id"
                  class="border-t border-bordure"
                >
                  <td class="px-4 py-3">
                    Plat #{{ ligne.platId }}
                  </td>

                  <td class="px-4 py-3">
                    {{ ligne.quantite }}
                  </td>

                  <td class="px-4 py-3">
                    {{ formaterPrix(ligne.prixUnitaire) }}
                  </td>

                  <td class="px-4 py-3 font-medium">
                    {{
                      formaterPrix(
                        ligne.prixUnitaire *
                        ligne.quantite
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Calculs -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-lg border border-bordure p-4">
            <p class="text-sm text-gris">
              Sous-total
            </p>

            <p class="mt-1 text-xl font-bold">
              {{ formaterPrix(montants.sousTotal) }}
            </p>
          </div>

          <div class="rounded-lg border border-bordure p-4">
            <p class="text-sm text-gris">
              Remise
            </p>

            <p class="mt-1 text-xl font-bold">
              {{ formaterPrix(montants.remise) }}
            </p>
          </div>

          <div class="rounded-lg border border-bordure p-4">
            <p class="text-sm text-gris">
              Taxe ({{ TAUX_TAXE }} %)
            </p>

            <p class="mt-1 text-xl font-bold">
              {{ formaterPrix(montants.taxe) }}
            </p>
          </div>

          <div class="rounded-lg border border-bordure p-4">
            <p class="text-sm text-gris">
              Total
            </p>

            <p class="mt-1 text-xl font-bold">
              {{ formaterPrix(montants.total) }}
            </p>
          </div>
        </div>

        <p
          v-if="erreur"
          class="text-sm text-red-600"
        >
          {{ erreur }}
        </p>

        <button
          type="button"
          class="rounded-lg bg-orange-500 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="
            enregistrement ||
            !commandeId ||
            lignes.length === 0
          "
          @click="genererFacture"
        >
          {{
            enregistrement
              ? 'Génération...'
              : 'Générer la facture'
          }}
        </button>
      </template>
    </template>
  </section>
</template>