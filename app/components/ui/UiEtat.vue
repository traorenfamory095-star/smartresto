<script setup>
// Les trois états que la correction vérifie partout : chargement, erreur, liste vide.
// Propriétaire : Traoré (socle). Le contenu normal va dans le slot, il ne s'affiche
// que si aucun des trois états ne s'applique.
//
//   const { data: plats, pending, error, refresh } = await useAsyncData('plats', () => lire('/plats'))
//
//   <UiEtat :chargement="pending" :erreur="error" :vide="!plats?.length"
//           message-vide="Aucun plat pour le moment." @reessayer="refresh">
//     <PlatCarte v-for="p in plats" :key="p.id" :plat="p" />
//   </UiEtat>
const props = defineProps({
  chargement: Boolean,
  erreur: { type: [String, Object, Boolean], default: null },
  vide: Boolean,
  messageVide: { type: String, default: 'Aucun élément à afficher.' },
})

defineEmits(['reessayer'])

const messageErreur = computed(() => {
  if (typeof props.erreur === 'string') return props.erreur
  return props.erreur?.message ?? 'Une erreur est survenue.'
})
</script>

<template>
  <div v-if="chargement" role="status" class="flex items-center justify-center gap-3 py-12 text-gris">
    <span
      class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent"
      aria-hidden="true"
    />
    Chargement…
  </div>

  <div v-else-if="erreur" role="alert" class="rounded-carte border border-erreur/40 bg-erreur/10 p-6 text-center">
    <p>{{ messageErreur }}</p>
    <UiBouton variante="secondaire" class="mt-4" @click="$emit('reessayer')">Réessayer</UiBouton>
  </div>

  <p v-else-if="vide" class="py-12 text-center text-gris">{{ messageVide }}</p>

  <slot v-else />
</template>
