<script setup>
// Fenêtre modale accessible : Échap ou clic sur le fond pour fermer, focus rendu à la fermeture.
// Propriétaire : Traoré (socle).
//
//   <UiModal v-model="ouvert" titre="Nouveau plat">
//     ...contenu...
//     <template #actions>
//       <UiBouton variante="discret" @click="ouvert = false">Annuler</UiBouton>
//       <UiBouton @click="enregistrer">Enregistrer</UiBouton>
//     </template>
//   </UiModal>
//
// Pour une suppression, utilisez plutôt <UiConfirmer>.
defineProps({
  titre: { type: String, required: true },
})

const ouvert = defineModel({ type: Boolean, default: false })
const idTitre = useId()
const boite = ref(null)
let elementPrecedent = null

function fermer() {
  ouvert.value = false
}

watch(ouvert, async (valeur) => {
  if (!import.meta.client) return
  if (valeur) {
    elementPrecedent = document.activeElement
    document.body.style.overflow = 'hidden'
    await nextTick()
    boite.value?.focus()
  } else {
    document.body.style.overflow = ''
    elementPrecedent?.focus?.()
    elementPrecedent = null
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="ouvert" class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="fermer">
        <div class="absolute inset-0 bg-black/70" aria-hidden="true" @click="fermer" />

        <div
          ref="boite"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="idTitre"
          tabindex="-1"
          class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-carte border border-bordure bg-carte-solide p-6 text-texte shadow-2xl outline-none"
        >
          <div class="flex items-start justify-between gap-4">
            <h2 :id="idTitre" class="text-xl font-semibold">{{ titre }}</h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gris hover:text-texte"
              aria-label="Fermer la fenêtre"
              @click="fermer"
            >
              <UiIcone nom="fermer" />
            </button>
          </div>

          <div class="mt-4"><slot /></div>

          <div v-if="$slots.actions" class="mt-6 flex flex-wrap justify-end gap-3">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
