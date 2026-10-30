
<script setup>
const {
  recupererReservations,
  annulerReservation,
  recupererTables,
  creerReservation
} = useTables()

useHead({ title: 'Réservations | SmartResto' })

const {
  data: reservations,
  pending,
  error,
  refresh
} = await useAsyncData(
  'liste-reservations',
  recupererReservations,
  { default: () => [] }
)

const enCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

const formulaireOuvert = ref(false)
const enregistrement = ref(false)
const erreurFormulaire = ref('')

const { data: tables } = await useAsyncData(
  'tables-pour-reservations',
  recupererTables,
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

// ----------------------------------
// FORMATAGE
// ----------------------------------

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

function classeStatut(statut) {
  const classes = {
    en_attente: 'bg-pri/10 text-pri border-pri/20',
    confirmee: 'bg-ok/10 text-ok border-ok/20',
    annulee: 'bg-err/10 text-err border-err/20',
    terminee: 'bg-soft text-mut border-line',
  }

  return classes[statut] || 'bg-soft text-mut border-line'
}

// ----------------------------------
// MESSAGES
// ----------------------------------

let minuterieMessage

function afficherMessageSucces(message) {
  messageSucces.value = message

  if (minuterieMessage) clearTimeout(minuterieMessage)

  minuterieMessage = setTimeout(() => {
    messageSucces.value = ''
  }, 3000)
}

// ----------------------------------
// ANNULATION
// ----------------------------------

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

// ----------------------------------
// DISPONIBILITÉ DES TABLES
// ----------------------------------

const tablesAdaptees = computed(() => {
  return tables.value.filter((table) => {
    const capaciteValide =
      table.actif &&
      Number(table.capacite) >= Number(formulaire.nbPersonnes)

    if (!capaciteValide) return false

    if (!formulaire.date || !formulaire.heure) {
      return true
    }

    return verifierDisponibilite(
      table.id,
      formulaire.date,
      formulaire.heure
    )
  })
})

function verifierDisponibilite(tableId, date, heure) {
  const maintenant = new Date()

  const debutNouvelle = new Date(`${date}T${heure}:00`)
  const finNouvelle = new Date(
    debutNouvelle.getTime() + 120 * 60 * 1000
  )

  if (debutNouvelle < maintenant) return false

  return !reservations.value.some((reservation) => {
    if (
      reservation.statut === 'annulee' ||
      reservation.statut === 'terminee'
    ) {
      return false
    }

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

    return (
      debutNouvelle < finExistante &&
      finNouvelle > debutExistante
    )
  })
}

// ----------------------------------
// FORMULAIRE
// ----------------------------------

function fermerModal() {
  formulaireOuvert.value = false
  erreurFormulaire.value = ''
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
    erreurFormulaire.value =
      'La capacité de cette table est insuffisante.'
    return
  }

  if (
    !verifierDisponibilite(
      formulaire.tableId,
      formulaire.date,
      formulaire.heure
    )
  ) {
    erreurFormulaire.value =
      'Cette table est déjà réservée sur ce créneau. Choisis une autre table ou une autre heure.'
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
  <section class="space-y-7 text-ink">

    <!-- EN-TÊTE -->
    <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pri">
          Gestion du restaurant
        </p>

        <h1 class="text-3xl font-bold tracking-tight text-head">
          Réservations
        </h1>

        <p class="mt-2 text-sm text-mut">
          Consulte et gère les réservations de ton restaurant.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 text-white rounded-xl bg-degrade px-5 py-3 text-sm font-semibold text-on-pri shadow-lg shadow-pri/10 transition hover:brightness-110 active:scale-[0.98]"
        @click="formulaireOuvert = true"
      >
        <span class="text-lg">+</span>
        Nouvelle réservation
      </button>
    </header>

    <!-- MESSAGES -->
    <Transition name="fade">
      <div
        v-if="messageSucces"
        class="flex items-center gap-3 rounded-xl border border-ok/20 bg-ok/10 p-4 text-sm text-ok"
      >
        <span>✓</span>
        {{ messageSucces }}
      </div>
    </Transition>

    <div
      v-if="messageErreur"
      class="rounded-xl border border-err/20 bg-err/10 p-4 text-sm text-err"
      role="alert"
    >
      {{ messageErreur }}
    </div>

    <!-- CONTENU -->
    <div class="overflow-hidden rounded-carte border border-line bg-card">

      <!-- BARRE DU TABLEAU -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
        <div>
          <h2 class="font-semibold text-head">
            Liste des réservations
          </h2>
          <p class="mt-1 text-xs text-mut">
            {{ reservations.length }} réservation(s) enregistrée(s)
          </p>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-line bg-soft px-4 py-2 text-sm text-ink transition hover:border-pri/50 hover:text-pri"
          @click="refresh()"
        >
          <span>↻</span>
          Actualiser
        </button>
      </div>

      <!-- ERREUR API -->
      <div
        v-if="error"
        class="m-5 rounded-xl border border-err/20 bg-err/10 p-5 text-sm text-err"
      >
        Impossible de charger les réservations.
        Vérifie que l'API est démarrée.
      </div>

      <!-- CHARGEMENT -->
      <div
        v-else-if="pending"
        class="flex flex-col items-center justify-center gap-3 py-16 text-mut"
      >
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-pri"></div>
        <p class="text-sm">Chargement des réservations...</p>
      </div>

      <!-- VIDE -->
      <div
        v-else-if="!reservations.length"
        class="flex flex-col items-center justify-center px-5 py-16 text-center"
      >
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-soft text-3xl text-pri">
          ♧
        </div>

        <h3 class="font-semibold text-head">
          Aucune réservation
        </h3>

        <p class="mt-2 max-w-sm text-sm text-mut">
          Les réservations enregistrées apparaîtront ici.
        </p>

        <button
          type="button"
          class="mt-5 rounded-xl bg-degrade px-5 py-2.5 text-sm font-semibold text-on-pri transition hover:brightness-110"
          @click="formulaireOuvert = true"
        >
          + Créer une réservation
        </button>
      </div>

      <!-- TABLEAU -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left">

          <thead class="bg-soft/70">
            <tr class="text-xs font-semibold uppercase tracking-wider text-mut">
              <th class="px-6 py-4">Client</th>
              <th class="px-5 py-4">Téléphone</th>
              <th class="px-5 py-4">Date</th>
              <th class="px-5 py-4">Heure</th>
              <th class="px-5 py-4">Couverts</th>
              <th class="px-5 py-4">Table</th>
              <th class="px-5 py-4">Statut</th>
              <th class="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="reservation in reservations"
              :key="reservation.id"
              class="border-t border-line transition hover:bg-soft/50"
            >
              <td class="px-6 py-5">
                <div class="font-medium text-head">
                  {{ reservation.nomClient || '—' }}
                </div>
                <p class="mt-1 text-xs text-mut">
                  Réservation #{{ reservation.id }}
                </p>
              </td>

              <td class="px-5 py-5 text-sm text-mut">
                {{ reservation.telephone || '—' }}
              </td>

              <td class="px-5 py-5 text-sm text-ink">
                {{ formaterDate(reservation.date) }}
              </td>

              <td class="px-5 py-5 text-sm font-medium text-head">
                {{ reservation.heure || '—' }}
              </td>

              <td class="px-5 py-5 text-sm text-ink">
                {{ reservation.nbPersonnes ?? '—' }}
                <span class="text-xs text-mut">pers.</span>
              </td>

              <td class="px-5 py-5 text-sm text-ink">
                <span class="rounded-lg bg-soft px-3 py-1.5">
                  {{
                    tables.find(t => Number(t.id) === Number(reservation.tableId))?.numero ?? '—'
                  }}
                </span>
              </td>

              <td class="px-5 py-5">
                <span
                  class="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                  :class="classeStatut(reservation.statut)"
                >
                  <span class="mr-2 h-1.5 w-1.5 rounded-full bg-current"></span>
                  {{ libelleStatut(reservation.statut) }}
                </span>
              </td>

              <td class="px-5 py-5">
                <button
                  v-if="reservation.statut !== 'annulee' && reservation.statut !== 'terminee'"
                  type="button"
                  class="rounded-lg px-3 py-2 text-xs font-semibold text-err transition hover:bg-err/10 disabled:opacity-40"
                  :disabled="enCours"
                  @click="annuler(reservation.id)"
                >
                  {{ enCours ? 'Patiente...' : 'Annuler' }}
                </button>

                <span
                  v-else-if="reservation.statut === 'annulee'"
                  class="text-xs text-mut"
                >
                  Annulée
                </span>

                <span
                  v-else
                  class="text-xs text-mut"
                >
                  Terminée
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PIED DU TABLEAU -->
      <div
        v-if="!pending && !error && reservations.length"
        class="border-t border-line px-6 py-4"
      >
        <p class="text-xs text-mut">
          Affichage de {{ reservations.length }} réservation(s)
        </p>
      </div>
    </div>
  </section>

  <!-- MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="formulaireOuvert"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        @click.self="fermerModal"
      >
        <div
          class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-carte-lg border border-line bg-card p-6 shadow-2xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-modal"
        >

          <!-- EN-TÊTE MODAL -->
          <header class="mb-7 flex items-start justify-between gap-4">
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-pri">
                Nouvelle réservation
              </p>

              <h2
                id="titre-modal"
                class="text-2xl font-bold text-head"
              >
                Ajouter un client
              </h2>

              <p class="mt-2 text-sm text-mut">
                Renseigne les informations de la réservation.
              </p>
            </div>

            <button
              type="button"
              class="rounded-xl border border-line bg-soft p-2 text-mut transition hover:text-err"
              aria-label="Fermer"
              @click="fermerModal"
            >
              ✕
            </button>
          </header>

          <!-- FORMULAIRE -->
          <form
            class="space-y-5"
            @submit.prevent="enregistrerReservation"
          >

            <div class="grid gap-5 sm:grid-cols-2">

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Nom du client *
                </span>

                <input
                  v-model="formulaire.nomClient"
                  type="text"
                  required
                  placeholder="Nom complet"
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/15"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Téléphone *
                </span>

                <input
                  v-model="formulaire.telephone"
                  type="tel"
                  required
                  placeholder="+243..."
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/15"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Nombre de personnes *
                </span>

                <input
                  v-model.number="formulaire.nbPersonnes"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition focus:border-pri focus:ring-2 focus:ring-pri/15"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Date *
                </span>

                <input
                  v-model="formulaire.date"
                  type="date"
                  :min="new Date().toLocaleDateString('en-CA')"
                  required
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition focus:border-pri focus:ring-2 focus:ring-pri/15"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Heure *
                </span>

                <input
                  v-model="formulaire.heure"
                  type="time"
                  required
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition focus:border-pri focus:ring-2 focus:ring-pri/15"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-sm font-medium text-head">
                  Table *
                </span>

                <select
                  v-model="formulaire.tableId"
                  required
                  class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition focus:border-pri focus:ring-2 focus:ring-pri/15"
                >
                  <option value="" disabled>
                    Choisir une table
                  </option>

                  <option
                    v-for="table in tablesAdaptees"
                    :key="table.id"
                    :value="String(table.id)"
                  >
                    Table {{ table.numero }} — {{ table.capacite }} places ({{ table.zone }})
                  </option>
                </select>
              </label>
            </div>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-head">
                Note (facultatif)
              </span>

              <textarea
                v-model="formulaire.note"
                rows="3"
                placeholder="Ex : Anniversaire, déjeuner d'affaires..."
                class="w-full resize-none rounded-xl border border-line bg-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mut/70 focus:border-pri focus:ring-2 focus:ring-pri/15"
              />
            </label>

            <div
              v-if="erreurFormulaire"
              class="rounded-xl border border-err/20 bg-err/10 p-4 text-sm text-err"
              role="alert"
            >
              {{ erreurFormulaire }}
            </div>

            <!-- ACTIONS -->
            <footer class="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                class="rounded-xl border border-line bg-soft px-5 py-3 text-sm font-medium text-ink transition hover:bg-line/30"
                @click="fermerModal"
              >
                Annuler
              </button>

              <button
                type="submit"
                :disabled="enregistrement || !tablesAdaptees.length"
                class="rounded-xl bg-degrade px-6 py-3 text-sm font-semibold text-on-pri shadow-lg shadow-pri/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{
                  enregistrement
                    ? 'Enregistrement...'
                    : 'Enregistrer la réservation'
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(12px) scale(0.98);
}
</style>
