
<script setup>
const {
  recupererTables,
  recupererCommandes,
  recupererReservations
} = useTables()

// RÉCUPÉRATION DES DONNÉES
const { data: tables, pending, error } = await useAsyncData(
  'plan-salle-tables',
  recupererTables,
  { default: () => [] }
)

const { data: commandes, error: erreurCommandes } = await useAsyncData(
  'plan-salle-commandes',
  recupererCommandes,
  { default: () => [] }
)

const { data: reservations, error: erreurReservations } = await useAsyncData(
  'plan-salle-reservations',
  recupererReservations,
  { default: () => [] }
)

useHead({
  title: 'Plan de salle | SmartResto'
})

// CALCUL DE L'ÉTAT DES TABLES
function calculerEtatTable(table) {
  const commandesActives = (commandes.value || []).some(
    (commande) =>
      String(commande.tableId) === String(table.id) &&
      !['payee', 'annulee'].includes(commande.statut)
  )

  if (commandesActives) return 'occupée'

  const maintenant = new Date()
  const limite = new Date(
    maintenant.getTime() + 2 * 60 * 60 * 1000
  )

  const reservationActive = (reservations.value || []).some(
    (reservation) => {
      if (
        String(reservation.tableId) !== String(table.id) ||
        reservation.statut !== 'confirmee'
      ) {
        return false
      }

      const debutReservation = new Date(
        `${reservation.date}T${reservation.heure}`
      )
      const finReservation = new Date(
        debutReservation.getTime() + 120 * 60 * 1000
      )

      return (
        debutReservation < limite &&
        finReservation > maintenant
      )
    }
  )

  return reservationActive ? 'réservé' : 'libre'
}

// TABLES ACTIVES
const tablesActives = computed(() =>
  (tables.value || []).filter((table) => table.actif)
)

// FILTRE PAR ZONE
const zoneSelectionnee = ref('toutes')

const zones = computed(() => {
  const zonesUniques = tablesActives.value
    .map((table) => table.zone?.trim().toLowerCase())
    .filter(Boolean)

  return ['toutes', ...new Set(zonesUniques)]
})

const tablesFiltrees = computed(() => {
  if (zoneSelectionnee.value === 'toutes') {
    return tablesActives.value
  }

  return tablesActives.value.filter(
    (table) => table.zone === zoneSelectionnee.value
  )
})

// FORMATAGE DES ZONES
function formaterZone(zone) {
  if (!zone) return 'Sans zone'

  if (zone.toLowerCase() === 'vip') {
    return 'VIP'
  }

  return zone.charAt(0).toUpperCase() +
    zone.slice(1).toLowerCase()
}

// FORMATAGE DU NUMÉRO DE TABLE
function formaterNumeroTable(numero) {
  const valeur = String(numero)

  if (valeur.toUpperCase().startsWith('T')) {
    return `T${valeur.slice(1).padStart(2, '0')}`
  }

  return `T${valeur.padStart(2, '0')}`
}

// BORDURE SELON LA DISPONIBILITÉ
function classeBordureTable(table) {
  const etat = calculerEtatTable(table)

  return {
    'border-ok': etat === 'libre',
    'border-err': etat === 'occupée',
    'border-pri': etat === 'réservé'
  }
}


// RAFRAÎCHISSEMENT AUTOMATIQUE
let intervalle

onMounted(() => {
  intervalle = setInterval(async () => {
    await Promise.all([
      refreshNuxtData('plan-salle-commandes'),
      refreshNuxtData('plan-salle-reservations')
    ])
  }, 3000)
})

onBeforeUnmount(() => {
  clearInterval(intervalle)
})
</script>

<template>
  <main class="min-h-screen space-y-8">

    <!-- EN-TÊTE -->
    <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <p class="mb-2 text-sm font-medium text-pri">
          Gestion du restaurant
        </p>

        <h1 class="text-3xl font-bold tracking-tight text-head">
          Plan de salle
        </h1>

        <p class="mt-2 text-sm text-mut">
          Visualisez l'état de vos tables et suivez leur disponibilité.
        </p>
      </div>

      <NuxtLink
        to="/tables/gestion"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-degrade px-5 py-3 text-sm font-semibold text-on-pri shadow-lg shadow-pri/10 transition hover:opacity-90"
      >
        <span class="text-lg">+</span>
        Gérer les tables
      </NuxtLink>
    </header>


    <!-- PLAN DE SALLE -->
    <section class="rounded-carte border border-line bg-card p-5 sm:p-6">

      <!-- TITRE ET LÉGENDE -->
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-lg font-bold text-head">
            Disposition des tables
          </h2>

          <p class="mt-1 text-sm text-mut">
            {{ tablesFiltrees.length }} table(s) affichée(s)
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs text-mut">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-ok"></span>
            Libre
          </div>

          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-err"></span>
            Occupée
          </div>

          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-pri"></span>
            Réservée
          </div>
        </div>
      </div>

      <!-- FILTRES PAR ZONE -->
      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-for="zone in zones"
          :key="zone"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium transition"
          :class="
            zoneSelectionnee === zone
              ? 'border-pri bg-pri/10 text-pri'
              : 'border-line bg-soft text-mut hover:border-pri/40 hover:text-head'
          "
          @click="zoneSelectionnee = zone"
        >
          {{ zone === 'toutes' ? 'Toutes' : formaterZone(zone) }}
        </button>
      </div>

      <!-- CHARGEMENT -->
      <div
        v-if="pending"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-pri/20 border-t-pri"></div>

        <p class="mt-4 text-sm text-mut">
          Chargement du plan de salle...
        </p>
      </div>

      <!-- ERREURS -->
      <div
        v-else-if="error || erreurCommandes || erreurReservations"
        class="mt-6 rounded-xl border border-err/20 bg-err/10 p-5"
      >
        <p class="font-semibold text-err">
          Impossible de charger les données.
        </p>

        <p class="mt-1 text-sm text-mut">
          Vérifiez votre connexion au serveur et réessayez.
        </p>
      </div>

      <!-- CARTES DES TABLES -->
      <div
        v-else-if="tablesFiltrees.length"
        class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <article
          v-for="table in tablesFiltrees"
          :key="table.id"
          class="rounded-2xl border-2 bg-soft p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
          :class="classeBordureTable(table)"
        >

          <!-- ZONE -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-mut">
              {{ formaterZone(table.zone) }}
            </span>

            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="{
                'bg-ok': calculerEtatTable(table) === 'libre',
                'bg-err': calculerEtatTable(table) === 'occupée',
                'bg-pri': calculerEtatTable(table) === 'réservé'
              }"
            ></span>
          </div>

          <!-- NUMÉRO DE TABLE -->
          <div class="mt-5">
            <h3 class="text-3xl font-bold tracking-tight text-head">
              {{ formaterNumeroTable(table.numero) }}
            </h3>

            <p class="mt-2 text-sm text-mut">
              {{ table.capacite }}
              {{ table.capacite > 1 ? 'places' : 'place' }}
            </p>
          </div>

          <!-- SÉPARATEUR -->
          <div class="my-5 border-t border-line"></div>

          <!-- DISPONIBILITÉ -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-mut">
              Disponibilité
            </span>

            <span
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="{
                'bg-ok/10 text-ok': calculerEtatTable(table) === 'libre',
                'bg-err/10 text-err': calculerEtatTable(table) === 'occupée',
                'bg-pri/10 text-pri': calculerEtatTable(table) === 'réservé'
              }"
            >
              {{
                calculerEtatTable(table) === 'libre'
                  ? 'Libre'
                  : calculerEtatTable(table) === 'occupée'
                    ? 'Occupée'
                    : 'Réservée'
              }}
            </span>
          </div>

        </article>
      </div>

      <!-- AUCUNE TABLE -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-mut">
          <span class="text-2xl">⌑</span>
        </div>

        <h3 class="mt-4 font-semibold text-head">
          Aucune table trouvée
        </h3>

        <p class="mt-2 max-w-sm text-sm text-mut">
          Aucune table n'est disponible dans cette zone pour le moment.
        </p>

        <button
          v-if="zoneSelectionnee !== 'toutes'"
          type="button"
          class="mt-4 text-sm font-semibold text-pri hover:underline"
          @click="zoneSelectionnee = 'toutes'"
        >
          Voir toutes les zones
        </button>
      </div>

    </section>

  </main>
</template>
