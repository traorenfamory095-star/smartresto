<script setup>
const props = defineProps({
  plat: { type: Object, required: true },
  categorie: { type: Object, required: true },
  afficherAjout: { type: Boolean, default: false },
  ajoutFeedback: { type: Object, default: null },
})

const emit = defineEmits(['add', 'image-error'])
const ajoutConfirme = ref(false)
let minuteurConfirmation

watch(
  () => props.ajoutFeedback?.numero,
  (numero) => {
    if (
      numero === undefined
      || String(props.ajoutFeedback?.platId) !== String(props.plat.id)
    ) return

    ajoutConfirme.value = true
    clearTimeout(minuteurConfirmation)
    minuteurConfirmation = setTimeout(() => {
      ajoutConfirme.value = false
      minuteurConfirmation = undefined
    }, 1200)
  },
)

onUnmounted(() => {
  clearTimeout(minuteurConfirmation)
})
</script>

<template>
  <article class="dish-card">
    <div class="dish-photo">
      <img
        :src="resoudreImagePlat(plat, categorie)"
        :alt="plat.nom"
        loading="lazy"
        width="1200"
        height="800"
        @error="$emit('image-error', $event, plat, categorie)"
      />
    </div>
    <div class="dish-details">
      <p class="dish-category">{{ categorie.nom }}</p>
      <h3>{{ plat.nom }}</h3>
      <p class="dish-description">{{ plat.description }}</p>
      <div class="dish-footer">
        <p class="dish-price">{{ formaterPrix(plat.prix) }}</p>
        <button
          v-if="afficherAjout"
          type="button"
          class="add-button"
          :aria-label="`Add ${plat.nom} to cart`"
          @click="emit('add', plat)"
        >
          <svg
            v-if="!ajoutConfirme"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dish-card {
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 32px;
  background: rgba(20, 20, 20, 0.78);
  backdrop-filter: blur(16px);
  transition: transform 0.3s, border-color 0.3s;
}

.dish-card:hover {
  transform: translateY(-6px);
  border-color: rgba(249, 115, 22, 0.4);
}

.dish-photo {
  position: relative;
  height: 220px;
  overflow: hidden;
  margin: 12px 12px 0;
  border-radius: 24px;
  background: #151515;
}

.dish-photo::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 55%, rgba(0, 0, 0, 0.6));
  content: '';
  pointer-events: none;
}

.dish-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-details {
  display: flex;
  min-height: 207px;
  flex-direction: column;
  padding: 14px 27px 27px;
}

.dish-category {
  margin: 0;
  color: #f97316;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.dish-details h3 {
  margin: 10px 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

.dish-description {
  min-height: 58px;
  margin: 0;
  color: #7a7a7a;
  font-size: 12px;
  line-height: 1.6;
}

.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}

.dish-price {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.add-button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
  cursor: pointer;
  transition: transform 0.18s, background 0.18s;
}

.add-button:hover {
  transform: translateY(-2px);
  background: #ffa64d;
}

.add-button:active {
  transform: scale(0.95);
}

.add-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.add-button svg {
  width: 20px;
  height: 20px;
}
</style>
