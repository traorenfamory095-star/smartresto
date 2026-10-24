<script setup>
// PAGE PROVISOIRE. Propriétaire : Théophile (formulaire de réservation côté client,
// qui écrit dans la ressource `reservations`). Remplacez ce fichier.
definePageMeta({ layout: false })
useHead({ title: 'Réserver une table' })
</script>

<template>
  <main class="px-4 py-10">
    <h1 class="text-3xl font-bold">Réserver une table</h1>
    <p class="mt-2 text-gris">Page provisoire (Théophile) : le formulaire de réservation s'affichera ici.</p>
    <NuxtLink to="/tableau-de-bord" class="mt-4 inline-block text-accent underline">Retour à l'administration</NuxtLink>
  </main>
</template>
