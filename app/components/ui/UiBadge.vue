<script setup>
// Pastille de couleur. Propriétaire : Traoré (socle).
//   <UiBadge ton="succes">Disponible</UiBadge>
// Tons : neutre, accent, succes, erreur, clair, sombre.
// Pour un statut (commande, facture...), préférez <UiBadgeStatut>.
const props = defineProps({
  ton: {
    type: String,
    default: 'neutre',
    validator: (v) => ['neutre', 'accent', 'succes', 'erreur', 'clair', 'sombre'].includes(v),
  },
})

const TONS = {
  neutre: 'bg-white/10 text-gris',
  accent: 'bg-accent/15 text-accent-clair',
  succes: 'bg-succes/15 text-succes',
  erreur: 'bg-erreur/15 text-erreur',
  clair: 'bg-clair text-fond',
  sombre: 'border border-bordure bg-white/5 text-gris',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
    :class="TONS[props.ton]"
  >
    <slot />
  </span>
</template>
