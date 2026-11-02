<script setup>


const { recupererTables, recupererReservations, creerReservation } = useTables()

definePageMeta({ layout: false })
useHead({ title: 'Réserver une table' })

// Recupération des tables pour le formulaire de réservation
const { data: tables, pending: chargementTables } = await useAsyncData('reservation-client-tables', recupererTables, { default: () => []})

// Recupération des réservations
const { data: reservations, refresh: actualiserReservations } = await useAsyncData('reservation-client-reservations', recupererReservations, { default: () => []})

const formulaire = reactive({
  nomClient: '',
  telephone: '',
  nbPersonnes: 2,
  date: '',
  heure: '',
  zone: '',
  note: '',
})

const zonesDisponibles = computed(() => {
  return [
    ...new Set(tables.value.filter(table => table.actif && table.zone).map(table => table.zone.trim().toLowerCase()))
  ]
})

// Conversion d'heure HH:MM en minutes pour comparaison depuis minuit
const convertirHeureEnMinutes = (heure) => {
  const [heures, minutes] = heure.split(':').map(Number)
  return heures * 60 + minutes
}

// Vérification de la disponibilité des tables pour la date et l'heure choisies
const verifierDisponibilite = (tableId, date, heure) => {
  const debutDemande = convertirHeureEnMinutes(heure)
  const finDemande = debutDemande + 120

  return !reservations.value.some(reservation => {
    if(['annulee', 'terminee'].includes(reservation.statut)){
      return false
    }

    if(
      Number(reservation.tableId) !== Number(tableId) || reservation.date !== date
    ){
      return false
    }

    const debutExistant = convertirHeureEnMinutes(reservation.heure)
    const finExistant = debutExistant + 120

    return (debutDemande < finExistant && finDemande > debutExistant)
  })
}

const tablesDisponibles = computed(() => {
  const { date, heure, zone, nbPersonnes } = formulaire

  if(!date || !heure || !zone || !nbPersonnes || nbPersonnes < 1){
    return []
  }
  return tables.value.filter(table => {
    return table.actif &&
      table.zone === zone &&
      Number(table.capacite) >= Number(nbPersonnes) &&
      verifierDisponibilite(table.id, date, heure)
  }).sort((a, b) => Number(a.capacite) - Number(b.capacite)) // Trier par capacité croissante
})

const enregistrement = ref(false)
const erreur = ref('')
const succes = ref('')


async function enregisterReservation() {
  erreur.value = ''
  succes.value = ''

  // 1. Vérifier les champs obligatoires
  if (
    !formulaire.nomClient.trim() ||
    !formulaire.telephone.trim() ||
    !formulaire.date ||
    !formulaire.heure ||
    !formulaire.zone ||
    !formulaire.nbPersonnes
  ) {
    erreur.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }

  if (
    !Number.isInteger(Number(formulaire.nbPersonnes)) ||
    formulaire.nbPersonnes < 1
  ) {
    erreur.value = 'Le nombre de personnes doit être supérieur à zéro.'
    return
  }

  // 2. Activer l'état de chargement
  enregistrement.value = true

  try {
    // 3. Actualiser les réservations avant de choisir une table
    await actualiserReservations()

    // 4. Choisir la table la mieux adaptée
    const tableChoisie = tablesDisponibles.value[0]

    if (!tableChoisie) {
      erreur.value =
        'Aucune table disponible pour ces critères. Essayez une autre zone ou un autre horaire.'
      return
    }

    // 5. Préparer les données
    const donneesReservation = {
      nomClient: formulaire.nomClient.trim(),
      telephone: formulaire.telephone.trim(),
      nbPersonnes: Number(formulaire.nbPersonnes),
      date: formulaire.date,
      heure: formulaire.heure,
      tableId: Number(tableChoisie.id),
      statut: 'confirmee',
      note: formulaire.note.trim()
    }

    // 6. Enregistrer dans l'API
    await creerReservation(donneesReservation)

    // 7. Actualiser les données
    await actualiserReservations()

    // 8. Afficher le succès
    succes.value = 'Votre réservation a été effectuée avec succès !'

    // 9. Réinitialiser le formulaire
    Object.assign(formulaire, {
      nomClient: '',
      telephone: '',
      nbPersonnes: 2,
      date: '',
      heure: '',
      zone: '',
      note: ''
    })

  } catch (e) {
    console.error(e)
    erreur.value = "Impossible d'enregistrer votre réservation."
  } finally {
    enregistrement.value = false
  }
}

</script>

<template>
  <main class="min-h-screen bg-bg px-5 py-10 text-ink sm:py-16">

    <div class="mx-auto max-w-5xl">

      <!-- EN-TÊTE -->
      <header class="mb-10 text-center">
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-pri/20 bg-pri/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-pri">
          <span class="h-2 w-2 rounded-full bg-pri"></span>
          Bienvenue chez SmartResto
        </div>

        <h1 class="text-3xl font-bold tracking-tight text-head sm:text-5xl">
          Réservez votre table
        </h1>

        <p class="mx-auto mt-4 max-w-xl text-sm leading-7 text-mut sm:text-base">
          Préparez votre prochaine expérience culinaire.
          Choisissez votre créneau et profitez d'un moment agréable chez nous.
        </p>
      </header>

      <!-- CONTENU PRINCIPAL -->
      <div class="grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr]">

        <!-- PANNEAU INFORMATIONS -->
        <aside class="space-y-5">

          <div class="relative overflow-hidden rounded-2xl bg-[#171717] p-7 text-white shadow-lg sm:p-8">
            <div class="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pri/20 blur-3xl"></div>

            <div class="relative">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                SmartResto
              </p>

              <h2 class="mt-5 text-2xl font-bold leading-tight sm:text-3xl">
                Une belle expérience commence par une réservation.
              </h2>

              <p class="mt-4 text-sm leading-7 text-white/65">
                Choisissez votre espace, indiquez le nombre de personnes
                et sélectionnez le moment qui vous convient.
              </p>

              <div class="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-pri/20 text-lg text-orange-400">
                  ✦
                </div>
                <div>
                  <p class="text-sm font-semibold">Réservation simplifiée</p>
                  <p class="mt-1 text-xs text-white/50">Quelques informations suffisent.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-line bg-card p-6">
            <h3 class="font-bold text-head">Comment ça marche ?</h3>

            <div class="mt-5 space-y-5">
              <div class="flex gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pri/10 text-sm font-bold text-pri">1</span>
                <div>
                  <p class="text-sm font-semibold text-head">Vos informations</p>
                  <p class="mt-1 text-xs leading-5 text-mut">Indiquez votre nom et vos coordonnées.</p>
                </div>
              </div>

              <div class="flex gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pri/10 text-sm font-bold text-pri">2</span>
                <div>
                  <p class="text-sm font-semibold text-head">Votre créneau</p>
                  <p class="mt-1 text-xs leading-5 text-mut">Choisissez la date, l'heure et votre espace.</p>
                </div>
              </div>

              <div class="flex gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pri/10 text-sm font-bold text-pri">3</span>
                <div>
                  <p class="text-sm font-semibold text-head">Confirmation</p>
                  <p class="mt-1 text-xs leading-5 text-mut">Nous sélectionnons une table adaptée à votre groupe.</p>
                </div>
              </div>
            </div>
          </div>

        </aside>

        <!-- FORMULAIRE -->
        <section class="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">

          <div class="border-b border-line px-6 py-6 sm:px-8">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-pri">
              Votre réservation
            </p>

            <h2 class="mt-2 text-xl font-bold text-head sm:text-2xl">
              Informations du client
            </h2>

            <p class="mt-2 text-sm text-mut">
              Les champs marqués d'un astérisque sont obligatoires.
            </p>
          </div>

          <form
            class="space-y-7 p-6 sm:p-8"
            @submit.prevent="enregisterReservation"
          >

            <!-- INFORMATIONS PERSONNELLES -->
            <div>
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-head">
                <span class="h-7 w-7 rounded-lg bg-pri/10 text-center leading-7 text-pri">01</span>
                Vos coordonnées
              </h3>

              <div class="grid gap-5 sm:grid-cols-2">

                <label class="space-y-2">
                  <span class="block text-sm font-medium text-head">
                    Nom complet *
                  </span>

                  <input
                    v-model="formulaire.nomClient"
                    type="text"
                    placeholder="Ex : Jean Dupont"
                    required
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-mut/60 focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                  />
                </label>

                <label class="space-y-2">
                  <span class="block text-sm font-medium text-head">
                    Téléphone *
                  </span>

                  <input
                    v-model="formulaire.telephone"
                    type="tel"
                    placeholder="+243..."
                    required
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-mut/60 focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                  />
                </label>

              </div>
            </div>

            <div class="h-px bg-line"></div>

            <!-- DÉTAILS DE LA RÉSERVATION -->
            <div>
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-head">
                <span class="h-7 w-7 rounded-lg bg-pri/10 text-center leading-7 text-pri">02</span>
                Détails de votre visite
              </h3>

              <div class="grid gap-5 sm:grid-cols-2">

                <label class="space-y-2">
                  <span class="block text-sm font-medium text-head">
                    Nombre de personnes *
                  </span>

                  <input
                    v-model.number="formulaire.nbPersonnes"
                    type="number"
                    min="1"
                    required
                    placeholder="Ex : 2"
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-mut/60 focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                  />
                </label>

                <label class="space-y-2">
                  <span class="block text-sm font-medium text-head">
                    Date *
                  </span>

                  <input
                    v-model="formulaire.date"
                    type="date"
                    required
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
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
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                  />
                </label>

                <label class="space-y-2">
                  <span class="block text-sm font-medium text-head">
                    Espace souhaité *
                  </span>

                  <select
                    v-model="formulaire.zone"
                    required
                    class="w-full rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                  >
                    <option value="" disabled>Choisir un espace</option>

                    <option
                      v-for="zone in zonesDisponibles"
                      :key="zone"
                      :value="zone"
                    >
                      {{ zone.charAt(0).toUpperCase() + zone.slice(1) }}
                    </option>
                  </select>
                </label>

              </div>
            </div>

            <div class="h-px bg-line"></div>

            <!-- NOTE -->
            <div>
              <label class="block space-y-2">
                <span class="text-sm font-bold text-head">
                  Informations complémentaires
                  <span class="font-normal text-mut">(facultatif)</span>
                </span>

                <textarea
                  v-model="formulaire.note"
                  rows="3"
                  placeholder="Ex : Anniversaire, déjeuner d'affaires..."
                  class="w-full resize-none rounded-xl border border-line bg-soft/60 px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-mut/60 focus:border-pri focus:bg-card focus:ring-4 focus:ring-pri/10"
                ></textarea>
              </label>
            </div>

            <!-- DISPONIBILITÉ -->
            <div
              v-if="chargementTables"
              class="flex items-center gap-3 rounded-xl border border-line bg-soft p-4 text-sm text-mut"
            >
              <span class="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-pri"></span>
              Chargement des disponibilités...
            </div>

            <template
              v-else-if="
                formulaire.date &&
                formulaire.heure &&
                formulaire.zone &&
                formulaire.nbPersonnes > 0
              "
            >
              <div
                v-if="tablesDisponibles.length > 0"
                class="flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">✓</span>
                <div>
                  <p class="text-sm font-semibold text-ok">
                    Bonne nouvelle !
                  </p>
                  <p class="mt-1 text-xs leading-5 text-mut">
                    Cet espace dispose d'une table adaptée à votre réservation.
                  </p>
                </div>
              </div>

              <div
                v-else
                class="flex items-start gap-3 rounded-xl border border-err/20 bg-err/5 p-4"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-err/10 text-err">!</span>
                <div>
                  <p class="text-sm font-semibold text-err">
                    Aucune table disponible
                  </p>
                  <p class="mt-1 text-xs leading-5 text-mut">
                    Essayez une autre zone ou un autre horaire.
                  </p>
                </div>
              </div>
            </template>

            <!-- ERREUR -->
            <div
              v-if="erreur"
              class="rounded-xl border border-err/20 bg-err/10 p-4 text-sm text-err"
              role="alert"
            >
              {{ erreur }}
            </div>

            <!-- SUCCÈS -->
            <div
              v-if="succes"
              class="rounded-xl border border-ok/20 bg-ok/10 p-4 text-sm font-medium text-ok"
              role="status"
            >
              ✓ {{ succes }}
            </div>

            <!-- BOUTON -->
            <button
              type="submit"
              :disabled="enregistrement || chargementTables"
              class="flex w-full items-center justify-center gap-3 rounded-xl bg-degrade px-6 py-4 text-sm font-bold  shadow-lg shadow-pri/15 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="enregistrement" class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>

              {{ enregistrement ? 'Enregistrement...' : 'Confirmer ma réservation' }}

              <span v-if="!enregistrement">→</span>
            </button>

            <p class="text-center text-xs leading-5 text-mut">
              Votre réservation sera enregistrée après confirmation.
            </p>

          </form>
        </section>

      </div>

      <!-- PIED DE PAGE -->
      <footer class="mt-10 border-t border-line pt-6 text-center">
        <p class="text-xs text-mut">
          © SmartResto — Merci de votre confiance.
        </p>
      </footer>

    </div>
  </main>
</template>
