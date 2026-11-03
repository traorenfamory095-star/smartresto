<script setup>
useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: (titre) => (titre ? `${titre} · SmartResto` : 'SmartResto'),
}) 

const route = useRoute()
const layout = computed(() => choisirLayout(route.path))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiNotification />
</template>
