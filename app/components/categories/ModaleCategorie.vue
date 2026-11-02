<script setup>
const props = defineProps({
  ouvert: { type: Boolean, default: false },
  titre: { type: String, required: true },
})

const emit = defineEmits(['fermer'])
const idTitre = useId()
const dialogue = ref(null)
let elementPrecedent = null
let overflowPrecedent = ''

function fermer() {
  emit('fermer')
}

watch(
  () => props.ouvert,
  async (ouvert) => {
    if (!import.meta.client) return

    if (ouvert) {
      elementPrecedent = document.activeElement
      overflowPrecedent = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialogue.value?.focus()
    } else {
      document.body.style.overflow = overflowPrecedent
      elementPrecedent?.focus?.()
      elementPrecedent = null
    }
  },
)

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = overflowPrecedent
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="ouvert"
        class="modal-backdrop"
        @click.self="fermer"
        @keydown.esc="fermer"
      >
        <section
          ref="dialogue"
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="idTitre"
          tabindex="-1"
        >
          <header class="modal-header">
            <div>
              <p class="modal-eyebrow">SMARTRESTO</p>
              <h2 :id="idTitre">{{ titre }}</h2>
            </div>
            <button type="button" class="close-button" aria-label="Fermer" @click="fermer">
              <span aria-hidden="true">✕</span>
            </button>
          </header>
          <div class="modal-content">
            <slot />
          </div>
        </section>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 20px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  inset: 0;
}

.modal-panel {
  width: min(620px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 35px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 32px;
  outline: none;
  background: rgba(20, 20, 20, 0.96);
  color: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.modal-eyebrow {
  margin: 0 0 8px;
  color: #f97316;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.2px;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.close-button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 10px;
  background: #222;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 16px;
}

.close-button:hover {
  color: #fff;
}

.close-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.modal-content {
  margin-top: 24px;
}

@media (max-width: 600px) {
  .modal-panel {
    padding: 25px 20px;
    border-radius: 24px;
  }
}
</style>
