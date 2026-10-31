<script setup>
// Un plat du catalogue, cliquable pour l'ajouter au panier. Propriétaire : Traoré.
// Nom auto-importé par Nuxt : <CommandesPlatChoix :plat="plat" :quantite="2" @ajouter="..." />
defineProps({
  plat: { type: Object, required: true },
  quantite: { type: Number, default: 0 }, // déjà dans le panier
})
defineEmits(['ajouter'])
</script>

<template>
  <li>
    <button
      type="button"
      class="flex h-full w-full flex-col justify-between rounded-carte border border-line bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-cy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cy"
      :aria-label="`Ajouter ${plat.nom} au panier, ${formaterPrix(plat.prix)}`"
      @click="$emit('ajouter', plat)"
    >
      <span>
        <span class="block font-semibold text-head">{{ plat.nom }}</span>
        <span v-if="plat.description" class="mt-1 block text-sm text-mut">{{ plat.description }}</span>
      </span>
      <span class="mt-3 flex items-center justify-between">
        <span class="font-bold text-acc">{{ formaterPrix(plat.prix) }}</span>
        <span v-if="quantite" class="rounded-full bg-acc/15 px-2.5 py-1 text-xs font-medium text-acc">
          {{ quantite }} au panier
        </span>
        <span v-else class="text-sm text-mut" aria-hidden="true">+ Ajouter</span>
      </span>
    </button>
  </li>
</template>