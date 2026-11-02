<script setup>
const route = useRoute()

const {
  obtenirFacture,
  obtenirCommande,
  listerPaiements,
  creerPaiement,
  modifierFacture,
  annulerFacture,
  marquerCommandePayee,
  totalPaiements,
  resteAPayer,
} = useFactures()

const factureId = Number(route.params.id)


// ======================================================
// ANNULATION
// ======================================================

const annulationEnCours = ref(false)
const erreurAnnulation = ref('')

async function confirmerAnnulation() {
  erreurAnnulation.value = ''

  if (!facture.value) {
    return
  }

  if (facture.value.statut !== 'payee') {
    erreurAnnulation.value =
      'Seule une facture payée peut être annulée ici.'

    return
  }

  const confirmation = window.confirm(
    `Voulez-vous vraiment annuler la facture ${facture.value.numero} ?`
  )

  if (!confirmation) {
    return
  }

  annulationEnCours.value = true

  try {
    await annulerFacture(facture.value.id)

    await refresh()
  } catch (e) {
    erreurAnnulation.value =
      e.message ||
      'Impossible d’annuler la facture.'
  } finally {
    annulationEnCours.value = false
  }
}


// ======================================================
// DONNÉES FACTURE + PAIEMENTS + COMMANDE
// ======================================================

const {
  data: donnees,
  pending,
  error,
  refresh,
} = await useAsyncData(
  `facture-${factureId}`,
  async () => {
    const facture =
      await obtenirFacture(factureId)

    const [paiements, commande] =
      await Promise.all([
        listerPaiements(factureId),
        obtenirCommande(facture.commandeId),
      ])

    return {
      facture,
      paiements,
      commande,
    }
  },
  {
    default: () => ({
      facture: null,
      paiements: [],
      commande: null,
    }),
  }
)


// ======================================================
// DONNÉES CALCULÉES
// ======================================================

const facture = computed(() => {
  return donnees.value?.facture ?? null
})

const paiements = computed(() => {
  return donnees.value?.paiements ?? []
})

const commande = computed(() => {
  return donnees.value?.commande ?? null
})

const montantPaye = computed(() => {
  if (!facture.value) {
    return 0
  }

  return totalPaiements(paiements.value)
})

const reste = computed(() => {
  if (!facture.value) {
    return 0
  }

  return resteAPayer(
    facture.value.total,
    paiements.value
  )
})


// ======================================================
// CLÔTURE FACTURE + COMMANDE
// ======================================================

const clotureEnCours = ref(false)
const erreurCloture = ref('')

async function synchroniserCloture() {
  erreurCloture.value = ''

  if (!facture.value) {
    return false
  }

  if (reste.value > 0) {
    return false
  }

  clotureEnCours.value = true

  try {
    // Mettre la facture à payee seulement si nécessaire.
    if (facture.value.statut !== 'payee') {
      await modifierFacture(
        facture.value.id,
        {
          statut: 'payee',
        }
      )
    }

    // Mettre la commande à payee seulement si nécessaire.
    if (
      commande.value &&
      commande.value.statut !== 'payee'
    ) {
      await marquerCommandePayee(
        facture.value.commandeId
      )
    }

    return true
  } catch (e) {
    erreurCloture.value =
      e.message ||
      'La clôture de la facture n’a pas pu être terminée.'

    return false
  } finally {
    // On relit toujours l'état réel du serveur.
    try {
      await refresh()
    } catch {
      // On conserve l'erreur principale.
    }

    clotureEnCours.value = false
  }
}


// ======================================================
// PAIEMENT
// ======================================================

const montantPaiement = ref('')
const modePaiement = ref('especes')

const enregistrementEnCours = ref(false)
const erreurPaiement = ref('')

function dateLocaleIso() {
  const maintenant = new Date()

  const deuxChiffres = (valeur) => {
    return String(valeur).padStart(2, '0')
  }

  const date = [
    maintenant.getFullYear(),
    deuxChiffres(maintenant.getMonth() + 1),
    deuxChiffres(maintenant.getDate()),
  ].join('-')

  const heure = [
    deuxChiffres(maintenant.getHours()),
    deuxChiffres(maintenant.getMinutes()),
    deuxChiffres(maintenant.getSeconds()),
  ].join(':')

  return `${date}T${heure}`
}

async function enregistrerPaiement() {
  erreurPaiement.value = ''
  erreurCloture.value = ''

  const montant =
    Math.round(
      Number(montantPaiement.value) * 100
    ) / 100

  if (
    !Number.isFinite(montant) ||
    montant <= 0
  ) {
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
    // 1. Enregistrer le paiement.
    await creerPaiement({
      factureId: facture.value.id,
      montant,
      mode: modePaiement.value,
      date: dateLocaleIso(),
    })

    // Le paiement a réellement été créé.
    montantPaiement.value = ''

    // 2. Relire l'état réel depuis l'API.
    await refresh()

    // 3. Si le paiement solde la facture,
    // synchroniser facture + commande.
    if (reste.value <= 0) {
      const clotureReussie =
        await synchroniserCloture()

      if (!clotureReussie) {
        erreurPaiement.value =
          'Le paiement a bien été enregistré, mais la clôture n’a pas pu être terminée. N’ajoutez pas un nouveau paiement.'
      }
    }
  } catch (erreur) {
    erreurPaiement.value =
      erreur.message ||
      'Impossible d’enregistrer le paiement.'
  } finally {
    enregistrementEnCours.value = false
  }
}


// ======================================================
// AFFICHAGE
// ======================================================

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
  <section
    class="
      space-y-6
      print:fixed
      print:inset-0
      print:z-[9999]
      print:m-0
      print:w-full
      print:space-y-3
      print:bg-white
      print:p-6
      print:text-black
    "
  >
    <!-- Retour -->
    <NuxtLink
      to="/factures"
      class="
        inline-flex
        font-medium
        text-orange-600
        hover:underline
        print:hidden
      "
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
      class="
        rounded-lg
        border
        border-red-200
        bg-red-50
        p-4
        print:hidden
      "
    >
      <p class="font-medium text-red-700">
        Impossible de charger cette facture.
      </p>

      <p class="mt-1 text-sm text-red-600">
        {{ error.message }}
      </p>

      <button
        type="button"
        class="
          mt-3
          rounded-lg
          border
          px-4
          py-2
        "
        @click="refresh"
      >
        Réessayer
      </button>
    </div>

    <!-- Facture -->
    <template v-else-if="facture">
      <!-- En-tête facture -->
      <div
        class="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
          print:flex-row
          print:items-start
          print:justify-between
          print:gap-2
          print:[break-inside:avoid]
        "
      >
        <div>
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Facture
          </p>

          <h1
            class="
              text-3xl
              font-bold
              print:text-2xl
            "
          >
            {{ facture.numero }}
          </h1>

          <p
            class="
              mt-2
              text-gris
              print:mt-1
              print:text-sm
              print:text-gray-600
            "
          >
            Commande #{{ facture.commandeId }}
          </p>

          <p
            class="
              mt-1
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Date :
            {{ formaterDate(facture.creeLe) }}
          </p>
        </div>

        <!-- Statut + actions -->
        <div
          class="
            flex
            flex-wrap
            items-center
            gap-3
            print:gap-2
          "
        >
          <span
            class="
              rounded-full
              px-3
              py-1
              text-sm
              font-medium
              print:border
              print:border-gray-300
              print:bg-white
              print:px-2
              print:py-1
              print:text-xs
              print:text-black
            "
            :class="{
              'bg-green-100 text-green-700':
                facture.statut === 'payee',

              'bg-orange-100 text-orange-700':
                facture.statut === 'emise',

              'bg-red-100 text-red-700':
                facture.statut === 'annulee',
            }"
          >
            {{ libelleStatut(facture.statut) }}
          </span>

          <button
            type="button"
            class="
              rounded-lg
              bg-orange-500
              px-4
              py-2
              font-medium
              text-white
              hover:bg-orange-600
              print:hidden
            "
            @click="imprimerFacture"
          >
            Imprimer
          </button>

          <button
            v-if="facture.statut === 'payee'"
            type="button"
            :disabled="annulationEnCours"
            class="
              rounded-lg
              border
              border-red-600
              px-4
              py-2
              font-medium
              text-red-600
              transition
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              print:hidden
            "
            @click="confirmerAnnulation"
          >
            {{
              annulationEnCours
                ? 'Annulation...'
                : 'Annuler la facture'
            }}
          </button>

          <button
            v-if="
              facture &&
              reste <= 0 &&
              (
                facture.statut !== 'payee' ||
                commande?.statut !== 'payee'
              )
            "
            type="button"
            :disabled="clotureEnCours"
            class="
              rounded-lg
              border
              border-orange-600
              px-4
              py-2
              font-medium
              text-orange-600
              transition
              hover:bg-orange-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              print:hidden
            "
            @click="synchroniserCloture"
          >
            {{
              clotureEnCours
                ? 'Synchronisation...'
                : 'Réessayer la clôture'
            }}
          </button>

          <p
            v-if="erreurCloture"
            class="text-sm text-red-600 print:hidden"
          >
            {{ erreurCloture }}
          </p>
        </div>
      </div>

      <!-- Erreur annulation -->
      <p
        v-if="erreurAnnulation"
        class="
          text-sm
          text-red-600
          print:hidden
        "
      >
        {{ erreurAnnulation }}
      </p>

      <!-- Erreur clôture -->
      <p
        v-if="erreurCloture"
        class="
          text-sm
          text-red-600
          print:hidden
        "
      >
        {{ erreurCloture }}
      </p>

      <!-- Montants facture -->
      <div
        class="
          grid
          gap-4
          md:grid-cols-2
          lg:grid-cols-4
          print:grid-cols-4
          print:gap-2
          print:[break-inside:avoid]
        "
      >
        <!-- Sous-total -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Sous-total
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(facture.sousTotal) }}
          </p>
        </div>

        <!-- Remise -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Remise
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(facture.remise) }}
          </p>
        </div>

        <!-- Taxe -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Taxe
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(facture.taxe) }}
          </p>
        </div>

        <!-- Total -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Total
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(facture.total) }}
          </p>
        </div>
      </div>

      <!-- Synthèse paiement -->
      <div
        class="
          grid
          gap-4
          md:grid-cols-3
          print:grid-cols-3
          print:gap-2
          print:[break-inside:avoid]
        "
      >
        <!-- Total facture -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Total facture
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(facture.total) }}
          </p>
        </div>

        <!-- Montant payé -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Montant payé
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(montantPaye) }}
          </p>
        </div>

        <!-- Reste -->
        <div
          class="
            rounded-lg
            border
            border-bordure
            p-4
            print:rounded-none
            print:border-gray-300
            print:p-2
          "
        >
          <p
            class="
              text-sm
              text-gris
              print:text-xs
              print:text-gray-600
            "
          >
            Reste à payer
          </p>

          <p
            class="
              mt-1
              text-xl
              font-bold
              print:text-base
            "
          >
            {{ formaterPrix(reste) }}
          </p>
        </div>
      </div>

      <!-- Formulaire paiement -->
      <div
        v-if="
          facture.statut === 'emise' &&
          reste > 0
        "
        class="
          rounded-lg
          border
          border-bordure
          p-5
          print:hidden
        "
      >
        <h2 class="text-xl font-bold">
          Enregistrer un paiement
        </h2>

        <div
          class="
            mt-4
            grid
            gap-4
            md:grid-cols-2
          "
        >
          <!-- Montant -->
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
              placeholder="0.00"
              class="
                w-full
                rounded-lg
                border
                border-bordure
                px-3
                py-2
              "
            >
          </div>

          <!-- Mode -->
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
              class="
                w-full
                rounded-lg
                border
                border-line
                bg-card
                px-3
                py-2
                text-ink
                outline-none
                transition
                focus:border-pri
                focus:ring-2
                focus:ring-pri/30
              "
            >
              <option
                value="especes"
                class="bg-card text-ink"
              >
                Espèces
              </option>

              <option
                value="mobile_money"
                class="bg-card text-ink"
              >
                Mobile Money
              </option>

              <option
                value="carte"
                class="bg-card text-ink"
              >
                Carte
              </option>
            </select>
          </div>
        </div>

        <!-- Erreur paiement -->
        <p
          v-if="erreurPaiement"
          class="
            mt-3
            text-sm
            text-red-600
          "
        >
          {{ erreurPaiement }}
        </p>

        <!-- Bouton paiement -->
        <button
          type="button"
          class="
            mt-4
            rounded-lg
            bg-orange-500
            px-4
            py-2
            font-medium
            text-white
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
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
      <div
        class="
          print:[break-inside:avoid]
        "
      >
        <h2
          class="
            text-xl
            font-bold
            print:text-base
          "
        >
          Paiements
        </h2>

        <!-- Aucun paiement -->
        <p
          v-if="paiements.length === 0"
          class="
            mt-4
            text-gris
            print:mt-2
            print:text-sm
            print:text-gray-600
          "
        >
          Aucun paiement enregistré pour cette facture.
        </p>

        <!-- Tableau paiements -->
        <div
          v-else
          class="
            mt-4
            overflow-x-auto
            rounded-lg
            border
            border-bordure
            print:mt-2
            print:overflow-visible
            print:rounded-none
            print:border-gray-300
          "
        >
          <table class="w-full">
            <thead
              class="
                bg-soft
                text-ink
                print:bg-white
                print:text-black
              "
            >
              <tr>
                <th
                  class="
                    px-4
                    py-3
                    text-left
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  Date
                </th>

                <th
                  class="
                    px-4
                    py-3
                    text-left
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  Mode
                </th>

                <th
                  class="
                    px-4
                    py-3
                    text-left
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  Montant
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="paiement in paiements"
                :key="paiement.id"
                class="
                  border-t
                  border-bordure
                  print:border-gray-300
                "
              >
                <td
                  class="
                    px-4
                    py-3
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  {{ formaterDate(paiement.date) }}
                </td>

                <td
                  class="
                    px-4
                    py-3
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  {{
                    libelleModePaiement(
                      paiement.mode
                    )
                  }}
                </td>

                <td
                  class="
                    px-4
                    py-3
                    font-medium
                    print:px-2
                    print:py-1
                    print:text-xs
                  "
                >
                  {{
                    formaterPrix(
                      paiement.montant
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bas de facture uniquement à l'impression -->
      <div
        class="
          hidden
          border-t
          border-gray-300
          pt-3
          text-center
          text-xs
          text-gray-500
          print:block
          print:[break-inside:avoid]
        "
      >
        SmartResto — Facture {{ facture.numero }}
      </div>
    </template>
  </section>
</template>