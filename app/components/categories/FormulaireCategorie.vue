<script setup>
const props = defineProps({
  categorie: { type: Object, default: null },
  ordreParDefaut: { type: Number, required: true },
  erreurs: { type: Object, default: () => ({}) },
  enregistrement: { type: Boolean, default: false },
})

const emit = defineEmits(['enregistrer', 'annuler'])
const nomChamp = ref(null)
const formulaire = reactive({
  nom: '',
  ordre: 1,
  description: '',
})

watch(
  () => [props.categorie, props.ordreParDefaut],
  () => {
    formulaire.nom = props.categorie?.nom ?? ''
    formulaire.ordre = props.categorie?.ordre ?? props.ordreParDefaut
    formulaire.description = props.categorie?.description ?? ''
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  nomChamp.value?.focus()
})

function enregistrer() {
  emit('enregistrer', {
    nom: formulaire.nom,
    ordre: formulaire.ordre,
    description: formulaire.description,
  })
}
</script>

<template>
  <form class="category-form" novalidate @submit.prevent="enregistrer">
    <div class="form-grid">
      <label class="form-field">
        <span>Name</span>
        <input
          ref="nomChamp"
          v-model="formulaire.nom"
          type="text"
          autocomplete="off"
          aria-required="true"
          :aria-invalid="Boolean(erreurs.nom)"
          :aria-describedby="erreurs.nom ? 'category-name-error' : undefined"
        />
        <small v-if="erreurs.nom" id="category-name-error" class="field-error">
          {{ erreurs.nom }}
        </small>
      </label>

      <label class="form-field">
        <span>Order</span>
        <input
          v-model="formulaire.ordre"
          type="number"
          min="1"
          step="1"
          aria-required="true"
          :aria-invalid="Boolean(erreurs.ordre)"
          :aria-describedby="erreurs.ordre ? 'category-order-error' : undefined"
        />
        <small v-if="erreurs.ordre" id="category-order-error" class="field-error">
          {{ erreurs.ordre }}
        </small>
      </label>

      <label class="form-field form-field-wide">
        <span>Description <span class="optional">(optional)</span></span>
        <textarea
          v-model="formulaire.description"
          rows="4"
          :aria-invalid="Boolean(erreurs.description)"
          :aria-describedby="erreurs.description ? 'category-description-error' : undefined"
        />
        <small
          v-if="erreurs.description"
          id="category-description-error"
          class="field-error"
        >
          {{ erreurs.description }}
        </small>
      </label>
    </div>

    <footer class="modal-actions">
      <button
        type="button"
        class="button button-muted"
        :disabled="enregistrement"
        @click="emit('annuler')"
      >
        Cancel
      </button>
      <button type="submit" class="button button-primary" :disabled="enregistrement">
        {{ enregistrement ? 'Saving…' : 'Save' }}
      </button>
    </footer>
  </form>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
  color: #bdbdbd;
  font-size: 12px;
  font-weight: 500;
}

.form-field input,
.form-field textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 12px;
  outline: none;
  background: #0e0e0e;
  color: #fff;
  font: inherit;
  font-size: 14px;
}

.form-field input {
  height: 48px;
  padding: 0 14px;
}

.form-field textarea {
  min-height: 112px;
  padding: 14px;
  resize: vertical;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #f97316;
}

.form-field input[aria-invalid='true'],
.form-field textarea[aria-invalid='true'] {
  border-color: #ef4444;
}

.optional {
  color: #7a7a7a;
  font-weight: 400;
}

.field-error {
  color: #ef4444;
  font-size: 10px;
  font-weight: 400;
}

.form-field-wide {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 28px;
}

.button {
  min-height: 42px;
  padding: 0 17px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  transition: transform 0.2s, background 0.2s, opacity 0.2s;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.button-muted {
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
}

.button-muted:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.button-primary {
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #ffa64d;
}

.button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field-wide {
    grid-column: auto;
  }
}
</style>
