<script setup>
// Carte d'un plat pour les pages publiques. Propriétaire : Traoré (site public).
// Nom auto-importé : <PublicPlatCarte :plat="plat" />
// Sans photo (imageUrl vide), une assiette dessinée la remplace.
defineProps({
  plat: { type: Object, required: true },
})
</script>

<template>
  <UiCarte as="article" survol class="flex h-full flex-col">
    <div class="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-section">
      <img v-if="plat.imageUrl" :src="plat.imageUrl" :alt="plat.nom" class="h-full w-full object-cover" />
      <UiIcone v-else nom="plats" class="h-12 w-12 text-accent/60" />
    </div>

    <h3 class="mt-4 text-lg font-semibold">{{ plat.nom }}</h3>
    <p class="mt-1 flex-1 text-sm text-gris">{{ plat.description }}</p>

    <div class="mt-4 flex items-center justify-between">
      <p class="text-lg font-bold text-accent">{{ formaterPrix(plat.prix) }}</p>
      <p v-if="plat.tempsPreparationMin" class="text-xs text-gris">{{ plat.tempsPreparationMin }} min</p>
    </div>
  </UiCarte>
</template>
