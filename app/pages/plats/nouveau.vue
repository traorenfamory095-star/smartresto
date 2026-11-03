<script setup>
const api = useApi()
const router = useRouter()
const { succes, erreur } = useNotifier()

const categories = ref([])
const chargement = ref(true)
const erreurMsg = ref('')
const envoi = ref(false)

async function charger() {
  chargement.value = true
  erreurMsg.value = ''
  try {
    const c = await api.lire('/categories')
    categories.value = (Array.isArray(c) ? c : []).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
  } catch (e) {
    erreurMsg.value = e.message || 'Erreur inconnue.'
  } finally {
    chargement.value = false
  }
}

async function creer(donnees) {
  envoi.value = true
  try {
    await api.creer('/plats', donnees)
    succes('Plat créé')
    router.push('/plats')
  } catch (e) {
    erreur(e.message)
  } finally {
    envoi.value = false
  }
}

onMounted(charger)
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-5">
    <header class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <NuxtLink to="/plats" class="rounded-md text-xs text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
        <span aria-hidden="true">←</span> Retour aux plats
      </NuxtLink>
      <div class="min-w-0 flex-1 sm:border-l sm:border-white/[0.13] sm:pl-5">
        <h1 class="text-xl font-bold text-white">Nouveau plat</h1>
        <p class="mt-1 text-xs text-neutral-500">Ajoutez un plat au menu du restaurant</p>
      </div>
    </header>

    <p v-if="chargement" class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 py-14 text-center text-sm text-neutral-400" role="status">Chargement des catégories…</p>

    <div v-else-if="erreurMsg" class="rounded-[20px] border border-red-500/25 bg-red-500/10 px-5 py-6 text-center" role="alert">
      <p class="font-semibold text-red-300">Impossible de charger les catégories.</p>
      <p class="mt-1 text-sm text-neutral-400">{{ erreurMsg }}</p>
      <button type="button" class="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger">Réessayer</button>
    </div>

    <PlatsFormulaire v-else :categories="categories" :envoi="envoi" libelle-bouton="Enregistrer" @soumettre="creer" />
  </main>
</template>