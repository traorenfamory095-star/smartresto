<script setup>
const props = defineProps({
  ouvert: { type: Boolean, default: false },
  etape: { type: Number, default: 1 },
  envoi: { type: Boolean, default: false },
})

const emit = defineEmits(['fermer'])
const idTitre = useId()
const tiroir = ref(null)
let elementPrecedent = null
let overflowPrecedent = ''

function fermer() {
  if (!props.envoi) emit('fermer')
}

function piegerFocus(event) {
  if (event.key !== 'Tab' || !tiroir.value) return

  const elements = [...tiroir.value.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.offsetParent !== null)
  if (!elements.length) {
    event.preventDefault()
    tiroir.value.focus()
    return
  }

  const premier = elements[0]
  const dernier = elements[elements.length - 1]

  if (event.shiftKey && document.activeElement === premier) {
    event.preventDefault()
    dernier.focus()
  } else if (!event.shiftKey && document.activeElement === dernier) {
    event.preventDefault()
    premier.focus()
  }
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
      tiroir.value?.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled)')?.focus()
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
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="ouvert"
        class="drawer-backdrop"
        @click.self="fermer"
        @keydown.esc.prevent.stop="fermer"
        @keydown="piegerFocus"
      >
        <aside
          ref="tiroir"
          class="drawer-panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="idTitre"
          tabindex="-1"
        >
          <header class="drawer-header">
            <div>
              <p class="drawer-eyebrow">SMARTRESTO</p>
              <h2 :id="idTitre">
                {{ etape === 3 ? 'Commande confirmée' : etape === 2 ? 'Confirmation' : 'Ma commande' }}
              </h2>
            </div>
            <button
              type="button"
              class="close-button"
              aria-label="Fermer"
              :disabled="envoi"
              @click="fermer"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <ol v-if="etape < 3" class="step-indicator" aria-label="Étapes de commande">
            <li :class="{ active: etape === 1 }"><span>1</span> Ma commande</li>
            <li :class="{ active: etape === 2 }"><span>2</span> Confirmation</li>
          </ol>

          <div class="drawer-content">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  inset: 0;
}

.drawer-panel {
  display: flex;
  width: min(440px, 100%);
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  padding: 26px;
  border-left: 1px solid rgba(255, 255, 255, 0.13);
  outline: none;
  background: rgba(20, 20, 20, 0.95);
  color: #fff;
  box-shadow: -20px 0 70px rgba(0, 0, 0, 0.35);
}

.drawer-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.drawer-eyebrow {
  margin: 0 0 7px;
  color: #f97316;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.2px;
}

.drawer-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
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
  font-size: 15px;
}

.close-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.close-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.step-indicator {
  display: flex;
  flex: 0 0 auto;
  gap: 9px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.step-indicator li {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  background: #111;
  color: #7a7a7a;
  font-size: 12px;
}

.step-indicator li span {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 50%;
  background: #222;
  font-size: 11px;
}

.step-indicator li.active {
  border-color: rgba(249, 115, 22, 0.45);
  color: #ffa64d;
}

.step-indicator li.active span {
  background: #f97316;
  color: #fff;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  margin: 22px -6px 0;
  padding: 0 6px 12px;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

@media (max-width: 600px) {
  .drawer-panel {
    width: 100%;
    padding: 20px 18px;
  }
}
</style>
