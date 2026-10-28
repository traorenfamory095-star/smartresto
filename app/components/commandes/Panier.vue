<script setup>
// Lignes du panier : quantité, remarque, retrait. Propriétaire : Traoré.
// Nom auto-importé par Nuxt : <CommandesPanier :lignes="lignes" @quantite="..." @retirer="..." @remarque="..." />
defineProps({
  lignes: { type: Array, required: true },
})
defineEmits(['quantite', 'retirer', 'remarque'])
</script>

<template>
  <p v-if="!lignes.length" class="py-6 text-center text-sm text-mut">
    Le panier est vide. Touchez un plat pour l'ajouter.
  </p>
  <ul v-else class="divide-y divide-line">
    <li v-for="l in lignes" :key="l.platId" class="py-4">
      <div class="flex items-start justify-between gap-3">
        <p class="font-semibold text-head">{{ l.nom }}</p>
        <p class="font-bold text-head">{{ formaterPrix(calculerTotal([l])) }}</p>
      </div>

      <div class="mt-2 flex items-center gap-2">
        <UiBouton variante="secondaire" taille="sm" :aria-label="`Retirer un ${l.nom}`" @click="$emit('quantite', l.platId, l.quantite - 1)">−</UiBouton>
        <span class="w-8 text-center font-semibold text-ink" aria-live="polite">{{ l.quantite }}</span>
        <UiBouton variante="secondaire" taille="sm" :aria-label="`Ajouter un ${l.nom}`" @click="$emit('quantite', l.platId, l.quantite + 1)">+</UiBouton>
        <span class="ml-1 text-xs text-mut">× {{ formaterPrix(l.prixUnitaire) }}</span>
        <UiBouton variante="discret" taille="sm" class="ml-auto" @click="$emit('retirer', l.platId)">Retirer</UiBouton>
      </div>

      <label class="mt-2 block">
        <span class="sr-only">Remarque pour {{ l.nom }}</span>
        <input
          type="text"
          maxlength="120"
          :value="l.remarque"
          placeholder="Remarque (ex. sans piment)"
          class="w-full rounded-xl border border-line bg-soft px-3 py-2 text-sm text-ink placeholder:text-mut focus-visible:outline-2 focus-visible:outline-cy"
          @input="$emit('remarque', l.platId, $event.target.value)"
        />
      </label>
    </li>
  </ul>
</template>