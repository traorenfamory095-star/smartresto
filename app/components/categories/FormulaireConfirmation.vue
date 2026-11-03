<script setup>
defineProps({
  tables: { type: Array, default: () => [] },
  tableId: { type: [String, Number], default: '' },
  nbCouverts: { type: [String, Number], default: 2 },
  note: { type: String, default: '' },
  erreurs: { type: Object, default: () => ({}) },
  chargementTables: { type: Boolean, default: false },
  erreurTables: { type: [Object, null], default: null },
  envoi: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:tableId',
  'update:nbCouverts',
  'update:note',
  'retour',
  'confirmer',
  'reessayer',
])
</script>

<template>
  <form class="confirmation-form" novalidate @submit.prevent="emit('confirmer')">
    <p class="form-intro">Choisissez une table et indiquez le nombre de personnes.</p>

    <div v-if="chargementTables" class="inline-state" role="status">
      <span class="loader" aria-hidden="true" />
      Chargement des tables…
    </div>
    <div v-else-if="erreurTables || tables.length === 0" class="inline-error" role="alert">
      <p>{{ erreurTables?.message || 'Aucune table disponible pour le moment.' }}</p>
      <button type="button" class="text-button" :disabled="envoi" @click="emit('reessayer')">
        Réessayer
      </button>
    </div>

    <label class="field">
      <span>Table</span>
      <select
        :value="tableId"
        :disabled="chargementTables || envoi || !tables.length"
        :aria-invalid="Boolean(erreurs.tableId)"
        :aria-describedby="erreurs.tableId ? 'table-error' : undefined"
        @change="emit('update:tableId', $event.target.value)"
      >
        <option value="">Choisir une table</option>
        <option v-for="table in tables" :key="table.id" :value="table.id">
          Table {{ table.numero }} · {{ table.capacite }} places
        </option>
      </select>
      <span v-if="erreurs.tableId" id="table-error" class="field-error">{{ erreurs.tableId }}</span>
    </label>

    <label class="field">
      <span>Nombre de couverts</span>
      <input
        :value="nbCouverts"
        type="number"
        min="1"
        :max="tables.find((table) => String(table.id) === String(tableId))?.capacite || undefined"
        :disabled="envoi"
        :aria-invalid="Boolean(erreurs.nbCouverts)"
        :aria-describedby="erreurs.nbCouverts ? 'covers-error' : undefined"
        @input="emit('update:nbCouverts', $event.target.value)"
      />
      <span v-if="erreurs.nbCouverts" id="covers-error" class="field-error">
        {{ erreurs.nbCouverts }}
      </span>
    </label>

    <label class="field">
      <span>Note pour la cuisine <small>(facultatif)</small></span>
      <textarea
        :value="note"
        rows="4"
        maxlength="200"
        :disabled="envoi"
        :aria-invalid="Boolean(erreurs.note)"
        :aria-describedby="erreurs.note ? 'note-error' : undefined"
        placeholder="Allergies ou précisions..."
        @input="emit('update:note', $event.target.value)"
      />
      <span v-if="erreurs.note" id="note-error" class="field-error">{{ erreurs.note }}</span>
    </label>

    <div class="form-actions">
      <button type="button" class="secondary-button" :disabled="envoi" @click="emit('retour')">
        Retour au panier
      </button>
      <button
        type="submit"
        class="primary-button"
        :disabled="envoi || chargementTables || !tables.length"
      >
        <span v-if="envoi" class="button-loader" aria-hidden="true" />
        {{ envoi ? 'Enregistrement…' : 'Confirmer la commande' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.confirmation-form {
  display: grid;
  gap: 18px;
}

.form-intro {
  margin: 0;
  color: #a3a3a3;
  font-size: 13px;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 9px;
  color: #bdbdbd;
  font-size: 12px;
  font-weight: 500;
}

.field small {
  color: #7a7a7a;
  font-size: 11px;
  font-weight: 400;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 12px;
  outline: none;
  background: #0e0e0e;
  color: #fff;
  font: inherit;
  font-size: 13px;
}

.field select:disabled,
.field input:disabled,
.field textarea:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.field textarea {
  min-height: 104px;
  padding: 14px;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus,
.field input:focus-visible,
.field select:focus-visible,
.field textarea:focus-visible {
  border-color: #f97316;
  outline: 2px solid rgba(249, 115, 22, 0.3);
  outline-offset: 2px;
}

.field [aria-invalid='true'] {
  border-color: #ef4444;
}

.field-error {
  color: #ef4444;
  font-size: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  padding: 0 15px;
  border: 0;
  border-radius: 11px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
}

.secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
}

.primary-button:hover:not(:disabled) {
  background: #ffa64d;
}

.primary-button:disabled,
.secondary-button:disabled,
.text-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.primary-button:focus-visible,
.secondary-button:focus-visible,
.text-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.inline-state,
.inline-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: #111;
  color: #a3a3a3;
  font-size: 12px;
}

.inline-error {
  align-items: flex-start;
  flex-direction: column;
  border-color: rgba(239, 68, 68, 0.3);
}

.inline-error p {
  margin: 0;
  color: #ff8080;
}

.text-button {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #f97316;
  border-radius: 9px;
  background: #151515;
  color: #ffa64d;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.loader,
.button-loader {
  width: 16px;
  height: 16px;
  border: 2px solid #f97316;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.button-loader {
  width: 14px;
  height: 14px;
  border-color: rgba(255, 255, 255, 0.8);
  border-top-color: transparent;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 420px) {
  .form-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
