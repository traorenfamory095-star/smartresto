<script setup>
defineProps({
  ticket: { type: Object, required: true },
  occupé: Boolean,
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
</script>

<template>
  <UiCarte grand as="article" class="space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-head">Commande #{{ ticket.id }}</h2>
        <p class="mt-1 text-sm text-mut">
          {{ ticket.table ? `Table ${ticket.table.numero}` : `Table #${ticket.tableId}` }}
          <span aria-hidden="true"> · </span>
          {{ formaterHeure(ticket.creeLe) }}
        </p>
      </div>
      <UiBadgeStatut type="commande" :statut="ticket.statut" />
    </header>

    <p
      v-if="ticket.note"
      class="rounded-xl border border-err/30 bg-err/10 p-4 text-sm font-medium text-err"
      role="note"
    >
      Consigne : {{ ticket.note }}
    </p>

    <div v-if="ticket.lignes.length" class="divide-y divide-line">
      <article v-for="ligne in ticket.lignes" :key="ligne.id" class="flex flex-wrap items-center gap-3 py-4">
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-head">
            {{ ligne.quantite }} × {{ ligne.plat?.nom ?? `Plat #${ligne.platId} introuvable` }}
          </h3>
          <p v-if="ligne.remarque" class="mt-1 text-sm text-acc">Remarque : {{ ligne.remarque }}</p>
        </div>

        <UiBadgeStatut type="ligneCuisine" :statut="ligne.statutCuisine" />

        <UiBouton
          v-if="statutLigneSuivant(ligne)"
          variante="secondaire"
          taille="sm"
          :disabled="occupé || ticket.statut !== 'en_preparation'"
          @click="emit('changer-ligne', ligne.id, statutLigneSuivant(ligne))"
        >
          {{ ligne.statutCuisine === 'en_attente' ? 'Commencer' : 'Marquer prête' }}
        </UiBouton>
      </article>
    </div>
    <p v-else class="rounded-xl bg-soft p-4 text-sm text-mut">Ce ticket ne contient aucune ligne.</p>

    <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <p class="text-sm text-mut" aria-live="polite">
        {{ ticket.lignesPretes }} / {{ ticket.lignes.length }} ligne(s) prête(s)
      </p>

      <UiBouton
        v-if="ticket.statut === 'en_attente'"
        :disabled="occupé || !ticket.lignes.length"
        @click="emit('changer-commande', ticket.id, 'en_preparation')"
      >
        Démarrer la préparation
      </UiBouton>
      <UiBouton
        v-else-if="peutTerminer(ticket)"
        :disabled="occupé"
        @click="emit('changer-commande', ticket.id, 'prete')"
      >
        Marquer la commande prête
      </UiBouton>
      <span v-else-if="ticket.statut === 'prete'" class="text-sm font-medium text-ok">
        En attente du service
      </span>
      <span v-else-if="!ticket.lignes.length" class="text-sm text-err">
        Impossible de démarrer un ticket sans ligne.
      </span>
      <span v-else class="text-sm text-mut">
        Marquez toutes les lignes prêtes pour terminer le ticket.
      </span>
    </footer>
  </UiCarte>
</template>