<script setup>
// PAGE PROVISOIRE. Propriétaire : Gaël (connexion). Remplacez ce fichier.
// Le prototype prévoit deux onglets : « Espace client » (visuel seulement, pas de ressource clients)
// et « Espace administration » (la vraie connexion, via useAuth().seConnecter).
definePageMeta({ layout: false })
useHead({ title: 'Connexion' })
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 class="text-3xl font-bold">Connexion</h1>
    <p class="text-gris">Page provisoire (Gaël) : le formulaire de connexion s'affichera ici.</p>
    <NuxtLink to="/tableau-de-bord" class="text-accent underline">Aller au tableau de bord</NuxtLink>
  </main>
</template>
