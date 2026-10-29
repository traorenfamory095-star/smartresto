
<script setup>
const { recupererReservations, annulerReservation, recupererTables, creerReservation } = useTables()

useHead({ title: 'Réservations | SmartResto' })

const { data: reservations, pending, error, refresh, } = await useAsyncData(
  'liste-reservations',
  recupererReservations,
  { default: () => [] }
)

const enCours = ref(false)
const messageErreur = ref('')

function formaterDate(date) {
  if (!date) return '—'

  const valeur = new Date(date)

  if (Number.isNaN(valeur.getTime())) return date

  return valeur.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function libelleStatut(statut) {
  const statuts = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    annulee: 'Annulée',
    terminee: 'Terminée',
  }

  return statuts[statut] || statut || 'Non défini'
}

async function annuler(id) {
  messageErreur.value = ''
  messageSucces.value = ''
  enCours.value = true

  try {
    await annulerReservation(id)
    await refresh()

    afficherMessageSucces('Réservation annulée avec succès.')
  } catch (erreur) {
    messageErreur.value =
      "Impossible d'annuler cette réservation. Vérifie l'API."
  } finally {
    enCours.value = false
  }
}

//-----------------------------------------
const formulaireOuvert = ref(false)
const enregistrement = ref(false)
const erreurFormulaire = ref('')
const messageSucces = ref('')

const { data: tables } = await useAsyncData('tables-pour-reservations', recupererTables,
  { default: () => [] }
)

const formulaire = reactive({
  nomClient: '',
  telephone: '',
  nbPersonnes: 2,
  date: '',
  heure: '',
  tableId: '',
  note: '',
})

// Filtrer les tables selon leur capacité et leur disponibilité
const tablesAdaptees = computed(() => {
  return tables.value.filter((table) => {
    const capaciteValide =
      table.actif &&
      Number(table.capacite) >= Number(formulaire.nbPersonnes)

    if (!capaciteValide) return false

    // Si la date ou l'heure n'est pas encore choisie
    if (!formulaire.date || !formulaire.heure) {
      return true
    }

    // Vérifier la disponibilité lorsque les deux sont renseignées
    return verifierDisponibilite(
      table.id,
      formulaire.date,
      formulaire.heure
    )
  })
})

function fermerModal() {
  formulaireOuvert.value = false
  erreurFormulaire.value = ''
}

//-------------------------------

// REGLE METIER - RESERVATION

function verifierDisponibilite(tableId, date, heure) {
  const maintenant = new Date()

  const debutNouvelle = new Date(`${date}T${heure}:00`)
  const finNouvelle = new Date(
    debutNouvelle.getTime() + 120 * 60 * 1000
  )

  if (debutNouvelle < maintenant) return false

  return !reservations.value.some((reservation) => {

    // Ignorer les réservations annulées ou terminées
    if (
      reservation.statut === 'annulee' ||
      reservation.statut === 'terminee'
    ) {
      return false
    }

    // Vérifier la même table et la même date
    if (
      Number(reservation.tableId) !== Number(tableId) ||
      reservation.date !== date
    ) {
      return false
    }

    const debutExistante = new Date(
      `${reservation.date}T${reservation.heure}:00`
    )

    const finExistante = new Date(
      debutExistante.getTime() + 120 * 60 * 1000
    )

    // Vérifier le chevauchement des créneaux
    return (
      debutNouvelle < finExistante &&
      finNouvelle > debutExistante
    )
  })
}



function reinitialiserFormulaire() {
  Object.assign(formulaire, {
    nomClient: '',
    telephone: '',
    nbPersonnes: 2,
    date: '',
    heure: '',
    tableId: '',
    note: '',
  })
}
function afficherMessageSucces(message){
  messageSucces.value = message
  
  setTimeout(() => {
    messageSucces.value = ''
  }, 3000);
}
async function enregistrerReservation() {
  erreurFormulaire.value = ''
  messageSucces.value = ''

  const table = tables.value.find(
    (t) => Number(t.id) === Number(formulaire.tableId)
  )

  if (!table || !table.actif) {
    erreurFormulaire.value = 'Sélectionne une table valide.'
    return
  }

  if (Number(formulaire.nbPersonnes) > Number(table.capacite)) {
    erreurFormulaire.value = 'La capacité de cette table est insuffisante.'
    return
  }

  if(
    !verifierDisponibilite(
      formulaire.tableId,
      formulaire.date,
      formulaire.heure
    )
  ){
    erreurFormulaire.value = 
    'Cette table est déjà réservé sur ce créneau. Choisissez une autre table ou une autre heure.'

    return
  }

  enregistrement.value = true

  try {
    await creerReservation({
      nomClient: formulaire.nomClient.trim(),
      telephone: formulaire.telephone.trim(),
      nbPersonnes: Number(formulaire.nbPersonnes),
      date: formulaire.date,
      heure: formulaire.heure,
      tableId: Number(formulaire.tableId),
      statut: 'confirmee',
      note: formulaire.note.trim(),
    })

    await refresh()

    reinitialiserFormulaire()
    fermerModal()
    afficherMessageSucces('Réservation créée avec succès.')

  } catch (erreur) {
    erreurFormulaire.value =
      "Impossible de créer la réservation. Vérifie l'API."
  } finally {
    enregistrement.value = false
  }
}

</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Réservations</h1>
        <p class="mt-2 text-gris">
          Consulte et gère les réservations du restaurant.
        </p>
      </div>

      <button
        type="button"
        class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        @click="formulaireOuvert = true"
      >
        + Nouvelle réservation
      </button>
    </header>
      <p
      v-if="messageSucces"
       :class="messageSucces.includes('annulée')
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700 border border-green-300'"
      class="rounded-lg p-3 text-sm"
      >
        {{ messageSucces }}
      </p>

    <div
      v-if="messageErreur"
      class="rounded-lg bg-red-100 p-3 text-red-700"
      role="alert"
    >
      {{ messageErreur }}
    </div>

    <div
      v-if="error"
      class="rounded-lg bg-red-100 p-4 text-red-700"
    >
      Impossible de charger les réservations.
      Vérifie que l'API est démarrée.
    </div>

    <div
      v-else-if="pending"
      class="py-10 text-center text-gris"
    >
      Chargement des réservations...
    </div>

    <div
      v-else-if="!reservations.length"
      class="rounded-xl border border-dashed p-10 text-center"
    >
      <h2 class="text-lg font-semibold">Aucune réservation</h2>
      <p class="mt-2 text-gris">
        Les réservations enregistrées apparaîtront ici.
      </p>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border">
      <table class="w-full min-w-[750px] text-left">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-4">Client</th>
            <th class="p-4">Téléphone</th>
            <th class="p-4">Date</th>
            <th class="p-4">Heure</th>
            <th class="p-4">Couverts</th>
            <th class="p-4">Table</th>
            <th class="p-4">Statut</th>
            <th class="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="reservation in reservations"
            :key="reservation.id"
            class="border-t"
          >
            <td class="p-4"> {{ reservation.nomClient || '—' }} </td>
            
            <td class="p-4"> {{ reservation.telephone || '' }} </td>

            <td class="p-4"> {{ formaterDate(reservation.date) }} </td>

            <td class="p-4"> {{ reservation.heure || '—' }} </td>

            <td class="p-4"> {{ reservation.nbPersonnes ?? '—' }} </td>

            <td class="p-4"> {{ tables.find(t => Number(t.id) === Number(reservation.tableId))?.numero ?? '—'}} </td>

            <td class="p-4">
              <span
                class="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm"
              >
                {{ libelleStatut(reservation.statut) }}
              </span>
            </td>

            <td class="p-4">
              <button
                v-if="reservation.statut !== 'annulee'"
                type="button"
                class="text-red-600 hover:underline disabled:opacity-50"
                :disabled="enCours"
                @click="annuler(reservation.id)"
              >
                Annuler
              </button>
              <span v-else class="text-sm text-gris">
                Annulée
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      type="button"
      class="rounded-lg border px-4 py-2 hover:bg-gray-50"
      @click="refresh()"
    >
      Actualiser la liste
    </button>
  </section>



<!--MODAL-->
<Teleport to="body">
  <div
    v-if="formulaireOuvert"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="fermerModal"
  >
    <div
      class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-modal"
    >
      <!-- En-tête -->
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h2 id="titre-modal" class="text-xl font-bold text-gray-900">
            Nouvelle réservation
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Enregistre une réservation pour un client.
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          @click="fermerModal"
        >
          ✕
        </button>
      </header>

      <!-- Formulaire -->
      <form
        class="space-y-5"
        @submit.prevent="enregistrerReservation"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Nom du client *
            </span>
            <input
              v-model="formulaire.nomClient"
              type="text"
              required
              placeholder="Nom complet"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Téléphone *
            </span>
            <input
              v-model="formulaire.telephone"
              type="tel"
              required
              placeholder="+243..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Nombre de personnes *
            </span>
            <input
              v-model.number="formulaire.nbPersonnes"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Date *
            </span>
            <input
              v-model="formulaire.date"
              type="date"
              :min="new Date().toLocaleDateString('en-CA')"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Heure *
            </span>
            <input
              v-model="formulaire.heure"
              type="time"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-medium text-gray-700">
              Table *
            </span>
            <select
              v-model="formulaire.tableId"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Choisir une table
              </option>

              <option
                v-for="table in tablesAdaptees"
                :key="table.id"
                :value="String(table.id)"
              >
                Table {{ table.numero }} — {{ table.capacite }} places
                ({{ table.zone }})
              </option>
            </select>
          </label>
        </div>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-gray-700">
            Note (facultatif)
          </span>
          <textarea
            v-model="formulaire.note"
            rows="3"
            placeholder="Ex : Anniversaire, déjeuner d'affaires..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <p
          v-if="erreurFormulaire"
          class="text-sm text-red-600"
          role="alert"
        >
          {{ erreurFormulaire }}
        </p>

        <footer class="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            @click="fermerModal"
          >
            Annuler
          </button>

          <button
            type="submit"
            :disabled="enregistrement || !tablesAdaptees.length"
            class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ enregistrement ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</Teleport>

</template>
