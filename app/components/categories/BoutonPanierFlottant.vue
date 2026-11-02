<script setup>
defineProps({
  nombreArticles: { type: Number, required: true },
  total: { type: Number, required: true },
})

defineEmits(['ouvrir'])
</script>

<template>
  <button type="button" class="floating-cart" aria-haspopup="dialog" @click="$emit('ouvrir')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
    <span aria-live="polite">
      Ma commande · {{ libelleArticles(nombreArticles) }} · {{ formaterPrix(total) }}
    </span>
  </button>
</template>

<style scoped>
.floating-cart {
  position: fixed;
  z-index: 35;
  right: 24px;
  bottom: 24px;
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 11px;
  padding: 0 22px;
  border: 0;
  border-radius: 99px;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 12px 30px rgba(249, 115, 22, 0.35);
  transition: transform 0.2s, background 0.2s;
}

.floating-cart:hover {
  transform: translateY(-2px);
  background: #ffa64d;
}

.floating-cart:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 4px;
}

.floating-cart svg {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

@media (max-width: 600px) {
  .floating-cart {
    right: 16px;
    bottom: 16px;
    max-width: calc(100vw - 32px);
    padding: 0 18px;
    font-size: 12px;
  }
}
</style>
