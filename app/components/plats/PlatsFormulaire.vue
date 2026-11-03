<script setup>
const props = defineProps({
  categories: { type: Array, default: () => [] },
  initial: { type: Object, default: null },
  envoi: { type: Boolean, default: false },
  libelleBouton: { type: String, default: 'Enregistrer' }
})
const emit = defineEmits(['soumettre'])

const form = reactive({
  nom: '',
  categorieId: null,
  description: '',
  prix: '',
  tempsPreparationMin: '',
  disponible: true,
  imageUrl: ''
})
const erreurFormulaire = ref('')

const champ =
  'h-12 w-full min-w-0 rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

if (props.initial) {
  const p = props.initial
  Object.assign(form, {
    nom: p.nom ?? '',
    categorieId: p.categorieId ?? null,
    description: p.description ?? '',
    prix: p.prix ?? '',
    tempsPreparationMin: p.tempsPreparationMin ?? '',
    disponible: !!p.disponible,
    imageUrl: p.imageUrl ?? ''
  })
}

watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

function valider() {
  const nom = form.nom.trim()
  const prix = Number(form.prix)
  const temps = Number(form.tempsPreparationMin)
  const image = form.imageUrl.trim()

  if (!nom) return 'Le nom du plat est obligatoire.'
  if (form.categorieId == null || form.categorieId === '') return 'Choisissez une catégorie.'
  if (form.prix === '' || !Number.isFinite(prix) || prix <= 0) return 'Le prix doit être supérieur à 0.'
  if (!Number.isInteger(temps) || temps < 1) return 'Le temps de préparation doit être un nombre entier de minutes (1 minimum).'
  if (image && !/^https?:\/\/\S+$/i.test(image)) return "Le lien de l'image doit commencer par http:// ou https://."
  return ''
}

function soumettre() {
  if (props.envoi) return
  erreurFormulaire.value = valider()
  if (erreurFormulaire.value) return
  emit('soumettre', {
    nom: form.nom.trim(),
    categorieId: form.categorieId,
    description: form.description.trim(),
    prix: Math.round(Number(form.prix) * 100) / 100,
    tempsPreparationMin: Number(form.tempsPreparationMin),
    disponible: form.disponible,
    imageUrl: form.imageUrl.trim()
  })
}
</script>

<template>
  <form class="rounded-3xl border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8" novalidate @submit.prevent="soumettre">
    <p v-if="erreurFormulaire" class="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300" role="alert">{{ erreurFormulaire }}</p>

    <div class="grid gap-[18px] sm:grid-cols-2">
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
        <span>Nom <span class="text-orange-500">*</span></span>
        <input v-model="form.nom" required placeholder="Nom du plat" :class="champ" />
      </label>
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
        <span>Catégorie <span class="text-orange-500">*</span></span>
        <select v-model="form.categorieId" required :class="champ">
          <option :value="null" disabled>Sélectionnez une catégorie</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300 sm:col-span-2">
        <span>Description</span>
        <textarea v-model="form.description" rows="4" placeholder="Décrivez le plat..." class="w-full resize-y rounded-xl border border-white/[0.13] bg-[#0e0e0e] p-3.5 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
      </label>
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
        <span>Prix en USD <span class="text-orange-500">*</span></span>
        <input v-model="form.prix" required type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00" :class="champ" />
      </label>
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
        <span>Temps de préparation (min) <span class="text-orange-500">*</span></span>
        <input v-model="form.tempsPreparationMin" required type="number" min="1" step="1" inputmode="numeric" placeholder="20" :class="champ" />
      </label>
      <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300 sm:col-span-2">
        <span>Lien de l'image (facultatif)</span>
        <input v-model="form.imageUrl" type="url" placeholder="https://..." :class="champ" />
      </label>
      <label class="flex items-center gap-2.5 text-xs text-neutral-400 sm:col-span-2">
        <input v-model="form.disponible" type="checkbox" class="h-4 w-4 accent-orange-500" />
        <span>Plat disponible à la commande</span>
      </label>
    </div>

    <div class="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.13] pt-5 sm:flex-row sm:justify-end">
      <NuxtLink to="/plats" class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Annuler</NuxtLink>
      <button type="submit" :disabled="envoi" class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:cursor-wait disabled:opacity-60">
        {{ envoi ? 'Enregistrement…' : libelleBouton }}
      </button>
    </div>
  </form>
</template>