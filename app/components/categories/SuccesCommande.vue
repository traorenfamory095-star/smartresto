<script setup>
defineProps({
  resume: { type: Object, required: true },
})

const emit = defineEmits(['fermer'])
</script>

<template>
  <section class="success-state" aria-live="polite">
    <div class="success-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="m5 12 5 5L20 7" />
      </svg>
    </div>
    <p class="success-eyebrow">C'EST ENREGISTRÉ</p>
    <h3>Merci pour votre commande !</h3>
    <p class="success-description">
      La commande <strong>#{{ resume.commandeId }}</strong> est enregistrée pour
      <strong>la table {{ resume.tableNumero ?? resume.tableId }}</strong>.
    </p>
    <div class="success-total">
      <span>{{ libelleArticles(resume.nbArticles) }}</span>
      <strong>{{ formaterPrix(resume.total) }}</strong>
    </div>
    <button type="button" class="done-button" @click="emit('fermer')">
      Continuer à découvrir la carte
    </button>
  </section>
</template>

<style scoped>
.success-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 28px 4px 12px;
  text-align: center;
}

.success-icon {
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.12);
  color: #ffa64d;
}

.success-icon svg {
  width: 30px;
  height: 30px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.success-eyebrow {
  margin: 21px 0 7px;
  color: #f97316;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

.success-state h3 {
  margin: 0;
  color: #fff;
  font-size: 21px;
  font-weight: 600;
}

.success-description {
  margin: 11px 0 0;
  color: #a3a3a3;
  font-size: 13px;
  line-height: 1.6;
}

.success-description strong {
  color: #fff;
}

.success-total {
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-top: 25px;
  padding: 17px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.13);
  border-bottom: 1px solid rgba(255, 255, 255, 0.13);
  color: #a3a3a3;
  font-size: 13px;
}

.success-total strong {
  color: #fff;
  font-size: 16px;
}

.done-button {
  width: 100%;
  min-height: 46px;
  margin-top: 23px;
  border: 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.done-button:hover {
  background: #ffa64d;
}

.done-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}
</style>
