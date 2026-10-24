<script setup>
// Bouton du prototype. Propriétaire : Traoré (socle).
//   <UiBouton @click="enregistrer">Enregistrer</UiBouton>
//   <UiBouton variante="secondaire" to="/plats">Retour</UiBouton>      (devient un lien)
//   <UiBouton :chargement="envoi">Valider</UiBouton>                    (désactivé pendant la requête :
//                                                                         évite le double clic)
// Variantes : primaire (dégradé orange), secondaire (contour orange), danger, discret.
const props = defineProps({
  variante: {
    type: String,
    default: 'primaire',
    validator: (v) => ['primaire', 'secondaire', 'danger', 'discret'].includes(v),
  },
  taille: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  type: { type: String, default: 'button' },
  chargement: Boolean,
  disabled: Boolean,
  to: { type: [String, Object], default: null },
})

const VARIANTES = {
  primaire: 'bg-degrade-orange text-fond hover:brightness-110',
  secondaire: 'border border-accent text-accent hover:bg-accent/10',
  danger: 'border border-erreur/60 text-erreur hover:bg-erreur/10',
  discret: 'text-gris hover:bg-white/5 hover:text-texte',
}
const TAILLES = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-clair',
  'disabled:cursor-not-allowed disabled:opacity-50',
  VARIANTES[props.variante],
  TAILLES[props.taille],
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes"><slot /></NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled || chargement"
    :aria-busy="chargement || undefined"
    :class="classes"
  >
    <span
      v-if="chargement"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
