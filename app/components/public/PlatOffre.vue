<script setup>
// Carte d'un plat mis en avant, avec bouton « Commander ». Propriétaire : Traoré (site public).
// Nom auto-importé par Nuxt : <PublicPlatOffre :plat="plat" categorie="Poissons" @commander="..." />
// Sans photo (imageUrl vide), une assiette dessinée la remplace.
defineProps({
  plat: { type: Object, required: true },
  categorie: { type: String, default: '' },
})
defineEmits(['commander'])
</script>

<template>
  <UiCarte as="article" survol class="flex h-full flex-col overflow-hidden !p-0">
    <div class="flex h-44 items-center justify-center bg-soft">
      <img v-if="plat.imageUrl" :src="plat.imageUrl" :alt="plat.nom" class="h-full w-full object-cover" loading="lazy" />
      <UiIcone v-else nom="plats" class="h-14 w-14 text-cy" />
    </div>

    <div class="flex flex-1 flex-col p-5">
      <p v-if="categorie" class="text-xs font-bold uppercase tracking-widest text-acc">{{ categorie }}</p>
      <h3 class="mt-2 text-xl font-bold text-head">{{ plat.nom }}</h3>
      <p class="mt-2 flex-1 text-sm leading-6 text-mut">{{ plat.description }}</p>

      <div class="mt-5 flex items-center justify-between gap-3">
        <p class="text-xl font-extrabold text-head">{{ formaterPrix(plat.prix) }}</p>
        <UiBouton taille="sm" :aria-label="`Commander ${plat.nom}`" @click="$emit('commander', plat)">
          Commander
        </UiBouton>
      </div>
    </div>
  </UiCarte>
</template>