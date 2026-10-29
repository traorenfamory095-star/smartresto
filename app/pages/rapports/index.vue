<script setup>
import { useRapports } from '@/composables/useRapports'
useHead({ title: 'Rapports des ventes - SmartResto' })

const {
  periode,
  dateDebut,
  dateFin,
  chargement,
  erreur,
  chargerDonnees,
  chiffreAffairesTotal,
  nombreCommandes,
  nombreCouvertsTotal,
  ticketMoyen,
  caParJour,
  topPlats,
  ventesParCategorie,
  topServeurs,
  ventesParPaiement,
  exporterCSV
} = useRapports()

onMounted(() => {
  chargerDonnees()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 bg-zinc-950 text-zinc-100 min-h-screen">
  
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <p class="text-xs text-zinc-400 uppercase tracking-wider mb-1">Administration / Rapports</p>
        <h1 class="text-3xl font-bold tracking-tight">Rapports</h1>
        <p class="text-sm text-zinc-400 mt-1">Comprenez la performance du restaurant.</p>
      </div>
      </div>
      </div>
</template>
