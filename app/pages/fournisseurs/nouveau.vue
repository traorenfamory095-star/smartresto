<script setup>
const { creer } = useFournisseurs()
const router = useRouter()
const { succes, erreur } = useNotifier()

const categories = ['Poissons', 'Viandes', 'Légumes et fruits', 'Boissons']
const form = reactive({ nom: '', categorie: '', contact: '', telephone: '', email: '', adresse: '' })
const envoi = ref(false)
const erreurFormulaire = ref('')

const champ =
  'h-12 w-full min-w-0 rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

async function soumettre() {
  if (envoi.value) return
  const donnees = Object.fromEntries(Object.entries(form).map(([cle, valeur]) => [cle, valeur.trim()]))
  if (!donnees.nom) {
    erreurFormulaire.value = 'Le nom du fournisseur est obligatoire.'
    return
  }
  if (!donnees.categorie) {
    erreurFormulaire.value = 'Choisissez une catégorie.'
    return
  }
  envoi.value = true
  try {
    await creer(donnees)
    succes('Fournisseur créé')
    router.push('/fournisseurs')
  } catch (e) {
    erreur(e.message)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-5">
    <header class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <NuxtLink
        to="/fournisseurs"
        class="rounded-md text-xs text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <span aria-hidden="true">←</span> Retour aux fournisseurs
      </NuxtLink>
      <div class="min-w-0 flex-1 sm:border-l sm:border-white/[0.13] sm:pl-5">
        <h1 class="text-xl font-bold text-white">Nouveau fournisseur</h1>
        <p class="mt-1 text-xs text-neutral-500">Enregistrez les coordonnées de votre partenaire</p>
      </div>
    </header>

    <form
      class="rounded-3xl border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8"
      novalidate
      @submit.prevent="soumettre"
    >
      <h2 class="mb-1 text-sm font-semibold text-white">Informations du fournisseur</h2>
      <p class="mb-6 text-xs text-neutral-500">Les champs marqués d'un astérisque sont obligatoires.</p>

      <p v-if="erreurFormulaire" class="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300" role="alert">
        {{ erreurFormulaire }}
      </p>

      <div class="grid gap-[18px] sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300 sm:col-span-2">
          <span>Nom <span class="text-orange-500">*</span></span>
          <input v-model="form.nom" required autocomplete="organization" placeholder="Ex. : Maraîchers de Virunga" :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Catégorie <span class="text-orange-500">*</span></span>
          <select v-model="form.categorie" required :class="champ">
            <option value="" disabled>Sélectionnez une catégorie</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Contact</span>
          <input v-model="form.contact" autocomplete="name" placeholder="Nom du contact" :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Téléphone</span>
          <input v-model="form.telephone" type="tel" autocomplete="tel" placeholder="+243 ..." :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Adresse e-mail</span>
          <input v-model="form.email" type="email" autocomplete="email" placeholder="contact@exemple.com" :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300 sm:col-span-2">
          <span>Adresse</span>
          <input v-model="form.adresse" autocomplete="street-address" placeholder="Adresse complète" :class="champ" />
        </label>
      </div>

      <div class="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.13] pt-5 sm:flex-row sm:justify-end">
        <NuxtLink
          to="/fournisseurs"
          class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          Annuler
        </NuxtLink>
        <button
          type="submit"
          :disabled="envoi"
          class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:cursor-wait disabled:opacity-60"
        >
          {{ envoi ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </main>
</template>