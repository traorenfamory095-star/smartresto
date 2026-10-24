<script setup>
// Champ de formulaire avec étiquette, aide et message d'erreur accessibles. Propriétaire : Traoré (socle).
//
//   <UiChamp v-model="form.nom" label="Nom" requis :erreur="erreurs.nom" />
//   <UiChamp v-model="form.prix" label="Prix ($)" type="number" step="0.5" min="0" />
//   <UiChamp v-model="form.description" label="Description" as="textarea" rows="3" />
//   <UiChamp v-model="form.categorieId" label="Catégorie" as="select">
//     <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nom }}</option>
//   </UiChamp>
//
// Les autres attributs (name, placeholder, step, min, rows...) sont transmis au champ lui-même.
// Avec type="number", la valeur du v-model est un NOMBRE (ou '' si le champ est vide).
defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  as: {
    type: String,
    default: 'input',
    validator: (v) => ['input', 'textarea', 'select'].includes(v),
  },
  erreur: { type: String, default: '' },
  aide: { type: String, default: '' },
  requis: Boolean,
})

const modele = defineModel({ default: '' })
const id = useId()

const decrit = computed(() => (props.erreur ? `${id}-erreur` : props.aide ? `${id}-aide` : undefined))

function surSaisie(evenement) {
  const cible = evenement.target
  if (props.type === 'number' && props.as === 'input') {
    modele.value = cible.value === '' ? '' : cible.valueAsNumber
  } else {
    modele.value = cible.value
  }
}

const classesChamp = computed(() => [
  'min-h-11 w-full rounded-xl border bg-carte-solide px-3.5 py-2 text-sm text-texte',
  'placeholder:text-gris-doux focus:outline-2 focus:outline-offset-1 focus:outline-accent',
  props.erreur ? 'border-erreur' : 'border-bordure',
])
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-medium">
      {{ label }}<span v-if="requis" class="text-accent" aria-hidden="true"> *</span>
    </label>

    <select
      v-if="as === 'select'"
      :id="id"
      v-bind="$attrs"
      v-model="modele"
      :required="requis"
      :aria-invalid="erreur ? 'true' : undefined"
      :aria-describedby="decrit"
      :class="classesChamp"
    >
      <slot />
    </select>

    <textarea
      v-else-if="as === 'textarea'"
      :id="id"
      v-bind="$attrs"
      :value="modele"
      :required="requis"
      :aria-invalid="erreur ? 'true' : undefined"
      :aria-describedby="decrit"
      :class="classesChamp"
      @input="surSaisie"
    />

    <input
      v-else
      :id="id"
      v-bind="$attrs"
      :type="type"
      :value="modele"
      :required="requis"
      :aria-invalid="erreur ? 'true' : undefined"
      :aria-describedby="decrit"
      :class="classesChamp"
      @input="surSaisie"
    />

    <p v-if="erreur" :id="`${id}-erreur`" role="alert" class="mt-1.5 text-xs text-erreur">{{ erreur }}</p>
    <p v-else-if="aide" :id="`${id}-aide`" class="mt-1.5 text-xs text-gris">{{ aide }}</p>
  </div>
</template>
