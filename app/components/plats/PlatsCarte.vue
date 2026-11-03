<script setup>
import { formaterPrix } from '~/utils/format'

defineProps({
  plat: { type: Object, required: true },
  categorie: { type: String, default: '' },
  occupe: { type: Boolean, default: false }
})
defineEmits(['basculer', 'supprimer'])
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.13] bg-[#141414]/80 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-orange-500/40">
    <div class="relative m-2.5 h-[170px] overflow-hidden rounded-[18px] bg-[#1b1b1b]">
      <img v-if="plat.imageUrl" :src="plat.imageUrl" :alt="plat.nom" class="h-full w-full object-cover" :class="plat.disponible ? '' : 'opacity-50 grayscale'" loading="lazy" />
      <div v-else class="grid h-full w-full place-items-center text-neutral-700" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15h16M6 15a6 6 0 0 1 12 0M12 7V5M3 19h18" />
        </svg>
      </div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% to-black/75" />
      <span class="absolute bottom-3 left-3.5 z-10 text-[10px] font-bold uppercase tracking-wider text-orange-500">{{ categorie }}</span>
    </div>

    <div class="flex flex-1 flex-col px-5 pb-5 pt-2">
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-sm font-semibold text-white">{{ plat.nom }}</h2>
        <strong class="whitespace-nowrap text-[13px] text-orange-500">{{ formaterPrix(plat.prix) }}</strong>
      </div>
      <p class="mt-2 min-h-[43px] text-[11px] leading-relaxed text-neutral-500">{{ plat.description || 'Aucune description.' }}</p>
      <p class="text-[11px] text-neutral-500">Préparation : {{ plat.tempsPreparationMin }} min</p>

      <div class="mt-auto flex items-center justify-between border-t border-white/[0.13] pt-4">
        <span class="text-[11px]" :class="plat.disponible ? 'text-green-500' : 'text-neutral-400'">
          {{ plat.disponible ? 'Disponible' : 'Indisponible' }}
        </span>
        <label class="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            role="switch"
            class="peer sr-only"
            :checked="plat.disponible"
            :disabled="occupe"
            :aria-label="`${plat.nom} : disponibilité`"
            @change="$emit('basculer', plat)"
          />
          <span class="relative h-[19px] w-[34px] rounded-full bg-[#333] transition after:absolute after:left-[3px] after:top-[3px] after:h-[13px] after:w-[13px] after:rounded-full after:bg-neutral-500 after:transition-all peer-checked:bg-green-500/25 peer-checked:after:left-[18px] peer-checked:after:bg-green-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400 peer-disabled:opacity-50" />
        </label>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <NuxtLink :to="`/plats/${plat.id}`" class="rounded-md text-xs font-semibold text-orange-500 transition hover:text-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          Modifier
        </NuxtLink>
        <button type="button" class="rounded-md text-xs font-semibold text-red-400 transition hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400" @click="$emit('supprimer', plat)">
          Supprimer
        </button>
      </div>
    </div>
  </article>
</template>