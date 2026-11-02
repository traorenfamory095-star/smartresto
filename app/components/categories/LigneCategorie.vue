<script setup>
defineProps({
  categorie: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  nombrePlats: { type: Number, default: 0 },
  operation: { type: String, default: null },
})

const emit = defineEmits(['monter', 'descendre', 'modifier', 'supprimer'])
</script>

<template>
  <li class="category-row">
    <span class="position-marker">{{ String(categorie.ordre).padStart(2, '0') }}</span>

    <div class="category-info">
      <p class="category-name">{{ categorie.nom }}</p>
      <p class="category-description">{{ categorie.description || 'No description' }}</p>
      <span class="dish-count mobile-dish-count">{{ libellePlats(nombrePlats) }}</span>
    </div>

    <span class="dish-count desktop-dish-count">{{ libellePlats(nombrePlats) }}</span>

    <div class="order-actions" aria-label="Change category order">
      <button
        type="button"
        class="order-button"
        :disabled="index === 0 || operation !== null"
        :aria-label="`Up ${categorie.nom}`"
        @click="emit('monter', categorie.id)"
      >
        ▲
      </button>
      <button
        type="button"
        class="order-button"
        :disabled="index === total - 1 || operation !== null"
        :aria-label="`Down ${categorie.nom}`"
        @click="emit('descendre', categorie.id)"
      >
        ▼
      </button>
    </div>

    <div class="category-actions">
      <button
        type="button"
        class="edit-button"
        :disabled="operation !== null"
        :aria-label="`Edit ${categorie.nom}`"
        @click="emit('modifier', categorie)"
      >
        Edit
      </button>
      <button
        type="button"
        class="delete-button"
        :disabled="operation !== null"
        :aria-label="`Delete ${categorie.nom}`"
        @click="emit('supprimer', categorie)"
      >
        Delete
      </button>
    </div>
  </li>
</template>

<style scoped>
.category-row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 0.6fr auto auto;
  align-items: center;
  gap: 15px;
  padding: 14px 5px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  list-style: none;
}

.category-row:first-child {
  border-top: 0;
}

.position-marker {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  font-size: 9px;
  font-weight: 700;
}

.category-info {
  min-width: 0;
}

.category-name {
  overflow: hidden;
  margin: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-description {
  overflow: hidden;
  margin: 4px 0 0;
  color: #7a7a7a;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-count {
  color: #a3a3a3;
  font-size: 9px;
  white-space: nowrap;
}

.mobile-dish-count {
  display: none;
}

.order-actions,
.category-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-button {
  width: 38px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 9px;
  background: #1d1d1d;
  color: #f97316;
  cursor: pointer;
  font-size: 10px;
}

.order-button:disabled {
  background: #141414;
  color: #444;
  cursor: not-allowed;
}

.edit-button,
.delete-button {
  height: 34px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
}

.edit-button {
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
}

.edit-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.delete-button {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.1);
  color: #ff8080;
}

.delete-button:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.edit-button:disabled,
.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.order-button:focus-visible,
.edit-button:focus-visible,
.delete-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 2px;
}

@media (max-width: 899px) {
  .category-row {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 10px;
  }

  .category-description {
    white-space: normal;
  }

  .desktop-dish-count {
    display: none;
  }

  .mobile-dish-count {
    display: inline-block;
    margin-top: 6px;
  }

  .order-actions,
  .category-actions {
    grid-column: 2 / -1;
  }
}

@media (max-width: 460px) {
  .category-row {
    column-gap: 8px;
  }

  .category-actions {
    justify-content: flex-start;
  }
}
</style>
