<script setup>
// Carte « verre fumé » du prototype. Propriétaire : Traoré (socle).
//   <UiCarte>...</UiCarte>               carte standard
//   <UiCarte grand survol>...</UiCarte>  grande carte, qui se soulève au survol
//   <UiCarte as="li">...</UiCarte>       change la balise HTML
defineProps({
  as: { type: String, default: 'div' },
  grand: Boolean,
  survol: Boolean,
})
</script>

<template>
  <component
    :is="as"
    class="border border-bordure bg-carte backdrop-blur-md"
    :class="[
      grand ? 'rounded-carte-lg p-6 sm:p-8' : 'rounded-carte p-5',
      survol && 'transition hover:-translate-y-0.5 hover:border-accent/40',
    ]"
  >
    <slot />
  </component>
</template>
