<script setup>
useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: (titre) => (titre ? `${titre} · SmartResto` : 'SmartResto'),
}) 
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiNotification />
</template>
