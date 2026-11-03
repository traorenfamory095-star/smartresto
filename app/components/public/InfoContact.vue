<script setup>
// Une ligne de coordonnées (icône, libellé, valeur), avec un lien facultatif. Propriétaire : Traoré (site public).
// Nom auto-importé par Nuxt :
//   <PublicInfoContact icone="telephone" libelle="Téléphone" valeur="+243 995 221 410" lien="tel:+243995221410" />
defineProps({
  icone: { type: String, required: true },
  libelle: { type: String, required: true },
  valeur: { type: String, required: true },
  lien: { type: String, default: '' },
})
</script>

<template>
  <UiCarte as="article" class="flex items-center gap-4">
    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-soft text-cy">
      <UiIcone :nom="icone" class="h-5 w-5" />
    </span>
    <div class="min-w-0">
      <p class="text-xs font-semibold uppercase tracking-wider text-mut">{{ libelle }}</p>
      <a v-if="lien" :href="lien" class="break-words font-semibold text-head underline-offset-4 hover:underline">
        {{ valeur }}
      </a>
      <p v-else class="font-semibold text-head">{{ valeur }}</p>
    </div>
  </UiCarte>
</template>