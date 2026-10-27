<script setup>
// Demande de confirmation (suppression, annulation...). Propriétaire : Traoré (socle).
// Le composant ne ferme pas la fenêtre après « Confirmer » : fermez-la vous-même quand
// la requête a réussi, et gardez-la ouverte (avec une notification d'erreur) si elle échoue.
//
//   <UiConfirmer v-model="confirmation" titre="Supprimer ce plat ?"
//                message="Cette action est définitive."
//                libelle-confirmer="Supprimer" :chargement="suppression"
//                @confirmer="supprimerPlat" />
defineProps({
  titre: { type: String, required: true },
  message: { type: String, default: '' },
  libelleConfirmer: { type: String, default: 'Confirmer' },
  danger: { type: Boolean, default: true },
  chargement: Boolean,
})

defineEmits(['confirmer'])

const ouvert = defineModel({ type: Boolean, default: false })
</script>

<template>
  <UiModal v-model="ouvert" :titre="titre">
    <p v-if="message" class="text-gris">{{ message }}</p>
    <slot />

    <template #actions>
      <UiBouton variante="discret" :disabled="chargement" @click="ouvert = false">Annuler</UiBouton>
      <UiBouton :variante="danger ? 'danger' : 'primaire'" :chargement="chargement" @click="$emit('confirmer')">
        {{ libelleConfirmer }}
      </UiBouton>
    </template>
  </UiModal>
</template>
