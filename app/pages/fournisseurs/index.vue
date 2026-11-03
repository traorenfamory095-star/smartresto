<script setup>
const { lister } = useFournisseurs()

const fournisseurs = ref([])
const chargement = ref(true)
const erreurMsg = ref('')
const recherche = ref('')
const categorie = ref('')

const btnPrimaire =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]'

const categories = computed(() => [...new Set(fournisseurs.value.map(f => f.categorie).filter(Boolean))])
const filtres = computed(() =>
  filtrerFournisseurs(fournisseurs.value, { recherche: recherche.value, categorie: categorie.value })
)

// Initiales : première lettre du premier et du dernier mot du nom
function initiales(nom = '') {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (!mots.length) return '?'
  const lettres = mots.length === 1 ? mots[0].slice(0, 2) : mots[0][0] + mots[mots.length - 1][0]
  return lettres.toUpperCase()
}

async function charger() {
  chargement.value = true
  erreurMsg.value = ''
  try {
    const liste = await lister()
    fournisseurs.value = Array.isArray(liste) ? liste : []
  } catch (e) {
    erreurMsg.value = e.message || 'Erreur inconnue.'
  } finally {
    chargement.value = false
  }
}

onMounted(charger)
</script>

<template>
  <main class="space-y-5">
    <h1 class="sr-only">Fournisseurs</h1>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.13] bg-[#111] px-3.5 text-neutral-500 focus-within:border-orange-500 sm:min-w-[260px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
        </svg>
        <span class="sr-only">Rechercher un fournisseur</span>
        <input
          v-model="recherche"
          type="search"
          placeholder="Rechercher un fournisseur..."
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
        />
      </label>
      <label>
        <span class="sr-only">Filtrer par catégorie</span>
        <select
          v-model="categorie"
          class="h-11 min-w-[160px] rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-orange-500"
        >
          <option value="">Toutes</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <NuxtLink to="/fournisseurs/nouveau" :class="btnPrimaire" class="w-full sm:w-auto">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Nouveau fournisseur
      </NuxtLink>
    </div>

    <p v-if="chargement" class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 py-14 text-center text-sm text-neutral-400" role="status">
      Chargement des fournisseurs…
    </p>

    <div v-else-if="erreurMsg" class="rounded-[20px] border border-red-500/25 bg-red-500/10 px-5 py-6 text-center" role="alert">
      <p class="font-semibold text-red-300">Impossible de charger les fournisseurs.</p>
      <p class="mt-1 text-sm text-neutral-400">{{ erreurMsg }}</p>
      <button type="button" class="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger">
        Réessayer
      </button>
    </div>

    <ul v-else-if="filtres.length" class="grid gap-4 md:grid-cols-2">
      <li v-for="f in filtres" :key="f.id">
        <article class="group h-full rounded-3xl border border-white/[0.13] bg-[#141414]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-orange-500/40">
          <div class="flex items-center justify-between gap-3">
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-orange-500/[0.13] text-sm font-bold text-orange-500">
              {{ initiales(f.nom) }}
            </span>
            <span class="truncate rounded-full bg-orange-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-orange-500">
              {{ f.categorie || 'Sans catégorie' }}
            </span>
          </div>
          <h2 class="my-5 text-[17px] font-semibold text-white">{{ f.nom }}</h2>
          <dl class="grid gap-3 border-y border-white/[0.13] py-4 sm:grid-cols-3">
            <div class="min-w-0">
              <dt class="text-[11px] text-neutral-500">Contact</dt>
              <dd class="mt-1 break-words text-xs font-semibold text-white">{{ f.contact || '—' }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[11px] text-neutral-500">Téléphone</dt>
              <dd class="mt-1 break-words text-xs font-semibold text-white">{{ f.telephone || '—' }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[11px] text-neutral-500">Adresse</dt>
              <dd class="mt-1 break-words text-xs font-semibold text-white">{{ f.adresse || '—' }}</dd>
            </div>
          </dl>
          <NuxtLink
            :to="`/fournisseurs/${f.id}`"
            class="mt-4 inline-flex items-center rounded-md text-xs font-medium text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Voir la fiche <span aria-hidden="true" class="ml-1.5 text-base text-orange-500">→</span>
          </NuxtLink>
        </article>
      </li>
    </ul>

    <div v-else class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 px-5 py-14 text-center">
      <p class="font-semibold text-white">
        {{ fournisseurs.length ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré' }}
      </p>
      <p class="mt-1 text-sm text-neutral-400">
        {{ fournisseurs.length ? 'Essayez une autre recherche ou une autre catégorie.' : 'Ajoutez votre premier fournisseur pour préparer vos commandes.' }}
      </p>
    </div>
  </main>
</template>