<script setup>
// Une carte d'indicateur du tableau de bord (chiffre clé + détail), cliquable. Propriétaire : Traoré.
// Nom auto-importé par Nuxt (dossier + fichier) :
//   <TableauIndicateur libelle="Commandes" valeur="48" detail="9 en cours" ton="neutre" lien="/commandes" icone="commandes" />
// Tons du détail : neutre (gris), ok (vert), err (rouge), acc (orange).
defineProps({
  libelle: { type: String, required: true },
  valeur: { type: String, required: true },
  detail: { type: String, default: '' },
  ton: {
    type: String,
    default: 'neutre',
    validator: (v) => ['neutre', 'ok', 'err', 'acc'].includes(v),
  },
  lien: { type: String, required: true },
  icone: { type: String, default: '' },
})

const TONS = { neutre: 'text-mut', ok: 'text-ok', err: 'text-err', acc: 'text-acc' }
</script>

<template>
  <NuxtLink
    :to="lien"
    class="block h-full rounded-carte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cy"
  >
    <UiCarte survol class="h-full">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-mut">{{ libelle }}</p>
        <UiIcone v-if="icone" :nom="icone" class="h-5 w-5 text-cy" />
      </div>
      <p class="mt-3 text-3xl font-extrabold tracking-tight text-head">{{ valeur }}</p>
      <p v-if="detail" class="mt-1 text-sm font-medium" :class="TONS[ton]">{{ detail }}</p>
    </UiCarte>
  </NuxtLink>
</template>