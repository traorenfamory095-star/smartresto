<script setup>
const api = useApi()
const { succes, erreur } = useNotifier()

const plats = ref([])
const categories = ref([])
const chargement = ref(true)
const erreurMsg = ref('')
const recherche = ref('')
const filtreCategorie = ref('')
const disponiblesSeulement = ref(false)
const enCours = ref(new Set())
// Suppression : { plat, etape: 'verification' | 'confirmer' | 'bloque', nb }
const dialogue = ref(null)
const suppressionEnCours = ref(false)

const btnPrimaire =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]'

const nomCategorie = (id) => categories.value.find(c => String(c.id) === String(id))?.nom ?? 'Sans catégorie'

// Les filtres se combinent : recherche + catégorie + disponibilité
const liste = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  const ordre = new Map(categories.value.map(c => [String(c.id), Number(c.ordre) || 0]))
  return plats.value
    .filter(p => !q || p.nom.toLowerCase().includes(q))
    .filter(p => !filtreCategorie.value || String(p.categorieId) === filtreCategorie.value)
    .filter(p => !disponiblesSeulement.value || p.disponible)
    .sort((a, b) =>
      (ordre.get(String(a.categorieId)) ?? 99) - (ordre.get(String(b.categorieId)) ?? 99) ||
      a.nom.localeCompare(b.nom, 'fr')
    )
})

async function charger() {
  chargement.value = true
  erreurMsg.value = ''
  try {
    const [p, c] = await Promise.all([api.lire('/plats'), api.lire('/categories')])
    plats.value = Array.isArray(p) ? p : []
    categories.value = Array.isArray(c) ? c : []
  } catch (e) {
    erreurMsg.value = e.message || 'Erreur inconnue.'
  } finally {
    chargement.value = false
  }
}

// Bascule disponible / indisponible : PATCH sans recharger la page.
// L'affichage change tout de suite, et revient en arrière si la requête échoue.
async function basculer(plat) {
  if (enCours.value.has(plat.id)) return
  enCours.value.add(plat.id)
  const nouvelEtat = !plat.disponible
  plat.disponible = nouvelEtat
  try {
    await api.modifier(`/plats/${plat.id}`, { disponible: nouvelEtat })
    succes(nouvelEtat ? `${plat.nom} est disponible` : `${plat.nom} est indisponible`)
  } catch (e) {
    plat.disponible = !nouvelEtat
    erreur(e.message)
  } finally {
    enCours.value.delete(plat.id)
  }
}

// Règle métier : un plat déjà présent dans une ligne de commande ne se supprime pas
async function demanderSuppression(plat) {
  dialogue.value = { plat, etape: 'verification', nb: 0 }
  try {
    const lignes = await api.lire('/lignesCommande', { platId: plat.id })
    const nb = Array.isArray(lignes) ? lignes.length : 0
    dialogue.value = { plat, etape: nb ? 'bloque' : 'confirmer', nb }
  } catch (e) {
    erreur(e.message)
    dialogue.value = null
  }
}

async function confirmerSuppression() {
  if (suppressionEnCours.value || !dialogue.value) return
  const { plat } = dialogue.value
  suppressionEnCours.value = true
  try {
    await api.supprimer(`/plats/${plat.id}`)
    plats.value = plats.value.filter(p => p.id !== plat.id)
    succes('Plat supprimé')
    dialogue.value = null
  } catch (e) {
    erreur(e.message)
  } finally {
    suppressionEnCours.value = false
  }
}

async function rendreIndisponible() {
  if (!dialogue.value) return
  const { plat } = dialogue.value
  dialogue.value = null
  if (plat.disponible) await basculer(plat)
}

onMounted(charger)
</script>

<template>
  <main class="space-y-5">
    <h1 class="sr-only">Plats</h1>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.13] bg-[#111] px-3.5 text-neutral-500 focus-within:border-orange-500 sm:min-w-[240px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
        </svg>
        <span class="sr-only">Rechercher un plat</span>
        <input v-model="recherche" type="search" placeholder="Rechercher un plat..." class="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500" />
      </label>
      <label>
        <span class="sr-only">Filtrer par catégorie</span>
        <select v-model="filtreCategorie" class="h-11 min-w-[160px] rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-orange-500">
          <option value="">Toutes</option>
          <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.nom }}</option>
        </select>
      </label>
      <label class="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.13] bg-[#111] px-3.5 text-xs text-neutral-400">
        <input v-model="disponiblesSeulement" type="checkbox" class="accent-orange-500" />
        <span>Disponibles seulement</span>
      </label>
      <NuxtLink to="/plats/nouveau" :class="btnPrimaire" class="w-full sm:w-auto">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Nouveau plat
      </NuxtLink>
    </div>

    <p v-if="chargement" class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 py-14 text-center text-sm text-neutral-400" role="status">Chargement des plats…</p>

    <div v-else-if="erreurMsg" class="rounded-[20px] border border-red-500/25 bg-red-500/10 px-5 py-6 text-center" role="alert">
      <p class="font-semibold text-red-300">Impossible de charger les plats.</p>
      <p class="mt-1 text-sm text-neutral-400">{{ erreurMsg }}</p>
      <button type="button" class="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger">Réessayer</button>
    </div>

    <template v-else-if="liste.length">
      <p class="text-[11px] text-neutral-400" aria-live="polite">{{ liste.length }} plat(s) sur {{ plats.length }}</p>
      <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="p in liste" :key="p.id">
          <PlatsCarte
            :plat="p"
            :categorie="nomCategorie(p.categorieId)"
            :occupe="enCours.has(p.id)"
            @basculer="basculer"
            @supprimer="demanderSuppression"
          />
        </li>
      </ul>
    </template>

    <div v-else class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 px-5 py-14 text-center">
      <p class="font-semibold text-white">{{ plats.length ? 'Aucun plat trouvé' : 'Aucun plat enregistré' }}</p>
      <p class="mt-1 text-sm text-neutral-400">{{ plats.length ? 'Modifiez la recherche ou les filtres.' : 'Ajoutez votre premier plat au menu.' }}</p>
    </div>

    <!-- Fenêtre de suppression -->
    <div v-if="dialogue" class="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm" @keydown.esc="dialogue = null" @mousedown.self="dialogue = null">
      <div class="w-full max-w-md rounded-3xl border border-white/[0.13] bg-[#141414] p-7 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="titre-dialogue">
        <template v-if="dialogue.etape === 'verification'">
          <h2 id="titre-dialogue" class="text-lg font-bold text-white">Vérification…</h2>
          <p class="mt-2 text-sm text-neutral-400" role="status">Recherche des commandes qui contiennent « {{ dialogue.plat.nom }} ».</p>
        </template>

        <template v-else-if="dialogue.etape === 'bloque'">
          <h2 id="titre-dialogue" class="text-lg font-bold text-white">Suppression impossible</h2>
          <p class="mt-2 text-sm leading-relaxed text-neutral-300">
            « {{ dialogue.plat.nom }} » figure dans {{ dialogue.nb }} ligne(s) de commande : le supprimer fausserait l'historique.
            <template v-if="dialogue.plat.disponible">Vous pouvez le rendre indisponible : il n'apparaîtra plus à la carte ni à la prise de commande.</template>
            <template v-else>Il est déjà indisponible : il n'apparaît plus à la carte ni à la prise de commande.</template>
          </p>
          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" autofocus class="min-h-[44px] rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-white/10" @click="dialogue = null">Fermer</button>
            <button v-if="dialogue.plat.disponible" type="button" class="min-h-[44px] rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white transition hover:brightness-110" @click="rendreIndisponible">
              Rendre indisponible
            </button>
          </div>
        </template>

        <template v-else>
          <h2 id="titre-dialogue" class="text-lg font-bold text-white">Supprimer ce plat ?</h2>
          <p class="mt-2 text-sm text-neutral-300">« {{ dialogue.plat.nom }} » sera supprimé définitivement du menu.</p>
          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" autofocus class="min-h-[44px] rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-white/10" @click="dialogue = null">Annuler</button>
            <button type="button" :disabled="suppressionEnCours" class="min-h-[44px] rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60" @click="confirmerSuppression">
              {{ suppressionEnCours ? 'Suppression…' : 'Oui, supprimer' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>