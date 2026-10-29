<script setup>
// PAGE PROVISOIRE. Propriétaire : Théophile (module Tables). Remplacez ce fichier.

const { recupererTables, recupererCommandes, recupererReservations } = useTables()
const { data: tables, pending, error } = await useAsyncData('plan-salle-tables', recupererTables)
const { data: commandes, error: erreurCommandes } = await useAsyncData('plan-salle-commandes', recupererCommandes)
const { data: reservations, error: erreurReservations } = await useAsyncData('plan-salle-reservations', recupererReservations)

useHead({ title: 'Plan de salle | SmartResto' })

// CALCUL TABLE OCCUPEE
function calculerEtatTable(table){
    const commandesActives = (commandes.value || []).some(
      (commande) => String(commande.tableId) === String(table.id) && 
      !['payee', 'annulee'].includes(commande.statut)
    )
    if(commandesActives) return 'occupée'

    const maintenant = new Date ()
    const limite = new Date(maintenant.getTime() + 2 * 60 * 60 * 1000)

    const reservationActive = (reservations.value || []).some(
      (reservation) => {
        if(
          String(reservation.tableId) !== String(table.id) || 
          reservation.statut !== 'confirmee')
          {
            return false
          }
          const dateReservation = new Date (
            `${reservation.date}T${reservation.heure}`
          )
          return dateReservation >= maintenant && dateReservation <= limite
      }

    )
    return reservationActive ? 'réservé' : 'libre'
}
  const tablesActives = computed(() => 
  (tables.value || []).filter((table) => table.actif))

  // FILTRE PAR ZONE
  const zoneSelectionnee = ref('toutes')
  const zones = computed(() => [
    'toutes', ...new Set(tablesActives.value.map((table) => table.zone))
  ])

  const tablesFiltrees = computed(() => {
    if(zoneSelectionnee.value === 'toutes'){
      return tablesActives.value
    }
    return tablesActives.value.filter(
      (table) => table.zone === zoneSelectionnee.value
    )
  })

  // RAFRAICHISSEMENT PERIODIQUE

  let intervalle
  onMounted(() => {
    intervalle = setInterval(async () => {
      await Promise.all([
        refreshNuxtData('plan-salle-commandes'),
        refreshNuxtData('plan-salle-reservations')
      ])
    }, 3000)
  })

  onBeforeMount(() => {
    clearInterval(intervalle)
  })

</script>

<template>
  <main>
    <header>
      <h1 class="text-3xl font-bold">Tables</h1>
      <p class="mt-2 text-gris">Consultez les tables et leur capacité.</p>     
    </header>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
      v-for="zone in zones"
      :key="zone"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-medium"
      :class="zoneSelectionnee === zone ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'"
      @click="zoneSelectionnee = zone"
      >
        {{ zone === 'toutes' ? 'Toutes les zones' : zone }}
      </button>
    </div>
    <p v-if="pending">Chargement des tables...</p>
    <p v-else-if="error" class="text-red-600">Impossible de charger les tables : {{ error.message }}</p>
    
    <section  v-else-if="tables" class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article v-for="table in tablesFiltrees" :key="table.id" class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold"> Table {{ table.numero }}</h2>
          <span class="rounded-full bg-gray-100 px-3 py-1 text-sm"> {{ table.zone }}</span>
        </div>
        <p class="text-sm text-gray-600">
          Capacité : {{ table.capacite }}
          {{ table.capacite > 1 ? 'personnes' : 'personne' }}
        </p>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-sm text-gris">État</span>
          <span
            class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
            :class="{
              'bg-green-100 text-green-700': calculerEtatTable(table) === 'libre',
              'bg-red-100 text-red-700': calculerEtatTable(table) === 'occupée',
              'bg-blue-100 text-blue-700': calculerEtatTable(table) === 'réservé',
            }"
          >
            {{ calculerEtatTable(table) }}
          </span>
        </div>
      </article>
      <p v-if="!pending && !error && tablesFiltrees.length === 0" class="mt-6 text-gray-500"> Aucune table enregistrée.</p>
    </section>

    <NuxtLink
      to="/tables/gestion"
      class="inline-flex rounded-lg bg-accent mt-4 border px-4 py-2 font-medium text-white"
    >
      Gérer les tables
    </NuxtLink>
  </main>
</template>
