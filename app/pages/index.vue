<script setup>
// PROVISOIRE : la vraie page d'accueil publique arrive avec la PR « site public ». Propriétaire : Traoré.
definePageMeta({ layout: false })
useHead({ title: 'Accueil' })
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
    <h1 class="text-4xl font-bold text-accent">SmartResto</h1>
    <p class="text-gris">Le site du restaurant arrive bientôt.</p>
    <NuxtLink to="/tableau-de-bord" class="rounded-xl bg-degrade-orange px-5 py-3 font-medium text-fond">
      Accéder à l'administration
    </NuxtLink>
  </main>
</template>
