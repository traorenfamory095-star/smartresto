<script setup>
// PAGE PROVISOIRE. Propriétaire : Shammah (carte publique). Remplacez ce fichier.
// Quand le layout public est fusionné, remplacez `layout: false` par `layout: 'public'`.
definePageMeta({ layout: false })
useHead({ title: 'Carte' })
</script>

<template>
  <main class="px-4 py-10">
    <h1 class="text-3xl font-bold">Carte</h1>
    <p class="mt-2 text-gris">Page provisoire (Shammah) : la carte du restaurant s'affichera ici.</p>
    <NuxtLink to="/tableau-de-bord" class="mt-4 inline-block text-accent underline">Retour à l'administration</NuxtLink>
  </main>
</template>
