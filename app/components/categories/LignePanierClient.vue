<script setup>
defineProps({
  ligne: { type: Object, required: true },
})

const emit = defineEmits(['changerQuantite', 'retirer', 'modifierRemarque'])
</script>

<template>
  <li class="cart-line">
    <div class="line-main">
      <div class="line-label">
        <p class="line-name">{{ ligne.nom }}</p>
        <p class="unit-price">{{ formaterPrix(ligne.prixUnitaire) }} / unité</p>
      </div>

      <div class="quantity-stepper" :aria-label="`Quantité de ${ligne.nom}`">
        <button
          type="button"
          :aria-label="`Diminuer la quantité de ${ligne.nom}`"
          @click="emit('changerQuantite', ligne.platId, ligne.quantite - 1)"
        >
          −
        </button>
        <span aria-live="polite">{{ ligne.quantite }}</span>
        <button
          type="button"
          :aria-label="`Augmenter la quantité de ${ligne.nom}`"
          @click="emit('changerQuantite', ligne.platId, ligne.quantite + 1)"
        >
          +
        </button>
      </div>

      <p class="line-total">{{ formaterPrix(montantLigneCentimes(ligne) / 100) }}</p>

      <button
        type="button"
        class="remove-button"
        :aria-label="`Retirer ${ligne.nom} du panier`"
        @click="emit('retirer', ligne.platId)"
      >
        Retirer
      </button>
    </div>

    <label class="note-field">
      <span class="sr-only">Remarque pour {{ ligne.nom }}</span>
      <input
        :value="ligne.remarque"
        type="text"
        maxlength="120"
        placeholder="Ajouter une remarque..."
        @input="emit('modifierRemarque', ligne.platId, $event.target.value)"
      />
    </label>
  </li>
</template>

<style scoped>
.cart-line {
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.13);
  list-style: none;
}

.line-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.line-label {
  min-width: 0;
  flex: 1;
}

.line-name {
  overflow: hidden;
  margin: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-price {
  margin: 4px 0 0;
  color: #a3a3a3;
  font-size: 12px;
}

.quantity-stepper {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 9px;
  background: #0c0c0c;
  color: #fff;
  font-size: 12px;
}

.quantity-stepper button {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 7px;
  background: #222;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 18px;
}

.quantity-stepper button:hover {
  background: #333;
}

.quantity-stepper button:focus-visible,
.remove-button:focus-visible,
.note-field input:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 2px;
}

.line-total {
  min-width: 60px;
  margin: 0;
  color: #bbb;
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.remove-button {
  min-width: 40px;
  min-height: 40px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #ff8080;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.remove-button:hover {
  background: rgba(239, 68, 68, 0.1);
}

.note-field {
  display: block;
  margin-top: 10px;
}

.note-field input {
  width: 100%;
  height: 40px;
  padding: 0 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  outline: none;
  background: #0d0d0d;
  color: #fff;
  font: inherit;
  font-size: 12px;
}

.note-field input::placeholder {
  color: #7a7a7a;
}

.note-field input:focus,
.note-field input:focus-visible {
  border-color: #f97316;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 420px) {
  .line-main {
    flex-wrap: wrap;
  }

  .line-label {
    flex-basis: calc(100% - 115px);
  }

  .line-total {
    margin-left: auto;
  }
}
</style>
