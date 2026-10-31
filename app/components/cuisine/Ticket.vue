<script setup>
defineProps({
  ticket: { type: Object, required: true },
  occupé: Boolean,
  maintenant: { type: Number, required: true },
})

const emit = defineEmits(['changer-ligne', 'changer-commande'])

function statutLigneSuivant(ligne) {
  if (ligne.statutCuisine === 'en_attente') return 'en_preparation'
  if (ligne.statutCuisine === 'en_preparation') return 'prete'
  return null
}

function peutTerminer(ticket) {
  return ticket.statut === 'en_preparation' && toutesLignesCuisinePretes(ticket.lignes)
}

function tempsEcoule(date, maintenant) {
  if (!maintenant) return '—'

  const instant = Date.parse(date)
  if (!Number.isFinite(instant)) return '—'

  const secondes = Math.max(0, Math.floor((maintenant - instant) / 1000))
  const minutes = Math.floor(secondes / 60)
  if (minutes < 60) return `${String(minutes).padStart(2, '0')}:${String(secondes % 60).padStart(2, '0')}`

  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `${heures} h ${String(minutes % 60).padStart(2, '0')}`
  return `${Math.floor(heures / 24)} j ${heures % 24} h`
}

function numeroTable(ticket) {
  const numero = ticket.table?.numero ?? ticket.tableId
  return `T${String(numero ?? '?').padStart(2, '0')}`
}
</script>

<template>
  <article class="space-y-5 rounded-3xl border border-[#292929] bg-[#141414] p-5 shadow-lg shadow-black/20">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span class="inline-flex rounded-lg bg-[#f97316]/10 px-3 py-1 text-sm font-bold text-[#f97316]">
          {{ numeroTable(ticket) }}
        </span>
        <p class="mt-2 text-sm text-[#a3a3a3]">
          #{{ ticket.id }} <span aria-hidden="true">·</span> {{ formaterHeure(ticket.creeLe) }}
        </p>
      </div>
      <strong v-if="ticket.statut !== 'prete'" class="text-lg tabular-nums text-[#f97316]">
        {{ tempsEcoule(ticket.creeLe, maintenant) }}
      </strong>
      <span v-else class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
        Prête
      </span>
    </header>

    <p
      v-if="ticket.note"
      class="border-l-4 border-[#f97316] bg-[#f97316]/5 px-3 py-2 text-sm font-medium text-[#f97316]"
      role="note"
    >
      {{ ticket.note }}
    </p>

    <ul v-if="ticket.lignes.length" class="space-y-3">
      <li
        v-for="ligne in ticket.lignes"
        :key="ligne.id"
        class="flex flex-wrap items-center justify-between gap-3 border-b border-[#292929] pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0 flex-1">
          <h3 class="font-medium text-white">
            {{ ligne.quantite }} × {{ ligne.plat?.nom ?? `Plat #${ligne.platId} introuvable` }}
          </h3>
          <p class="mt-1 text-xs text-[#737373]">
            {{ ligne.statutCuisine === 'prete' ? 'Prête' : ligne.statutCuisine === 'en_preparation' ? 'En cours' : 'À préparer' }}
          </p>
        </div>

        <button
          v-if="statutLigneSuivant(ligne) && ticket.statut === 'en_preparation'"
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold text-[#f97316] transition hover:bg-[#f97316]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="occupé"
          @click="emit('changer-ligne', ligne.id, statutLigneSuivant(ligne))"
        >
          {{ ligne.statutCuisine === 'en_attente' ? 'Commencer' : 'Prête' }}
        </button>
      </li>
    </ul>
    <p v-else class="rounded-xl bg-white/5 p-4 text-sm text-[#a3a3a3]">Ce ticket ne contient aucune ligne.</p>

    <footer class="border-t border-[#292929] pt-4">
      <UiBouton
        v-if="ticket.statut === 'en_attente'"
        class="cuisine-ticket__action w-full"
        :disabled="occupé || !ticket.lignes.length"
        @click="emit('changer-commande', ticket.id, 'en_preparation')"
      >
        Démarrer
      </UiBouton>
      <UiBouton
        v-else-if="peutTerminer(ticket)"
        class="cuisine-ticket__action w-full"
        :disabled="occupé"
        @click="emit('changer-commande', ticket.id, 'prete')"
      >
        Marquer prête
      </UiBouton>
      <span v-else-if="ticket.statut === 'prete'" class="text-sm font-medium text-emerald-400">
        En attente du service
      </span>
      <span v-else-if="!ticket.lignes.length" class="text-sm text-err">
        Impossible de démarrer un ticket sans ligne.
      </span>
      <span v-else class="text-sm text-[#a3a3a3]" aria-live="polite">
        {{ ticket.lignesPretes }} / {{ ticket.lignes.length }} lignes prêtes
      </span>
    </footer>
  </article>
</template>

<style scoped>
.cuisine-ticket__action {
  background-image: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
}

.cuisine-ticket__action:hover:not(:disabled) {
  filter: brightness(1.08);
}
</style>