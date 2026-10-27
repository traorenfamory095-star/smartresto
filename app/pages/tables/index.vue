<script setup>
// PAGE PROVISOIRE. Propriétaire : Théophile (module Tables). Remplacez ce fichier.

const { recupererTables, recupererCommandes, recupererReservations } = useTables()
const { data: tables, pending, error } = await useAsyncData('plan-salle-tables', recupererTables)
const { data: commandes, error: erreurCommandes } = await useAsyncData('plan-salle-commandes', recupererCommandes)
const { data: reservations, error: erreurReservations } = await useAsyncData('plan-salle-reservations', recupererReservations)

useHead({ title: 'Plan de salle | SmartResto' })

function calculerEtatTable(table){
    const commandesActives = (commandes.value || []).some(
      (commande) => String(commande.tabeId) === String(table.id) && 
      !['payee', 'annulee'].includes(commande.statut)
    )
    if(commandesActives) return 'occupée'

    const maintenant = new Date ()
    const limite = new Date(maintenant.getTime() + 2 * 60 * 60 * 1000)

    const reservationActive = (reservations.value || []).some(
      (reservation) => {
        if(
          String(reservation.tabeId) !== String(table.id) || 
          reservation.statut !== 'confirmée')
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
</script>

<template>
  <main>
    <header>
      <h1 class="text-3xl font-bold">Tables</h1>
      <p class="mt-2 text-gris">Consultez les tables et leur capacité.</p>     
    </header>

    <p v-if="pending">Chargement des tables...</p>
    <p v-else-if="error" class="text-red-600">Impossible de charger les tables : {{ error.message }}</p>
    
    <section  v-else-if="tables" class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article v-for="table in tables.filter(t => t.actif)" :key="table.id" class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold"> Table {{ table.numero }}</h2>
          <span class="rounded-full bg-gray-100 px-3 py-1 text-sm"> {{ table.zone }}</span>
        </div>
        <p class="text-sm text-gray-600">
          Capacité : {{ table.capacite }}
          {{ table.capacite > 1 ? 'personnes' : 'personne' }}
        </p>
        <p class="mt-3 text-sm font-semibold">
          État : {{ calculerEtatTable(table) }}
        </p>
      </article>
      <p v-if="!pending && !error && tables?.length === 0" class="mt-6 text-gray-500"> Aucune table enregistrée.</p>
    </section>
  </main>
</template>
