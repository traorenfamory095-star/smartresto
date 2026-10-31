<script setup>
import { computed, onMounted } from 'vue'
import { useRapports } from '@/composables/useRapports'

useHead({
  title: 'Rapports de ventes - SmartResto'
})

const {
  periode,
  dateDebut,
  dateFin,
  libellePeriode,
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

// Calcul sécurisé du maximum réel pour échelonner dynamiquement la hauteur des barres du graphique
const maxCaJour = computed(() => {
  if (!caParJour.value || caParJour.value.length === 0) return 1
  const valeurs = caParJour.value.map(j => Number(j.total) || 0)
  const max = Math.max(...valeurs)
  return max > 0 ? max : 1
})

// Génération dynamique du dégradé circulaire pour le graphique en anneau (Donut)
const conicGradientStyle = computed(() => {
  const total = chiffreAffairesTotal.value || 1
  const esp = Number(ventesParPaiement.value.especes || 0)
  const mob = Number(ventesParPaiement.value.mobile_money || 0)
  const cart = Number(ventesParPaiement.value.carte || 0)

  const pEsp = (esp / total) * 100
  const pMob = pEsp + (mob / total) * 100

  return `conic-gradient(
    #f97316 0% ${pEsp}%, 
    #f59e0b ${pEsp}% ${pMob}%, 
    #71717a ${pMob}% 100%
  )`
})

onMounted(() => {
  chargerDonnees()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 bg-zinc-950 text-zinc-100 min-h-screen">
    
    <!-- En-tête -->
    <div>
      <p class="text-xs text-zinc-400 uppercase tracking-wider mb-1">Administration / Rapports</p>
      <h1 class="text-3xl font-bold tracking-tight">Rapports</h1>
      <p class="text-sm text-zinc-400 mt-1">Comprenez la performance du restaurant.</p>
    </div>

    <!-- Barre supérieure : Périodes à gauche / Dates et Export à droite sur la même ligne -->
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 w-full">
      
      <!-- 1. Boutons de période (Gauche) -->
      <div class="bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800/80 flex items-center gap-1 shadow-inner shrink-0">
        <button 
          v-for="p in [
            { id: 'aujourdhui', label: 'Aujourd\'hui' },
            { id: '7jours', label: '7 jours' },
            { id: '30jours', label: '30 jours' },
            { id: 'personnalise', label: 'Personnalisée' }
          ]" 
          :key="p.id"
          @click="periode = p.id"
          :class="[
            'px-3.5 py-2 text-sm font-medium rounded-xl transition',
            periode === p.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-400 hover:text-white'
          ]"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- 2. Bloc des dates et bouton Exporter CSV (Droite) -->
      <div class="flex items-center gap-3 shrink-0">
        <!-- Sélecteur de dates -->
        <div v-if="periode === 'personnalise'" class="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-3 rounded-2xl text-sm shadow-inner">
          <input type="date" v-model="dateDebut" class="bg-transparent text-zinc-200 outline-none text-xs" />
          <span class="text-zinc-500">→</span>
          <input type="date" v-model="dateFin" class="bg-transparent text-zinc-200 outline-none text-xs" />
        </div>
        <div v-else class="bg-zinc-900/90 border border-zinc-800/80 px-4 py-3 rounded-2xl text-sm text-zinc-300 font-medium flex items-center gap-2 shadow-inner">
          <span>📅</span>
          <span>{{ libellePeriode }}</span>
        </div>

        <!-- Bouton Exporter CSV -->
        <button 
          @click="exporterCSV" 
          class="bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shrink-0"
        >
          <span>Exporter CSV</span>
        </button>
      </div>

    </div>

    <!-- Gestion des états -->
    <div v-if="chargement" class="text-center py-20 text-zinc-500">
      Chargement des rapports via l'API...
    </div>

    <div v-else-if="erreur" class="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl">
      {{ erreur }}
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div class="flex justify-between items-start">
            <span class="text-sm font-medium text-zinc-400">Chiffre d'affaires</span>
            <div class="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">📊</div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-extrabold tracking-tight">${{ chiffreAffairesTotal.toLocaleString() }}</p>
            <p class="text-xs text-emerald-500 font-medium mt-1">Basé sur la période sélectionnée</p>
          </div>
        </div>

        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div class="flex justify-between items-start">
            <span class="text-sm font-medium text-zinc-400">Ticket moyen</span>
            <div class="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">🏷️</div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-extrabold tracking-tight">${{ ticketMoyen.toFixed(2) }}</p>
            <p class="text-xs text-zinc-400 font-medium mt-1">Par commande</p>
          </div>
        </div>

        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div class="flex justify-between items-start">
            <span class="text-sm font-medium text-zinc-400">Commandes</span>
            <div class="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">📋</div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-extrabold tracking-tight">{{ nombreCommandes }}</p>
            <p class="text-xs text-zinc-400 font-medium mt-1">Total sur la période</p>
          </div>
        </div>

        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div class="flex justify-between items-start">
            <span class="text-sm font-medium text-zinc-400">Clients servis</span>
            <div class="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">👥</div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-extrabold tracking-tight">{{ nombreCouvertsTotal }}</p>
            <p class="text-xs text-zinc-400 font-medium mt-1">Couverts cumulés</p>
          </div>
        </div>
      </div>

      <!-- Graphique & Top 5 des plats -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between shadow-xl">
          <h2 class="text-lg font-semibold text-zinc-200 mb-6">Chiffre d'affaires par jour</h2>
          
          <div v-if="caParJour.length === 0" class="text-zinc-500 text-center py-20">
            Aucune vente sur cette période.
          </div>
          <div v-else class="h-64 w-full flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-zinc-800/80">
            <div v-for="item in caParJour" :key="item.date" class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div class="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                ${{ Number(item.total || 0).toFixed(0) }}
              </div>
              <div 
                class="w-full max-w-[42px] bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-lg transition-all duration-300 hover:brightness-110 shadow-lg shadow-orange-600/10"
                :style="{ height: `${Math.max(15, Math.min(100, (Number(item.total || 0) / maxCaJour) * 100))}%` }"
              ></div>
              <span class="text-xs text-zinc-400 mt-2 font-medium">{{ item.libelle }}</span>
            </div>
          </div>
        </div>

        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <h2 class="text-lg font-semibold text-zinc-200 mb-4">Top 5 des plats</h2>
          <div v-if="topPlats.length === 0" class="text-zinc-500 text-center py-12">
            Aucun plat vendu.
          </div>
          <div v-else class="space-y-4">
            <div v-for="(plat, index) in topPlats" :key="index" class="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-none">
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-zinc-500 w-5">0{{ index + 1 }}</span>
                <div>
                  <p class="text-sm font-medium text-zinc-200">{{ plat.nom }}</p>
                  <p class="text-xs text-zinc-400">{{ plat.quantite }} ventes</p>
                </div>
              </div>
              <span class="text-sm font-bold text-orange-500">${{ Number(plat.revenu || 0).toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sections Inférieures -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Ventes par catégorie -->
        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl shadow-xl">
          <h2 class="text-lg font-semibold text-zinc-200 mb-6">Ventes par catégorie</h2>
          <div class="space-y-5">
            <div v-for="cat in ventesParCategorie" :key="cat.nom" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-zinc-300 font-medium">{{ cat.nom }}</span>
                <span class="font-bold text-zinc-100">${{ Number(cat.total || 0).toLocaleString() }}</span>
              </div>
              <div class="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div class="bg-orange-500 h-full rounded-full transition-all duration-500" :style="{ width: `${cat.pourcentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ventes par serveur avec défilement vertical -->
        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl shadow-xl flex flex-col h-[380px]">
          <h2 class="text-lg font-semibold text-zinc-200 mb-4 shrink-0">Ventes par serveur</h2>
          <div class="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            <div v-for="(serv, index) in topServeurs" :key="index" class="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-none">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-500/20 shrink-0">
                  {{ serv.initiales }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-zinc-200 truncate">{{ serv.nom }}</p>
                  <p class="text-xs text-zinc-400">{{ serv.nbCommandes }} commandes</p>
                </div>
              </div>
              <span class="text-sm font-bold text-zinc-100 shrink-0 ml-2">${{ Number(serv.ca || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Répartition par mode de paiement (Anneau / Donut centré) -->
        <div class="bg-zinc-900/90 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between shadow-xl h-[380px]">
          <h2 class="text-lg font-semibold text-zinc-200 mb-2">Répartition par mode de paiement</h2>
          
          <div class="flex flex-col items-center justify-center gap-4 my-auto">
            <!-- Anneau graphique centré -->
            <div class="relative w-28 h-28 rounded-full flex items-center justify-center shrink-0 shadow-inner"
                 :style="{ background: conicGradientStyle }">
              <div class="absolute bg-zinc-900 rounded-full flex flex-col items-center justify-center text-center shadow-inner" style="width: 72px; height: 72px;">
                <span class="text-[9px] text-zinc-400 font-medium">Total</span>
                <span class="text-[11px] font-extrabold text-zinc-100 tracking-tight">${{ chiffreAffairesTotal.toLocaleString() }}</span>
              </div>
            </div>

            <!-- Légende claire en blocs espacés -->
            <div class="space-y-2 w-full">
              <div v-for="(montant, mode) in ventesParPaiement" :key="mode" class="flex items-center justify-between text-xs bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-800/50">
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    mode === 'especes' ? 'bg-orange-500' : mode === 'mobile_money' ? 'bg-amber-500' : 'bg-zinc-500'
                  ]"></div>
                  <span class="text-zinc-200 font-medium capitalize">{{ mode.replace('_', ' ') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-zinc-100">${{ Number(montant || 0).toLocaleString() }}</span>
                  <span class="text-zinc-400 font-semibold w-7 text-right">
                    {{ Math.round((montant / (chiffreAffairesTotal || 1)) * 100) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-400 shrink-0">
            <span>Total encaissé</span>
            <span class="text-sm font-bold text-orange-500">${{ chiffreAffairesTotal.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>