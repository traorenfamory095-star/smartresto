<script setup>
defineProps({
  categorie: { type: Object, required: true },
})
</script>

<template>
  <UiCarte as="article" class="h-full">
    <h2 class="text-lg font-semibold">{{ categorie.nom }}</h2>
    <p class="mt-2 text-sm leading-relaxed text-gris">{{ categorie.description }}</p>
  </UiCarte>
</template>
