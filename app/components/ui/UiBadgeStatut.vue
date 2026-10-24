<script setup>
// Badge d'un statut, avec le libellé et la couleur du prototype. Propriétaire : Traoré (socle).
//   <UiBadgeStatut type="commande" :statut="commande.statut" />
// Types : commande, ligneCuisine, facture, approvisionnement, reservation (voir utils/statuts.js).
const props = defineProps({
  type: { type: String, required: true },
  statut: { type: String, default: '' },
})

const info = computed(() => infoStatut(props.type, props.statut))
</script>

<template>
  <UiBadge :ton="info.ton">{{ info.libelle }}</UiBadge>
</template>
